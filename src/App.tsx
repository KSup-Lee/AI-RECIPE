import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, ShoppingCart, Home, Users, Calendar, Refrigerator, ChefHat, LogOut, ChevronLeft, ChevronRight, Plus, AlertTriangle, Bookmark, Settings, User as UserIcon, Heart, ShoppingBag, Utensils, Zap, Sparkles, X, Clock, Flame, Share2, MoreHorizontal, CheckCircle, CalendarPlus, TrendingUp, AlertCircle, Minus, Bot, Moon, Leaf, Search as SearchIcon, Trash2, Edit2, Star, Send, Receipt, CreditCard, HelpCircle, Truck, Package, MessageCircle, Camera } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_POSTS, DUMMY_PRODUCTS, CATEGORIES, INGREDIENT_UNITS, ALLERGY_TAGS, DISEASE_TAGS, TODAY_MEAL, PREDEFINED_INGREDIENTS } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, CartItem, Post, DefaultMealSettings, IngredientCategory, PredefinedIngredient, MealPlanItem } from './types';

// [Firebase Imports]
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

// [추가] 사용자 통계 데이터 타입 정의
interface UserStats {
  points: number;
  coupons: number;
  reviews: number;
  shipping: number;
}

// --- Contexts ---
interface AuthContextType {
  user: User | null;
  login: (type: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DataContextType {
  recipes: Recipe[];
  fridge: Ingredient[];
  members: Member[];
  mealPlans: DailyMealPlan[];
  cart: CartItem[];
  posts: Post[];
  userStats: UserStats; // [추가] 사용자 통계 정보
  searchQuery: string;
  defaultSettings: DefaultMealSettings;
  setSearchQuery: (query: string) => void;
  addToCart: (product: any, qty: number) => void;
  removeFromCart: (id: string) => void;
  addIngredient: (item: Ingredient) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  addToMealPlan: (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipe: Recipe, specificMembers?: string[]) => void;
  removeFromMealPlan: (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string) => void;
  openMealModal: (recipe: Recipe) => void;
  updateMealMembers: (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string, memberId: string) => void;
  saveDefaultSettings: (settings: DefaultMealSettings) => void;
  mealModalData: { isOpen: boolean; recipe: Recipe | null };
  closeMealModal: () => void;
  cookRecipe: (recipe: Recipe) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

// --- AuthProvider (Firebase) ---
const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          username: firebaseUser.email || 'user',
          name: firebaseUser.displayName || '사용자',
          role: UserRole.USER,
          avatar: firebaseUser.photoURL || 'https://ui-avatars.com/api/?name=User'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (type: string) => {
    try {
      if (type === 'google') {
        await signInWithPopup(auth, googleProvider);
        return true;
      }
    } catch (error) {
      console.error("Login Failed", error);
      alert("로그인에 실패했습니다.");
    }
    return false;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- DataProvider (Firebase DB) ---
const DataProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>(DUMMY_RECIPES);
  const [fridge, setFridge] = useState<Ingredient[]>([]); 
  const [members, setMembers] = useState<Member[]>([]);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posts] = useState<Post[]>(DUMMY_POSTS);
  
  // [추가] 사용자 통계 상태 (기본값 0)
  const [userStats, setUserStats] = useState<UserStats>({ points: 0, coupons: 0, reviews: 0, shipping: 0 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultSettings, setDefaultSettings] = useState<DefaultMealSettings>({
    weekday: { BREAKFAST: [], LUNCH: [], DINNER: [] },
    weekend: { BREAKFAST: [], LUNCH: [], DINNER: [] }
  });
  const [mealModalData, setMealModalData] = useState<{ isOpen: boolean; recipe: Recipe | null }>({ isOpen: false, recipe: null });

  useEffect(() => {
    if (!user) {
        setFridge([]);
        setMembers([]);
        setMealPlans([]);
        setUserStats({ points: 0, coupons: 0, reviews: 0, shipping: 0 });
        return;
    }

    // 1. 레시피 실시간 동기화
    const recipesUnsub = onSnapshot(collection(db, 'recipes'), (snapshot) => {
        const loadedRecipes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
        if (loadedRecipes.length > 0) setRecipes(loadedRecipes);
    });

    // 2. 냉장고, 멤버, 식단 동기화 (하위 컬렉션)
    const fridgeUnsub = onSnapshot(collection(db, 'users', user.id, 'fridge'), (snapshot) => {
        setFridge(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient)));
    });
    const membersUnsub = onSnapshot(collection(db, 'users', user.id, 'members'), (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member)));
    });
    const mealsUnsub = onSnapshot(collection(db, 'users', user.id, 'mealPlans'), (snapshot) => {
        const newMeals = snapshot.docs.map(doc => ({ ...doc.data(), date: doc.id } as DailyMealPlan));
        if (newMeals.length === 0) setMealPlans([TODAY_MEAL]); 
        else setMealPlans(newMeals);
    });

    // 3. [추가] 사용자 통계 정보 (포인트, 쿠폰 등) 동기화
    // users 컬렉션의 내 문서(user.id)를 직접 구독합니다.
    const userDocRef = doc(db, 'users', user.id);
    const userStatsUnsub = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setUserStats({
                points: data.points || 0,
                coupons: data.coupons || 0,
                reviews: data.reviews || 0,
                shipping: data.shipping || 0
            });
        } else {
            // 문서가 없으면(첫 로그인 등) 기본값으로 생성해줍니다. (웰컴 선물!)
            setDoc(userDocRef, { 
                points: 2000, // 웰컴 포인트
                coupons: 5,   // 웰컴 쿠폰
                reviews: 0, 
                shipping: 0 
            }, { merge: true });
        }
    });

    return () => { fridgeUnsub(); membersUnsub(); mealsUnsub(); recipesUnsub(); userStatsUnsub(); };
  }, [user]);

  const addToCart = (product: any, quantity: number) => setCart(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), product, quantity }]);
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const addIngredient = async (item: Ingredient) => {
    if (!user) return;
    const { id, ...data } = item; 
    await addDoc(collection(db, 'users', user.id, 'fridge'), data);
  };
  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id, 'fridge', id), updates);
  };
  const deleteIngredient = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'fridge', id));
  };
  const addMember = async (member: Member) => {
    if (!user) return;
    const { id, ...data } = member;
    await addDoc(collection(db, 'users', user.id, 'members'), data);
  };
  const updateMember = async (id: string, updates: Partial<Member>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id, 'members', id), updates);
  };
  const deleteMember = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'members', id));
  };

  const addToMealPlan = async (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipe: Recipe, specificMembers?: string[]) => {
    if (!user) return;
    const initialMembers = specificMembers || (new Date(date).getDay() % 6 === 0 ? defaultSettings.weekend[type] : defaultSettings.weekday[type]);
    const currentPlan = mealPlans.find(p => p.date === date) || { date, meals: { BREAKFAST: [], LUNCH: [], DINNER: [] } };
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[type] = [...updatedMeals[type], { recipe, memberIds: initialMembers, isCompleted: false }];
    await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: updatedMeals });
    alert(`[${recipe.name}]이(가) 식단에 추가되었습니다.`);
    closeMealModal();
  };

  const removeFromMealPlan = async (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string) => {
    if (!user) return;
    const currentPlan = mealPlans.find(p => p.date === date);
    if (!currentPlan) return;
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[type] = updatedMeals[type].filter(item => item.recipe.id !== recipeId);
    await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: updatedMeals });
  };

  const updateMealMembers = async (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string, memberId: string) => {
    if (!user) return;
    const currentPlan = mealPlans.find(p => p.date === date);
    if (!currentPlan) return;
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[mealType] = updatedMeals[mealType].map(item => {
        if (item.recipe.id === recipeId) {
            const newMemberIds = item.memberIds.includes(memberId) ? item.memberIds.filter(id => id !== memberId) : [...item.memberIds, memberId];
            return { ...item, memberIds: newMemberIds };
        }
        return item;
    });
    await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: updatedMeals });
  };

  const openMealModal = (recipe: Recipe) => setMealModalData({ isOpen: true, recipe });
  const closeMealModal = () => setMealModalData({ isOpen: false, recipe: null });
  const saveDefaultSettings = (settings: DefaultMealSettings) => { setDefaultSettings(settings); alert('설정이 저장되었습니다.'); };
  
  const cookRecipe = (recipe: Recipe) => {
    if (!user) return;
    let deducted = 0;
    fridge.forEach(item => {
        const recipeIng = recipe.ingredients.find(ri => item.name.includes(ri.name) || ri.name.includes(item.name));
        if (recipeIng && item.quantity > 0) {
            deducted++;
            updateIngredient(item.id, { quantity: Math.max(0, item.quantity - 1) });
        }
    });
    alert(deducted > 0 ? `재료 ${deducted}개를 냉장고에서 사용했습니다.` : '사용 가능한 재료가 없습니다.');
  };

  return (
    <DataContext.Provider value={{ recipes, fridge, members, mealPlans, cart, posts, userStats, searchQuery, setSearchQuery, addToCart, removeFromCart, addIngredient, updateIngredient, deleteIngredient, addToMealPlan, removeFromMealPlan, openMealModal, closeMealModal, mealModalData, updateMealMembers, defaultSettings, saveDefaultSettings, cookRecipe, addMember, updateMember, deleteMember }}>
      {children}
    </DataContext.Provider>
  );
};

// --- Helper Functions ---
const uploadToCloudinary = async (file: File) => {
  const cloudName = "YOUR_CLOUD_NAME"; // 🔴 여기에 본인의 Cloud Name 입력
  const uploadPreset = "YOUR_UPLOAD_PRESET"; // 🔴 여기에 본인의 Upload Preset 입력

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.secure_url;
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    alert("이미지 업로드에 실패했습니다. 설정을 확인해주세요.");
    return null;
  }
};

// --- Helper Components ---
const MealZipLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="14" width="10" height="10" rx="4" fill="currentColor" fillOpacity="0.8"/>
    <rect x="22" y="8" width="10" height="10" rx="4" fill="currentColor" fillOpacity="0.4"/>
    <rect x="22" y="22" width="10" height="10" rx="4" fill="currentColor"/>
    <path d="M18 19H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M27 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AuthPage = () => {
  const { login } = useAuth();
  return (
    <div className="h-screen bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 text-center w-full max-w-xs">
            <div className="w-20 h-20 bg-green-700 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-700/30 rotate-3">
                <ChefHat size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">MealZip</h1>
            <p className="text-gray-400 mb-12">우리 가족 맞춤 식단 관리</p>
            <button onClick={() => login('google')} className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 relative">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: '20px', height: '20px', marginRight: '10px' }} alt="Google" />
                구글 계정으로 시작하기
            </button>
        </div>
    </div>
  );
};

// ... (Overlay, Modals) ...
const GlobalSearchOverlay = () => {
    const { searchQuery, recipes, fridge, posts, setSearchQuery } = useData();
    const navigate = useNavigate();
    if (!searchQuery) return null;
    const matchedRecipes = recipes.filter(r => r.name.includes(searchQuery));
    const matchedFridge = fridge.filter(f => f.name.includes(searchQuery));
    return (
        <div className="absolute inset-x-0 top-[108px] bottom-0 bg-white z-40 overflow-y-auto p-5 animate-[fadeIn_0.2s_ease-out]">
            {matchedRecipes.length === 0 && matchedFridge.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">검색 결과가 없습니다.</div>
            ) : (
                <div className="space-y-6">
                    {matchedRecipes.length > 0 && (
                         <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <ChefHat size={18} className="text-brand"/> 레시피 ({matchedRecipes.length})
                            </h3>
                            {matchedRecipes.map(r => (
                                <div key={r.id} onClick={() => { setSearchQuery(''); navigate('/recipes'); }} className="p-2 border-b">{r.name}</div>
                            ))}
                        </div>
                    )}
                    {matchedFridge.length > 0 && (
                        <div>
                             <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Refrigerator size={18} className="text-blue-500"/> 냉장고 ({matchedFridge.length})
                            </h3>
                            {matchedFridge.map(f => (
                                <div key={f.id} onClick={() => { setSearchQuery(''); navigate('/fridge'); }} className="p-2 border-b">{f.name} ({f.quantity}{f.unit})</div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MealAddModal = () => {
    const { mealModalData, closeMealModal, addToMealPlan } = useData();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('DINNER');
    if (!mealModalData.isOpen || !mealModalData.recipe) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl">식단에 추가</h3>
                    <button onClick={closeMealModal}><X size={20}/></button>
                </div>
                <div className="flex gap-4 mb-6">
                    <img src={mealModalData.recipe.image} className="w-20 h-20 rounded-2xl object-cover bg-gray-100" />
                    <div>
                        <div className="font-bold text-gray-900 text-lg">{mealModalData.recipe.name}</div>
                        <div className="text-xs text-gray-400">{mealModalData.recipe.cookingTime}분 소요</div>
                    </div>
                </div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3 mb-4 font-bold text-center" />
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {['BREAKFAST', 'LUNCH', 'DINNER'].map((t) => (
                        <button key={t} onClick={() => setType(t as any)} className={`py-2 rounded-xl font-bold ${type === t ? 'bg-brand text-white' : 'bg-gray-100'}`}>
                            {t === 'BREAKFAST' ? '아침' : t === 'LUNCH' ? '점심' : '저녁'}
                        </button>
                    ))}
                </div>
                <button onClick={() => addToMealPlan(date, type, mealModalData.recipe!)} className="w-full bg-brand text-white font-bold py-4 rounded-2xl">추가하기</button>
            </div>
        </div>
    );
};

const IngredientModal = ({ isOpen, onClose, initialData }: { isOpen: boolean, onClose: () => void, initialData?: Ingredient }) => {
    const { addIngredient, updateIngredient, deleteIngredient } = useData();
    const [mode, setMode] = useState<'SELECT' | 'DETAIL'>(initialData ? 'DETAIL' : 'SELECT');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'ALL'>('ALL');
    
    // 폼 데이터 상태
    const [form, setForm] = useState<Partial<Ingredient>>({
        name: '', category: 'VEGETABLE', quantity: 1, unit: '개', storage: 'FRIDGE', expiryDate: '', image: '📦'
    });

    // 모달 열릴 때 초기화
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setMode('DETAIL');
                setForm(initialData);
            } else {
                setMode('SELECT');
                setSearch('');
                setSelectedCategory('ALL');
                // 빈 폼으로 초기화
                setForm({ name: '', category: 'VEGETABLE', quantity: 1, unit: '개', storage: 'FRIDGE', expiryDate: '', image: '📦' });
            }
        }
    }, [isOpen, initialData]);

    // [1] 재료 선택 시 상세 입력 모드로 전환
    const handleSelectPredefined = (item: PredefinedIngredient) => {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + item.defaultExpiryDays);
        
        setForm({
            name: item.name,
            category: item.category,
            quantity: 1,
            unit: '개',
            storage: item.defaultStorage,
            expiryDate: expiryDate.toISOString().split('T')[0],
            image: item.icon
        });
        setMode('DETAIL'); // 입력 화면으로 이동
    };

    // [2] 저장 (추가 또는 수정)
    const handleSave = () => {
        // 🚨 유효성 검사 추가: 수량이 비어있거나 숫자가 아니면 경고 (0은 허용)
        if (form.quantity === undefined || form.quantity === null || isNaN(form.quantity)) {
            alert('수량을 입력해주세요.');
            return; // 저장하지 않고 함수 종료
        }

        if (initialData) {
            // 수정 모드
            updateIngredient(initialData.id, form);
        } else {
            // 추가 모드
            addIngredient({ ...form, id: Math.random().toString(36).substr(2, 9) } as Ingredient);
        }
        onClose();
    };

    // [3] 삭제
    const handleDelete = () => {
        if (initialData) {
            deleteIngredient(initialData.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-5 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-0 shadow-2xl h-[90vh] sm:h-[85vh] flex flex-col animate-[slideUp_0.3s_ease-out] overflow-hidden">
                
                {/* 헤더 */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        {mode === 'DETAIL' && !initialData && (
                            <button onClick={() => setMode('SELECT')} className="p-1 -ml-2 rounded-full hover:bg-gray-100"><ChevronLeft size={24} /></button>
                        )}
                        <h3 className="font-bold text-xl text-gray-900">
                            {mode === 'SELECT' ? '재료 선택' : (initialData ? '재료 수정' : '세부 정보 입력')}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                </div>

                {/* 콘텐츠 영역 */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    {mode === 'SELECT' ? (
                        <div className="pb-24">
                            {/* 검색 및 카테고리 필터 */}
                            <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm p-4 space-y-3 shadow-sm">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand outline-none shadow-sm"
                                        placeholder="어떤 재료를 찾으세요?"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    <button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>전체</button>
                                    {CATEGORIES.map(cat => (
                                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${selectedCategory === cat.id ? 'bg-brand text-white border-brand' : 'bg-white text-gray-500 border-gray-200'}`}>
                                            <span>{cat.icon}</span> {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 재료 그리드 */}
                            <div className="p-4 grid grid-cols-4 gap-3">
                                {PREDEFINED_INGREDIENTS.filter(item => 
                                    (selectedCategory === 'ALL' || item.category === selectedCategory) &&
                                    item.name.includes(search)
                                ).map((item, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSelectPredefined(item)}
                                        className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand/50 hover:shadow-md transition-all active:scale-95"
                                    >
                                        <div className="text-3xl">{item.icon}</div>
                                        <span className="text-xs font-bold text-gray-900 break-keep text-center leading-tight">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* 선택된 재료 정보 (아이콘, 이름) */}
                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-sm border border-gray-100">
                                    {form.image || '📦'}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{form.name}</h2>
                                <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-lg">
                                    {CATEGORIES.find(c => c.id === form.category)?.label}
                                </span>
                            </div>

                            {/* 상세 입력 폼 */}
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                                {/* 보관 방법 */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">보관 방법</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[ { id: 'FRIDGE', label: '냉장', icon: '❄️' }, { id: 'FREEZER', label: '냉동', icon: '🧊' }, { id: 'ROOM', label: '실온', icon: '🧺' } ].map(opt => (
                                            <button key={opt.id} onClick={() => setForm({...form, storage: opt.id as any})} className={`py-3 rounded-xl text-sm font-bold border flex flex-col items-center gap-1 transition-all ${form.storage === opt.id ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}>
                                                <span className="text-lg">{opt.icon}</span>{opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* 소비기한 */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">소비기한</label>
                                    <div className="relative">
                                        <input type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-4 pl-12 text-gray-900 font-bold outline-none focus:ring-2 focus:ring-brand" />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    </div>
                                </div>
                                {/* 수량 및 단위 */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">수량 및 단위</label>
                                    <div className="flex gap-3 h-14">
                                        <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
                                            <button onClick={() => setForm(prev => ({...prev, quantity: Math.max(0, (prev.quantity || 0) - 1)}))} className="p-2 text-gray-400 hover:text-brand"><Minus size={20}/></button>
                                            <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: parseFloat(e.target.value)})} className="flex-1 bg-transparent border-none text-center font-bold text-xl text-gray-900 outline-none w-full" />
                                            <button onClick={() => setForm(prev => ({...prev, quantity: (prev.quantity || 0) + 1}))} className="p-2 text-gray-400 hover:text-brand"><Plus size={20}/></button>
                                        </div>
                                        <div className="w-1/3 relative">
                                            <select value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="w-full h-full bg-white border border-gray-200 rounded-xl px-4 font-bold text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                                                {INGREDIENT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronLeft size={16} className="-rotate-90" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="p-5 bg-white border-t border-gray-100 flex gap-3 safe-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
                    {initialData && (
                        <button onClick={handleDelete} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors">
                            <Trash2 size={24} />
                        </button>
                    )}
                    <button onClick={handleSave} className="flex-1 bg-brand text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-800 transition-colors text-lg">
                        {initialData ? '수정 완료' : '냉장고에 넣기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemberEditorModal = ({ isOpen, onClose, member }: { isOpen: boolean, onClose: () => void, member?: Member }) => {
    const { addMember, updateMember, deleteMember } = useData();
    const [form, setForm] = useState<Partial<Member>>({ name: '', gender: 'M', birthDate: '', hasNoAllergy: false, allergies: [], hasNoDisease: false, diseases: [], dislikes: [], avatarColor: 'bg-gray-400', relationship: 'FAMILY' });
    useEffect(() => { if (isOpen) setForm(member || { name: '', gender: 'M', birthDate: new Date().toISOString().split('T')[0], hasNoAllergy: false, allergies: [], hasNoDisease: false, diseases: [], dislikes: [], avatarColor: 'bg-blue-500', relationship: 'FAMILY' }); }, [isOpen, member]);
    
    const handleSave = () => {
        if (!form.name) return alert('이름을 입력해주세요.');
        if (member) updateMember(member.id, form);
        else addMember({ ...form, id: Math.random().toString(36).substr(2, 9) } as Member);
        onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-[slideUp_0.3s_ease-out]">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                <button onClick={onClose}><X size={24} /></button>
                <h2 className="font-bold text-lg text-gray-900">{member ? '멤버 수정' : '새 멤버 추가'}</h2>
                <div className="w-6"></div>
            </div>
            <div className="p-5 space-y-6 overflow-y-auto pb-20">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">이름</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="이름 입력" />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">성별</label>
                    <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
                        {['M', 'F'].map(g => (
                            <button key={g} onClick={() => setForm({...form, gender: g as any})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${form.gender === g ? 'bg-white shadow-sm' : 'text-gray-400'}`}>{g === 'M' ? '남성' : '여성'}</button>
                        ))}
                    </div>
                </div>
                <button onClick={handleSave} className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-lg mt-4">저장하기</button>
                 {member && member.relationship !== 'ME' && (
                    <button onClick={() => { if(window.confirm('삭제하시겠습니까?')) { deleteMember(member.id); onClose(); } }} className="w-full text-red-500 py-2">삭제</button>
                )}
            </div>
        </div>
    );
};

// [레시피 작성 모달]
const RecipeWriteModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const [ingredientsText, setIngredientsText] = useState(""); 
  const [stepsText, setStepsText] = useState(""); 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!name || !file || !ingredientsText || !stepsText) return alert("모든 정보를 입력해주세요.");

    setIsUploading(true);

    // 1. 이미지 업로드
    const imageUrl = await uploadToCloudinary(file);
    if (!imageUrl) {
      setIsUploading(false);
      return;
    }

    // 2. DB 저장
    try {
        await addDoc(collection(db, "recipes"), {
            name: name,
            image: imageUrl,
            description: desc,
            ingredients: ingredientsText.split(',').map(i => ({ name: i.trim(), amount: '적당량' })),
            steps: stepsText.split('\n'),
            category: 'KOREAN',
            type: 'MAIN',
            cookingTime: 30,
            difficulty: 'MEDIUM',
            rating: 0,
            reviews: [],
            relatedProducts: [],
            tags: [],
            authorId: user.id,
            authorName: user.name,
            createdAt: new Date().toISOString()
        });
        alert("레시피가 등록되었습니다! 🎉");
        onClose();
        // 초기화
        setName(""); setDesc(""); setFile(null); setPreview(""); setIngredientsText(""); setStepsText("");
    } catch (e) {
        console.error("DB 저장 실패:", e);
        alert("저장 중 오류가 발생했습니다.");
    } finally {
        setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">새 레시피 등록</h3>
            <button onClick={onClose}><X size={24} /></button>
        </div>

        <div className="space-y-4">
            <div className="w-full aspect-video bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden relative cursor-pointer border-2 border-dashed border-gray-300 hover:border-brand hover:bg-green-50 transition-colors">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {preview ? (
                    <img src={preview} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <Camera size={32} />
                        <span className="text-xs font-bold mt-1">사진을 등록해주세요</span>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">요리 이름</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3 font-bold" placeholder="예: 김치찌개" />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">한줄 소개</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3" placeholder="예: 칼칼하고 시원한 맛!" />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">재료 (쉼표로 구분)</label>
                <input value={ingredientsText} onChange={e => setIngredientsText(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3" placeholder="예: 김치, 돼지고기, 두부, 파" />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">조리 순서 (엔터로 구분)</label>
                <textarea value={stepsText} onChange={e => setStepsText(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3 h-24 resize-none" placeholder="1. 고기를 볶는다&#13;&#10;2. 물을 붓는다..." />
            </div>
            
            <button onClick={handleSubmit} disabled={isUploading} className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-lg mt-2 disabled:bg-gray-400">
                {isUploading ? "업로드 중..." : "레시피 등록 완료"}
            </button>
        </div>
      </div>
    </div>
  );
};

const GlobalLayout = ({ children }: { children?: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, searchQuery, setSearchQuery } = useData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navItems = [
    { label: '식단', path: '/mealplan', icon: Calendar },
    { label: '레시피', path: '/recipes', icon: ChefHat },
    { label: '홈', path: '/', icon: Home, isMain: true },
    { label: '냉장고', path: '/fridge', icon: Refrigerator },
    { label: '마이', path: '/mypage', icon: UserIcon },
  ];
  const topNavItems = [
    { label: '홈', path: '/' },
    { label: '오늘식단', path: '/mealplan' },
    { label: '레시피', path: '/recipes' },
    { label: '나의냉장고', path: '/fridge' },
    { label: '커뮤니티', path: '/community' },
    { label: '장보기', path: '/shopping' },
  ];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeBtn = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans text-gray-900">
      <header className="bg-white px-5 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-1.5 cursor-pointer flex-1" onClick={() => navigate('/')}>
            <MealZipLogo className="w-8 h-8 text-brand" />
            <h1 className="text-xl font-bold text-gray-800 tracking-tight font-sans">MealZip</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)}><Search className="w-6 h-6 stroke-[1.5]" /></button>
          <div className="relative cursor-pointer" onClick={() => navigate('/shopping')}><ShoppingBag className="w-6 h-6" />{cart.length > 0 && <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cart.length}</span>}</div>
        </div>
      </header>
      {isSearchOpen && <div className="px-4 pb-2"><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색..." className="w-full bg-gray-100 rounded-xl px-4 py-2" autoFocus /></div>}
      
      <GlobalSearchOverlay />
      <MealAddModal />
      
      <div ref={scrollContainerRef} className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-1 shrink-0 z-20 sticky top-[52px] scroll-smooth">
        {topNavItems.map((item) => (
            <button key={item.label} data-active={location.pathname === item.path} onClick={() => navigate(item.path)} className={`px-3 py-2 text-[15px] transition-all duration-300 relative mr-2 ${location.pathname === item.path ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium hover:text-gray-600'}`}>
                {item.label}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-brand rounded-full transition-all duration-300 ${location.pathname === item.path ? 'w-[20px]' : 'w-0'}`}></div>
            </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar bg-white">{children}</main>
      <nav className="absolute bottom-0 w-full bg-white/95 border-t border-gray-100 flex justify-around py-2 pb-8 z-30 rounded-t-[2.5rem]">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const isMain = (item as any).isMain;
          return (
            <button key={item.label} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 ${isMain ? '-mt-8 z-10' : ''}`}>
              <div className={`${isMain ? 'w-16 h-16 bg-brand rounded-full flex items-center justify-center shadow-lg mb-1 scale-110 border-4 border-white' : ''}`}>
                  <item.icon className={`${isMain ? 'text-white w-8 h-8' : active ? 'text-brand w-6 h-6 stroke-[2.5]' : 'text-gray-300 w-6 h-6 stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] ${active ? 'font-bold text-brand' : 'font-medium text-gray-300'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// --- Pages ---
const HomePage = () => {
  const { recipes } = useData();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { id: 1, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1000&auto=format&fit=crop', badge: 'AI 추천 식단', badgeIcon: Sparkles, title: '우리 아이 성장을 위한\n영양 듬뿍 봄나물 비빔밥', desc: '냉장고에 있는 시금치와 계란을 활용해\n오늘 바로 만들어보세요.', btnText: '오늘 식단 보기', path: '/mealplan' },
    { id: 2, image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=1000&auto=format&fit=crop', badge: '냉장고 파먹기', badgeIcon: Zap, title: '유통기한 임박 재료로\n만드는 맛있는 한 끼', desc: '버려지는 재료 없이\n알뜰하게 요리해보세요.', btnText: '매칭 레시피 보기', path: '/recipes' },
    { id: 3, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop', badge: '장보기 도우미', badgeIcon: ShoppingBag, title: '부족한 재료만 쏙쏙\n스마트한 장보기', desc: '필요한 재료를 자동으로\n분석해 드려요.', btnText: '장보기 시작', path: '/shopping' }
  ];
  useEffect(() => { const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000); return () => clearInterval(timer); }, [slides.length]);

  return (
    <div className="space-y-10 pb-10">
      <div className="relative w-full h-[55vh] overflow-hidden group">
        <div className="flex h-full w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {slides.map((slide) => (
                <div key={slide.id} className="min-w-full h-full relative select-none">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-12 left-6 text-white max-w-[85%] pb-4">
                        <div className="flex items-center gap-2 mb-3"><span className="bg-brand text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><slide.badgeIcon size={10} /> {slide.badge}</span></div>
                        <h2 className="text-3xl font-bold leading-tight mb-3 whitespace-pre-line">{slide.title}</h2>
                        <p className="text-sm opacity-80 font-light leading-relaxed mb-6 whitespace-pre-line">{slide.desc}</p>
                        <button onClick={() => navigate(slide.path)} className="bg-white text-brand px-6 py-3 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-transform hover:bg-green-50">{slide.btnText} <ChevronRight size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {slides.map((_, idx) => <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />)}
        </div>
      </div>
      <div className="px-6 -mt-8 relative z-10 w-full">
        <div className="grid grid-cols-4 gap-2 w-full">
            {[ { label: '식단관리', icon: Calendar, color: 'bg-green-50 text-brand', path: '/mealplan' }, { label: '재료추가', icon: Plus, color: 'bg-orange-50 text-accent', path: '/fridge' }, { label: '장보기', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', path: '/shopping' }, { label: '나의냉장고', icon: Refrigerator, color: 'bg-purple-50 text-purple-600', path: '/fridge' } ].map((item, idx) => (
                <div key={idx} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-2 cursor-pointer">
                    <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-transform`}><item.icon size={24} strokeWidth={1.5} /></div>
                    <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap">{item.label}</span>
                </div>
            ))}
        </div>
      </div>
      <div className="w-full mt-6">
        <div className="px-6 flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp size={18} className="text-red-500" /> 인기 급상승 레시피</h3><span className="text-xs text-gray-400 font-medium cursor-pointer" onClick={() => navigate('/recipes')}>전체보기</span></div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4">
            {recipes.slice(0, 5).map((recipe, i) => (
                <div key={i} className="min-w-[140px] group cursor-pointer" onClick={() => navigate('/recipes')}>
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-sm mb-2">
                        <img src={recipe.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-lg font-bold flex items-center gap-1"><Clock size={10} /> {recipe.cookingTime}분</div>
                    </div>
                    <div className="text-sm font-bold text-gray-800 line-clamp-1">{recipe.name}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{recipe.tags.join(', ')}</div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const MyPage = () => {
    const { user, logout } = useAuth();
    const { members, userStats } = useData(); // [수정] userStats 가져오기
    const [view, setView] = useState<'MAIN' | 'MEMBERS'>('MAIN');
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | undefined>(undefined);

    if (view === 'MEMBERS') {
        return (
            <div className="min-h-full bg-gray-50/50 pb-20">
                <div className="bg-white p-5 pb-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
                    <button onClick={() => setView('MAIN')} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ChevronLeft size={24} className="text-gray-900" /></button>
                    <h2 className="text-lg font-bold text-gray-900">가족 / 멤버 관리</h2>
                </div>
                <div className="p-5 space-y-6">
                    {members.map(member => (
                        <div key={member.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative">
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => { setEditingMember(member); setIsMemberModalOpen(true); }} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-brand hover:bg-green-50"><Edit2 size={16} /></button>
                            </div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`w-12 h-12 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white`}>{member.name.charAt(0)}</div>
                                <div><div className="font-bold text-gray-900 flex items-center gap-2">{member.name}</div><div className="text-xs text-gray-400 mt-0.5">{member.gender === 'M' ? '남성' : '여성'}</div></div>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => { setEditingMember(undefined); setIsMemberModalOpen(true); }} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center gap-2 text-gray-400 font-bold hover:border-brand hover:text-brand hover:bg-brand/5"><Plus size={20} /> 가족 멤버 추가하기</button>
                </div>
                <MemberEditorModal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} member={editingMember} />
            </div>
        );
    }

    return (
        <div className="bg-gray-50/50 min-h-full pb-24">
            <div className="bg-white p-6 pt-8 pb-8 rounded-b-[2.5rem] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <img src={user?.avatar} className="w-16 h-16 rounded-full border border-gray-100 shadow-sm" />
                    <div className="flex-1"><h2 className="text-xl font-bold text-gray-900 leading-none mb-1">{user?.name}님</h2><div className="text-sm text-gray-400">내 정보 수정</div></div>
                    <button onClick={logout} className="text-xs font-medium text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full">로그아웃</button>
                </div>
                {/* [수정] DB 연동 데이터 표시 */}
                <div className="grid grid-cols-4 gap-2">
                    {[ 
                        { label: '포인트', val: userStats.points.toLocaleString(), icon: CreditCard }, 
                        { label: '쿠폰', val: userStats.coupons + '장', icon: Receipt }, 
                        { label: '리뷰', val: userStats.reviews, icon: MessageCircle }, 
                        { label: '주문배송', val: userStats.shipping + '건', icon: Truck } 
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 cursor-pointer group">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 group-hover:bg-brand/10 group-hover:text-brand transition-colors"><item.icon size={20} strokeWidth={1.5} /></div>
                            <span className="text-[10px] text-gray-400 font-medium mb-0.5">{item.label}</span>
                            <span className="text-sm font-bold text-gray-900">{item.val}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-5 space-y-6">
                {[ { title: '관리', items: [ { label: '가족 / 멤버 관리', icon: Users, action: () => setView('MEMBERS'), highlight: true }, { label: '정기배송 관리', icon: Package } ] }, { title: '앱 설정', items: [ { label: '알림 설정', icon: Bell }, { label: '고객센터', icon: HelpCircle } ] } ].map((group, idx) => (
                    <div key={idx}><h3 className="text-xs font-bold text-gray-400 mb-3 ml-1">{group.title}</h3><div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">{group.items.map((item, i) => (<div key={i} onClick={item.action} className={`flex items-center gap-4 p-4 border-b border-gray-50 last:border-none cursor-pointer hover:bg-gray-50 transition-colors ${item.highlight ? 'bg-brand/5' : ''}`}><item.icon size={20} className={item.highlight ? 'text-brand' : 'text-gray-400'} strokeWidth={1.5} /><span className={`flex-1 font-medium text-sm ${item.highlight ? 'text-brand font-bold' : 'text-gray-700'}`}>{item.label}</span><ChevronRight size={16} className="text-gray-300" /></div>))}</div></div>
                ))}
            </div>
        </div>
    );
};

const MealPlanPage = () => {
  const { mealPlans, updateMealMembers, members, removeFromMealPlan } = useData();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const weekDates = [];
  const startDay = new Date(selectedDate);
  startDay.setDate(startDay.getDate() - 3);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  const currentPlan = mealPlans.find(p => p.date === selectedDate) || {
    date: selectedDate,
    meals: { BREAKFAST: [], LUNCH: [], DINNER: [] }
  };

  const calculateTotal = (nutrient: keyof import('./types').Nutrition) => {
    let total = 0;
    ['BREAKFAST', 'LUNCH', 'DINNER'].forEach((type) => {
      (currentPlan.meals as any)[type].forEach((item: MealPlanItem) => {
        const count = item.memberIds.length;
        total += item.recipe.nutrition[nutrient] * count;
      });
    });
    return Math.round(total);
  };

  const totalCalories = calculateTotal('calories');
  const totalCarbs = calculateTotal('carbs');
  const totalProtein = calculateTotal('protein');
  const totalFat = calculateTotal('fat');

  const MealSection = ({ type, title, items }: { type: 'BREAKFAST'|'LUNCH'|'DINNER', title: string, items: MealPlanItem[] }) => (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">{title}</h3>
        <button onClick={() => navigate('/recipes')} className="text-gray-400 hover:text-brand transition-colors"><Plus size={20}/></button>
      </div>
      
      {items.length > 0 ? (
        <div className="space-y-6">
           {items.map((item, idx) => (
             <div key={idx} className="relative">
                 <div className="flex gap-4 items-start mb-3">
                    <img src={item.recipe.image} className="w-14 h-14 rounded-2xl object-cover bg-gray-50 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-sm truncate pr-6">{item.recipe.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{item.recipe.nutrition.calories}kcal (1인)</div>
                    </div>
                    <button 
                        onClick={() => removeFromMealPlan(selectedDate, type, item.recipe.id)}
                        className="text-gray-300 hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                     {members.map(member => {
                         const isEating = item.memberIds.includes(member.id);
                         return (
                             <button 
                                key={member.id}
                                onClick={() => updateMealMembers(selectedDate, type, item.recipe.id, member.id)}
                                className={`flex flex-col items-center gap-1 transition-all ${isEating ? 'opacity-100 scale-100' : 'opacity-40 scale-90 grayscale'}`}
                             >
                                 <div className={`w-8 h-8 rounded-full ${member.avatarColor} text-white flex items-center justify-center text-xs font-bold border-2 ${isEating ? 'border-brand' : 'border-transparent'}`}>
                                     {member.name.charAt(0)}
                                 </div>
                                 <span className="text-[9px] font-bold text-gray-600">{member.name}</span>
                             </button>
                         );
                     })}
                 </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-400 text-xs border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/recipes')}>
            <Plus size={20} className="mx-auto mb-2 opacity-50"/>
            식단 추가하기
        </div>
      )}
    </div>
  );

  return (
    <div className="p-5 pb-20 space-y-6 bg-gray-50/50 min-h-full">
        <div className="flex items-center gap-2">
            <div className="relative">
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button className="w-12 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg">
                    <Calendar size={20} />
                </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 flex-1">
                {weekDates.map(date => {
                    const isSelected = date === selectedDate;
                    const d = new Date(date);
                    return (
                        <button 
                            key={date} 
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-2xl transition-all ${isSelected ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-105' : 'bg-white text-gray-400 border border-gray-100'}`}
                        >
                            <span className="text-[10px] font-medium">{['일','월','화','수','목','금','토'][d.getDay()]}</span>
                            <span className="text-lg font-bold">{d.getDate()}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-gray-900 font-bold text-lg">오늘의 영양 섭취</h2>
                    <p className="text-xs text-gray-400">참여 가족 합산 섭취량</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-brand">{totalCalories}</span>
                    <span className="text-xs text-gray-400 font-bold ml-1">kcal</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: '탄수화물', val: totalCarbs, color: 'bg-orange-400' },
                    { label: '단백질', val: totalProtein, color: 'bg-brand' },
                    { label: '지방', val: totalFat, color: 'bg-yellow-400' }
                ].map((nut, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
                        <div className="text-[10px] text-gray-500 mb-1">{nut.label}</div>
                        <div className="text-sm font-bold text-gray-900 mb-2">{nut.val}g</div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${nut.color}`} style={{ width: '60%' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <MealSection type="BREAKFAST" title="🌅 아침" items={currentPlan.meals.BREAKFAST} />
        <MealSection type="LUNCH" title="☀️ 점심" items={currentPlan.meals.LUNCH} />
        <MealSection type="DINNER" title="🌙 저녁" items={currentPlan.meals.DINNER} />
    </div>
  );
};

const FridgePage = () => {
    const { fridge, deleteIngredient } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | undefined>(undefined);
    const [filterCategory, setFilterCategory] = useState<IngredientCategory | 'ALL'>('ALL');
    
    // [관리 모드 상태]
    const [isManageMode, setIsManageMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // 수정 모달 열기 (관리 모드가 아닐 때만)
    const handleEdit = (item: Ingredient) => {
        if (isManageMode) {
            toggleSelect(item.id);
        } else {
            setSelectedIngredient(item);
            setIsModalOpen(true);
        }
    };

    // 추가 모달 열기
    const handleAdd = () => {
        setSelectedIngredient(undefined);
        setIsModalOpen(true);
    };

    // 선택 토글 (관리 모드)
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // 선택 삭제
    const handleDeleteSelected = () => {
        if (confirm(`${selectedIds.length}개의 재료를 삭제하시겠습니까?`)) {
            selectedIds.forEach(id => deleteIngredient(id));
            setSelectedIds([]);
            setIsManageMode(false);
        }
    };

    const filteredFridge = fridge.filter(item => filterCategory === 'ALL' || item.category === filterCategory);
    // 소비기한 임박 순 정렬
    filteredFridge.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    return (
        <div className="p-5 pb-24 min-h-full bg-gray-50/50">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Refrigerator className="text-blue-500" /> 나의 냉장고
                </h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setIsManageMode(!isManageMode); setSelectedIds([]); }} 
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isManageMode ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}
                    >
                        {isManageMode ? '완료' : '관리'}
                    </button>
                    {!isManageMode && (
                        <button onClick={handleAdd} className="bg-brand text-white p-2 w-9 h-9 flex items-center justify-center rounded-full shadow-lg hover:scale-105 transition-transform">
                            <Plus size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                <button onClick={() => setFilterCategory('ALL')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${filterCategory === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>전체</button>
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${filterCategory === cat.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200'}`}>
                        <span>{cat.icon}</span> {cat.label}
                    </button>
                ))}
            </div>

            {/* 재료 목록 */}
            {filteredFridge.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {filteredFridge.map(item => {
                        const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = daysLeft < 0;
                        const isUrgent = daysLeft <= 3 && !isExpired;
                        const isSelected = selectedIds.includes(item.id);

                        return (
                            <div 
                                key={item.id} 
                                onClick={() => handleEdit(item)} 
                                className={`bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-4 cursor-pointer relative overflow-hidden transition-all ${isManageMode && isSelected ? 'border-brand ring-1 ring-brand bg-brand/5' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                {isManageMode && (
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                                        {isSelected && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                )}
                                
                                <div className="text-3xl w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl shrink-0">
                                    {item.image}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                                        {!isManageMode && (
                                            isExpired ? <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">만료</span> :
                                            isUrgent ? <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">D-{daysLeft}</span> :
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">D-{daysLeft}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="font-bold text-blue-500">{item.quantity}{item.unit}</span>
                                        <span className="w-px h-3 bg-gray-200"></span>
                                        <span>{item.storage === 'FRIDGE' ? '냉장' : item.storage === 'FREEZER' ? '냉동' : '실온'}</span>
                                        <span className="w-px h-3 bg-gray-200"></span>
                                        <span>{item.expiryDate}까지</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <Refrigerator size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold">냉장고가 비어있어요</p>
                    <p className="text-xs mt-1">우측 상단 + 버튼을 눌러 재료를 채워보세요</p>
                </div>
            )}

            {/* 관리 모드 하단 삭제 버튼 */}
            {isManageMode && selectedIds.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 p-5 z-30 animate-[slideUp_0.2s_ease-out]">
                    <button 
                        onClick={handleDeleteSelected}
                        className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 max-w-md mx-auto"
                    >
                        <Trash2 size={20} /> {selectedIds.length}개 삭제하기
                    </button>
                </div>
            )}

            <IngredientModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                initialData={selectedIngredient} 
            />
        </div>
    );
};

const RecipePage = () => {
    const { recipes, openMealModal, addToCart, fridge, cookRecipe } = useData();
    const [filter, setFilter] = useState<'ALL' | 'MATCH' | 'EXPIRING' | 'LATE_NIGHT' | 'HEALTHY'>('ALL');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isWriteOpen, setIsWriteOpen] = useState(false); // 글쓰기 모달 상태
    const [commentText, setCommentText] = useState('');

    const processedRecipes = recipes.map(recipe => {
        let matchCount = 0;
        const missingIngredients: string[] = [];
        let hasExpiringIngredient = false;
        
        recipe.ingredients.forEach(ing => {
            const fridgeItem = fridge.find(fItem => fItem.name.includes(ing.name) || ing.name.includes(fItem.name));
            if (fridgeItem) {
                matchCount++;
                const daysUntilExpiry = Math.ceil((new Date(fridgeItem.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry <= 7) hasExpiringIngredient = true;
            } else {
                missingIngredients.push(ing.name);
            }
        });

        const matchRate = Math.round((matchCount / recipe.ingredients.length) * 100);
        return { ...recipe, matchRate, missingIngredients, hasExpiringIngredient };
    });

    const displayRecipes = processedRecipes.filter(r => {
        if (filter === 'EXPIRING' && !r.hasExpiringIngredient) return false;
        if (filter === 'LATE_NIGHT' && !r.tags.includes('야식')) return false;
        if (filter === 'HEALTHY' && !r.tags.includes('건강')) return false;
        return true;
    });

    if (filter === 'MATCH' || filter === 'EXPIRING') {
        displayRecipes.sort((a, b) => b.matchRate - a.matchRate);
    }

    return (
        <div className="relative min-h-full pb-20 bg-background">
             {/* AI 추천 배너 */}
             <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white mb-2 shadow-lg">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <Bot size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">AI 셰프의 오늘 추천</h2>
                        <p className="text-xs text-white/80 mt-1">냉장고 상태와 날씨를 분석했어요</p>
                    </div>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {recipes.slice(3, 6).map(r => (
                        <div key={r.id} onClick={() => setSelectedRecipe(r)} className="min-w-[120px] bg-white/10 backdrop-blur-sm rounded-2xl p-2 cursor-pointer border border-white/10 hover:bg-white/20 transition-colors">
                            <img src={r.image} className="w-full h-20 object-cover rounded-xl mb-2 bg-black/20" />
                            <div className="text-xs font-bold truncate">{r.name}</div>
                            <div className="text-[10px] opacity-80">{r.cookingTime}분</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 필터 탭 */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-5 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { key: 'ALL', label: '전체' },
                    { key: 'MATCH', label: '냉파요리', icon: Zap },
                    { key: 'EXPIRING', label: '임박재료', icon: AlertCircle },
                    { key: 'LATE_NIGHT', label: '야식요리', icon: Moon },
                    { key: 'HEALTHY', label: '건강요리', icon: Leaf },
                ].map(tab => (
                    <button 
                        key={tab.key} 
                        onClick={() => setFilter(tab.key as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filter === tab.key ? 'bg-gray-900 text-white shadow-md transform scale-105' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}
                    >
                        {tab.icon && <tab.icon size={14} fill={filter === tab.key ? "currentColor" : "none"} />}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 레시피 리스트 */}
            <div className="p-4 grid grid-cols-2 gap-4">
                {displayRecipes.map(recipe => (
                    <div key={recipe.id} className="group relative flex flex-col gap-2 cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100/50">
                            <img src={recipe.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                            <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                                <Clock size={10} /> {recipe.cookingTime}분
                            </div>
                            {(filter !== 'ALL' || recipe.matchRate > 70) && (
                                <div className="absolute top-2 right-2 bg-brand/90 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-lg font-bold border border-white/20">
                                    {recipe.matchRate}% 매칭
                                </div>
                            )}
                        </div>
                        <div className="px-1">
                            <h3 className="font-bold text-gray-900 leading-tight mb-1 text-[15px] truncate">{recipe.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                                <span className="truncate max-w-[80%]">{recipe.tags.slice(0, 2).join(', ')}</span>
                            </div>
                            <div className="text-[11px] font-bold text-orange-500 flex items-center gap-1">
                                <Flame size={10} className="fill-orange-500" /> {recipe.nutrition.calories} kcal
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 레시피 상세 모달 */}
            {selectedRecipe && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-[slideUp_0.3s_ease-out]">
                    <div className="flex-1 overflow-y-auto pb-32 relative">
                        {/* 이미지 헤더 */}
                        <div className="relative h-[35vh]">
                            <img src={selectedRecipe.image} className="w-full h-full object-cover" />
                            <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white/50 transition-colors">
                                <X size={24} className="text-white" />
                            </button>
                            <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>

                        <div className="px-6 py-6 -mt-6 bg-white rounded-t-[2rem] relative z-10">
                            {/* 타이틀 */}
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight flex-1 mr-4">{selectedRecipe.name}</h2>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                                        <Star size={16} fill="currentColor" /> {selectedRecipe.rating.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-400">리뷰 {selectedRecipe.reviews.length}</div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mb-6">
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg">{selectedRecipe.category}</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg">{selectedRecipe.cookingTime}분</span>
                                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${selectedRecipe.difficulty === 'EASY' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {selectedRecipe.difficulty === 'EASY' ? '쉬움' : '보통'}
                                </span>
                            </div>

                            {/* 재료 리스트 */}
                            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center justify-between">
                                재료 준비
                                <span className="text-xs font-normal text-gray-400">{selectedRecipe.ingredients.length}개 재료</span>
                            </h3>
                            <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
                                <ul className="space-y-3">
                                    {(selectedRecipe as any).ingredients.map((ing: any, i: number) => {
                                        const isMissing = (selectedRecipe as any).missingIngredients?.includes(ing.name);
                                        const fridgeItem = fridge.find(f => f.name.includes(ing.name));
                                        
                                        return (
                                            <li key={i} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isMissing ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
                                                        {isMissing ? 'X' : 'O'}
                                                    </div>
                                                    <span className={`flex items-center gap-2 ${isMissing ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
                                                        {ing.name}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-gray-900">{ing.amount}</div>
                                                    {!isMissing && fridgeItem && <div className="text-[9px] text-brand">보유: {fridgeItem.quantity}{fridgeItem.unit}</div>}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {/* 조리 순서 */}
                            <h3 className="font-bold text-lg text-gray-900 mb-4">조리 순서</h3>
                            <div className="space-y-6 mb-10">
                                {selectedRecipe.steps.map((step, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border-2 border-green-100">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed pt-1">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 하단 고정 액션바 */}
                    <div className="absolute bottom-0 w-full bg-white border-t border-gray-200 p-4 safe-bottom flex items-center gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
                        <button className="flex flex-col items-center justify-center gap-1 text-gray-400 min-w-[3rem]">
                            <Bookmark size={22} strokeWidth={1.5} />
                            <span className="text-[10px] font-medium">저장</span>
                        </button>
                        <button 
                            onClick={() => openMealModal(selectedRecipe)}
                            className="flex flex-col items-center justify-center gap-1 text-gray-400 min-w-[3rem]"
                        >
                            <CalendarPlus size={22} strokeWidth={1.5} />
                            <span className="text-[10px] font-medium">식단</span>
                        </button>
                        <button 
                            onClick={() => cookRecipe(selectedRecipe)}
                            className="flex-1 bg-brand text-white font-bold h-12 rounded-xl shadow-lg hover:bg-green-800 transition-colors flex items-center justify-center text-base"
                        >
                            요리하기
                        </button>
                    </div>
                </div>
            )}

            {/* 글쓰기 버튼 (플로팅 버튼) */}
            <button 
                onClick={() => setIsWriteOpen(true)}
                className="fixed bottom-24 right-5 bg-gray-900 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-110 transition-transform"
            >
                <Edit2 size={24} />
            </button>

            {/* 글쓰기 모달 연결 */}
            <RecipeWriteModal isOpen={isWriteOpen} onClose={() => setIsWriteOpen(false)} />
        </div>
    );
};

const ShoppingPage = () => {
    const { cart, addToCart } = useData();
    const products = DUMMY_PRODUCTS;

    return (
        <div className="p-5 pb-20">
            <div className="bg-gray-900 text-white rounded-3xl p-6 mb-8 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="text-gray-400 text-xs font-bold mb-1">장바구니 합계</div>
                        <div className="text-2xl font-bold">{cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0).toLocaleString()}원</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <ShoppingBag size={24} />
                    </div>
                </div>
            </div>

            <h3 className="font-bold text-gray-900 text-lg mb-4">추천 상품</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
                {products.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                        <div className="relative">
                            <img src={p.image} className="w-full h-32 object-cover" />
                            {p.discountRate && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                                    {p.discountRate}%
                                </div>
                            )}
                            <button 
                                onClick={() => addToCart(p, 1)}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-900 hover:bg-brand hover:text-white transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="p-3">
                            <div className="text-xs text-gray-400 mb-1">{p.category}</div>
                            <div className="font-bold text-gray-900 text-sm mb-1 truncate">{p.name}</div>
                            <div className="font-bold text-brand">{p.price.toLocaleString()}원</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CommunityPage = () => {
    const { posts } = useData();

    return (
        <div className="p-5 pb-20 space-y-6">
            {posts.map(post => (
                <div key={post.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="p-4 flex items-center gap-3">
                        <img src={post.userAvatar} className="w-10 h-10 rounded-full bg-gray-100" />
                        <div>
                            <div className="font-bold text-sm text-gray-900">{post.userName}</div>
                            <div className="text-xs text-gray-400">{post.date}</div>
                        </div>
                    </div>
                    <img src={post.image} className="w-full h-64 object-cover" />
                    <div className="p-4">
                        <div className="flex gap-4 mb-3">
                            <button className="flex items-center gap-1 text-gray-600 font-bold text-sm">
                                <Heart size={20} className="text-red-500 fill-red-500"/> {post.likes}
                            </button>
                            <button className="flex items-center gap-1 text-gray-600 font-bold text-sm">
                                <Share2 size={20} /> 공유
                            </button>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed">{post.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-white">로딩중...</div>;
  if (!user) return <Routes><Route path="*" element={<AuthPage />} /></Routes>;
  return (
    <GlobalLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mealplan" element={<MealPlanPage />} />
        <Route path="/fridge" element={<FridgePage />} />
        <Route path="/recipes" element={<RecipePage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </GlobalLayout>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
