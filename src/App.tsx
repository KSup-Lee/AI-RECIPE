import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { Menu, Search, Bell, ShoppingCart, Home, Users, Calendar, Refrigerator, ChefHat, LogOut, ChevronLeft, ChevronRight, Plus, AlertTriangle, Bookmark, Settings, User as UserIcon, Heart, ShoppingBag, Utensils, Zap, Sparkles, X, Clock, Flame, Share2, MoreHorizontal, CheckCircle, CalendarPlus, TrendingUp, AlertCircle, Minus, Bot, Moon, Leaf, Search as SearchIcon, Trash2, Edit2, Star, Send, Receipt, CreditCard, HelpCircle, Truck, Package, MessageCircle } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_INGREDIENTS, DUMMY_MEMBERS, DUMMY_PRODUCTS, TODAY_MEAL, DUMMY_POSTS, PREDEFINED_INGREDIENTS, CATEGORIES, INGREDIENT_UNITS, ALLERGY_TAGS, DISEASE_TAGS } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, MealPlanItem, CartItem, Post, Product, DefaultMealSettings, IngredientCategory, PredefinedIngredient } from './types';

// [변경] Firebase 관련 임포트 추가
import { auth, googleProvider } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// --- Contexts ---
interface AuthContextType {
  user: User | null;
  login: (type: string) => Promise<boolean>; // 반환 타입 변경
  logout: () => void;
  loading: boolean; // 로딩 상태 추가
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DataContextType {
  recipes: Recipe[];
  fridge: Ingredient[];
  members: Member[];
  mealPlans: DailyMealPlan[];
  cart: CartItem[];
  posts: Post[];
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
  
  // Member Management
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

// --- [변경] AuthProvider (Firebase 적용) ---
const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태

  useEffect(() => {
    // Firebase 로그인 상태 감지 리스너
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 로그인 성공 시 Firebase 정보를 우리 앱 User 타입으로 변환
        setUser({
          id: firebaseUser.uid,
          username: firebaseUser.email || 'user',
          name: firebaseUser.displayName || '사용자',
          role: UserRole.USER,
          avatar: firebaseUser.photoURL || 'https://ui-avatars.com/api/?name=User'
        });
      } else {
        // 로그아웃 상태
        setUser(null);
      }
      setLoading(false); // 로딩 끝
    });

    return () => unsubscribe(); // 컴포넌트 해제 시 리스너 정리
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

// --- DataProvider ---
const DataProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  
  // 데이터베이스 연결 전까지는 더미 데이터 사용
  const [recipes, setRecipes] = useState<Recipe[]>(DUMMY_RECIPES);
  const [fridge, setFridge] = useState<Ingredient[]>(DUMMY_INGREDIENTS); 
  
  const [members, setMembers] = useState<Member[]>(DUMMY_MEMBERS);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>([TODAY_MEAL]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posts] = useState<Post[]>(DUMMY_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // [참고] 나중에 Firebase DB를 연결하면 아래 useEffect에서 데이터를 불러옵니다.
  /*
  useEffect(() => {
    if (!user) return;
    // Firebase Firestore에서 데이터 불러오는 코드 들어갈 자리
  }, [user]);
  */

  const [defaultSettings, setDefaultSettings] = useState<DefaultMealSettings>({
    weekday: {
      BREAKFAST: members.map(m => m.id),
      LUNCH: members.slice(0, 1).map(m => m.id), 
      DINNER: members.map(m => m.id),
    },
    weekend: {
      BREAKFAST: members.map(m => m.id),
      LUNCH: members.map(m => m.id),
      DINNER: members.map(m => m.id),
    }
  });
  
  const [mealModalData, setMealModalData] = useState<{ isOpen: boolean; recipe: Recipe | null }>({ isOpen: false, recipe: null });

  const addToCart = (product: any, quantity: number) => {
    setCart(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), product, quantity }]);
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const addIngredient = async (item: Ingredient) => {
    setFridge(prev => [...prev, item]); // 화면 갱신
    // 추후 DB 저장 로직 추가
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setFridge(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteIngredient = async (id: string) => {
    setFridge(prev => prev.filter(item => item.id !== id));
    // 추후 DB 삭제 로직 추가
  };

  const openMealModal = (recipe: Recipe) => {
    setMealModalData({ isOpen: true, recipe });
  };

  const closeMealModal = () => {
    setMealModalData({ isOpen: false, recipe: null });
  };

  const addToMealPlan = (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipe: Recipe, specificMembers?: string[]) => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const defaultMembers = isWeekend ? defaultSettings.weekend[type] : defaultSettings.weekday[type];
    const initialMembers = specificMembers || defaultMembers;

    setMealPlans(prev => {
        const existingPlanIndex = prev.findIndex(p => p.date === date);
        if (existingPlanIndex > -1) {
            const newPlans = [...prev];
            newPlans[existingPlanIndex] = {
                ...newPlans[existingPlanIndex],
                meals: {
                    ...newPlans[existingPlanIndex].meals,
                    [type]: [...newPlans[existingPlanIndex].meals[type], { recipe, memberIds: initialMembers, isCompleted: false }]
                }
            };
            return newPlans;
        } else {
            const newPlan: DailyMealPlan = {
                date: date,
                meals: {
                    BREAKFAST: [],
                    LUNCH: [],
                    DINNER: []
                }
            };
            newPlan.meals[type].push({ recipe, memberIds: initialMembers, isCompleted: false });
            return [...prev, newPlan];
        }
    });
    alert(`[${recipe.name}]이(가) ${date} ${type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : '저녁'} 식단에 추가되었습니다.`);
    closeMealModal();
  };

  const removeFromMealPlan = (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string) => {
    setMealPlans(prev => prev.map(plan => {
      if (plan.date !== date) return plan;
      return {
        ...plan,
        meals: {
          ...plan.meals,
          [type]: plan.meals[type].filter(item => item.recipe.id !== recipeId)
        }
      };
    }));
  };

  const updateMealMembers = (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string, memberId: string) => {
    setMealPlans(prev => prev.map(plan => {
      if (plan.date !== date) return plan;
      return {
        ...plan,
        meals: {
          ...plan.meals,
          [mealType]: plan.meals[mealType].map(item => {
            if (item.recipe.id === recipeId) {
                const isSelected = item.memberIds.includes(memberId);
                const newMemberIds = isSelected 
                    ? item.memberIds.filter(id => id !== memberId)
                    : [...item.memberIds, memberId];
                return { ...item, memberIds: newMemberIds };
            }
            return item;
          })
        }
      };
    }));
  };

  const saveDefaultSettings = (settings: DefaultMealSettings) => {
    setDefaultSettings(settings);
    alert('기본 식단 설정이 저장되었습니다.');
  };

  const cookRecipe = (recipe: Recipe) => {
    let deductedCount = 0;
    const newFridge = fridge.map(item => {
        const recipeIng = recipe.ingredients.find(ri => item.name.includes(ri.name) || ri.name.includes(item.name));
        if (recipeIng) {
            deductedCount++;
            return { ...item, quantity: Math.max(0, item.quantity - 1) };
        }
        return item;
    });
    
    if (deductedCount > 0) {
        setFridge(newFridge);
        alert(`냉장고에서 ${deductedCount}개의 재료를 사용했습니다.`);
    } else {
        alert('사용 가능한 냉장고 재료가 없습니다.');
    }
  };

  const addMember = (member: Member) => {
    setMembers(prev => [...prev, member]);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <DataContext.Provider value={{ recipes, fridge, members, mealPlans, cart, posts, searchQuery, setSearchQuery, addToCart, removeFromCart, addIngredient, updateIngredient, deleteIngredient, addToMealPlan, removeFromMealPlan, openMealModal, closeMealModal, mealModalData, updateMealMembers, defaultSettings, saveDefaultSettings, cookRecipe, addMember, updateMember, deleteMember }}>
      {children}
    </DataContext.Provider>
  );
};

// --- Components (Helper) ---
const MealZipLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="14" width="10" height="10" rx="4" fill="currentColor" fillOpacity="0.8"/>
    <rect x="22" y="8" width="10" height="10" rx="4" fill="currentColor" fillOpacity="0.4"/>
    <rect x="22" y="22" width="10" height="10" rx="4" fill="currentColor"/>
    <path d="M18 19H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M27 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// --- [변경] AuthPage (구글 로그인 화면) ---
const AuthPage = () => {
  const { login } = useAuth();

  return (
    <div className="h-screen bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center w-full max-w-xs">
            <div className="w-20 h-20 bg-green-700 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-700/30 rotate-3">
                <ChefHat size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">MealZip</h1>
            <p className="text-gray-400 mb-12">우리 가족 맞춤 식단 관리</p>

            <button 
                onClick={() => login('google')}
                className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 relative"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                구글 계정으로 시작하기
            </button>
            
            <p className="text-[10px] text-gray-400 mt-6 text-center">
                계속 진행하면 서비스 이용약관에 동의하게 됩니다.
            </p>
        </div>
    </div>
  );
};

// ... (기존 컴포넌트들은 그대로 유지) ...
// (분량 문제로 GlobalSearchOverlay, MealAddModal, IngredientModal, MemberEditorModal 등은 생략했습니다. 
//  하지만 **기존 코드에 있던 것 그대로 두시면 됩니다.** 아래는 GlobalLayout부터 다시 보여드립니다.)

const GlobalSearchOverlay = () => {
    const { searchQuery, recipes, fridge, posts, setSearchQuery } = useData();
    const navigate = useNavigate();

    if (!searchQuery) return null;

    const matchedRecipes = recipes.filter(r => r.name.includes(searchQuery) || r.tags.some(t => t.includes(searchQuery)));
    const matchedFridge = fridge.filter(f => f.name.includes(searchQuery));
    const matchedPosts = posts.filter(p => p.content.includes(searchQuery) || p.userName.includes(searchQuery));
    
    const hasResults = matchedRecipes.length > 0 || matchedFridge.length > 0 || matchedPosts.length > 0;

    return (
        <div className="absolute inset-x-0 top-[108px] bottom-0 bg-white z-40 overflow-y-auto p-5 animate-[fadeIn_0.2s_ease-out]">
            {!hasResults ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <SearchIcon size={48} className="mb-4 opacity-20" />
                    <p>검색 결과가 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-6 pb-20">
                    {matchedRecipes.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <ChefHat size={18} className="text-brand"/> 레시피 ({matchedRecipes.length})
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {matchedRecipes.map(r => (
                                    <div key={r.id} onClick={() => { setSearchQuery(''); navigate('/recipes'); }} className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl cursor-pointer">
                                        <img src={r.image} className="w-12 h-12 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{r.name}</div>
                                            <div className="text-xs text-gray-400 truncate">{r.tags.join(' ')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {matchedFridge.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Refrigerator size={18} className="text-blue-500"/> 냉장고 ({matchedFridge.length})
                            </h3>
                            <div className="space-y-2">
                                {matchedFridge.map(f => (
                                    <div key={f.id} onClick={() => { setSearchQuery(''); navigate('/fridge'); }} className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">{f.image}</div>
                                            <span className="font-bold text-gray-800">{f.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-blue-500">{f.quantity}{f.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {matchedPosts.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Users size={18} className="text-orange-500"/> 커뮤니티 ({matchedPosts.length})
                            </h3>
                            <div className="space-y-3">
                                {matchedPosts.map(p => (
                                    <div key={p.id} onClick={() => { setSearchQuery(''); navigate('/community'); }} className="bg-white border border-gray-100 p-3 rounded-xl flex gap-3 cursor-pointer shadow-sm">
                                        <img src={p.image} className="w-16 h-16 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-800 line-clamp-2">{p.content}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">by {p.userName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">식단에 추가하기</h3>
                    <button onClick={closeMealModal} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                </div>
                
                <div className="flex gap-4 mb-6">
                    <img src={mealModalData.recipe.image} className="w-20 h-20 rounded-2xl object-cover bg-gray-100" />
                    <div>
                        <div className="text-xs text-brand font-bold mb-1">{mealModalData.recipe.category}</div>
                        <div className="font-bold text-gray-900 text-lg leading-tight mb-1">{mealModalData.recipe.name}</div>
                        <div className="text-xs text-gray-400">{mealModalData.recipe.cookingTime}분 소요</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">날짜 선택</label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-gray-50 border-0 rounded-xl p-4 text-gray-900 font-bold outline-none focus:ring-2 focus:ring-brand text-center text-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">시간 선택</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'BREAKFAST', label: '아침', icon: '🌅' },
                                { id: 'LUNCH', label: '점심', icon: '☀️' },
                                { id: 'DINNER', label: '저녁', icon: '🌙' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setType(item.id as any)}
                                    className={`py-3 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-1 ${type === item.id ? 'bg-brand text-white border-brand shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => addToMealPlan(date, type, mealModalData.recipe!)}
                    className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-lg mt-8 text-lg hover:bg-green-800 transition-colors"
                >
                    추가하기
                </button>
            </div>
        </div>
    );
};
const IngredientModal = ({ isOpen, onClose, initialData }: { isOpen: boolean, onClose: () => void, initialData?: Ingredient }) => {
    const { addIngredient, updateIngredient, deleteIngredient } = useData();
    const [mode, setMode] = useState<'SELECT' | 'DETAIL'>(initialData ? 'DETAIL' : 'SELECT');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'ALL'>('VEGETABLE');
    const [form, setForm] = useState<Partial<Ingredient>>({
        name: '',
        category: 'VEGETABLE',
        quantity: 1,
        unit: '개',
        storage: 'FRIDGE',
        expiryDate: '',
        image: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setMode('DETAIL');
                setForm(initialData);
            } else {
                setMode('SELECT');
                setForm({
                    name: '', category: 'VEGETABLE', quantity: 1, unit: '개', storage: 'FRIDGE', expiryDate: '', image: ''
                });
                setSearch('');
            }
        }
    }, [isOpen, initialData]);

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
        setMode('DETAIL');
    };

    const handleSave = () => {
        if (initialData) {
            updateIngredient(initialData.id, form);
        } else {
            addIngredient({ ...form, id: Math.random().toString(36).substr(2, 9) } as Ingredient);
        }
        onClose();
    };

    const handleDelete = () => {
        if (initialData) {
            deleteIngredient(initialData.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-5 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-0 shadow-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col animate-[slideUp_0.3s_ease-out] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div className="flex items-center gap-2">
                        {mode === 'DETAIL' && !initialData && (
                            <button onClick={() => setMode('SELECT')} className="p-1 -ml-2 rounded-full hover:bg-gray-100">
                                <ChevronLeft size={24} className="text-gray-900" />
                            </button>
                        )}
                        <h3 className="font-bold text-xl text-gray-900">
                            {mode === 'SELECT' ? '재료 선택' : (initialData ? '재료 수정' : '상세 입력')}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-900"/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    {mode === 'SELECT' ? (
                        <div className="p-2">
                            {/* Search */}
                            <div className="px-4 py-2 sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
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
                            </div>

                            {/* Category Tabs */}
                            <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
                                <button 
                                    onClick={() => setSelectedCategory('ALL')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'ALL' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
                                >
                                    전체
                                </button>
                                {CATEGORIES.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === cat.id ? 'bg-brand text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
                                    >
                                        <span>{cat.icon}</span> {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Grid */}
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
                            {/* Icon & Name */}
                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-sm border border-gray-100">
                                    {form.image || '📦'}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{form.name}</h2>
                                <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-lg">
                                    {CATEGORIES.find(c => c.id === form.category)?.label}
                                </span>
                            </div>

                            {/* Form Fields */}
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                                {/* Storage */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">보관 방법</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'FRIDGE', label: '냉장', icon: '❄️' },
                                            { id: 'FREEZER', label: '냉동', icon: '🧊' },
                                            { id: 'ROOM', label: '실온', icon: '🧺' }
                                        ].map(opt => (
                                            <button 
                                                key={opt.id}
                                                onClick={() => setForm({...form, storage: opt.id as any})}
                                                className={`py-3 rounded-xl text-sm font-bold border flex flex-col items-center gap-1 transition-all ${form.storage === opt.id ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}
                                            >
                                                <span className="text-lg">{opt.icon}</span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Expiry */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">소비기한</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={form.expiryDate}
                                            onChange={(e) => setForm({...form, expiryDate: e.target.value})}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-4 pl-12 text-gray-900 font-bold outline-none focus:ring-2 focus:ring-brand"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    </div>
                                </div>

                                {/* Quantity & Unit - Fixed Layout */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">수량 및 단위</label>
                                    <div className="flex gap-3 h-14">
                                        <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
                                            <button onClick={() => setForm(prev => ({...prev, quantity: Math.max(0, (prev.quantity || 0) - 1)}))} className="p-2 text-gray-400 hover:text-brand"><Minus size={20}/></button>
                                            <input 
                                                type="number" 
                                                value={form.quantity}
                                                onChange={(e) => setForm({...form, quantity: parseFloat(e.target.value)})}
                                                className="flex-1 bg-transparent border-none text-center font-bold text-xl text-gray-900 outline-none w-full"
                                            />
                                            <button onClick={() => setForm(prev => ({...prev, quantity: (prev.quantity || 0) + 1}))} className="p-2 text-gray-400 hover:text-brand"><Plus size={20}/></button>
                                        </div>
                                        <div className="w-1/3 relative">
                                            <select 
                                                value={form.unit}
                                                onChange={(e) => setForm({...form, unit: e.target.value})}
                                                className="w-full h-full bg-white border border-gray-200 rounded-xl px-4 font-bold text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none"
                                            >
                                                {INGREDIENT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronLeft size={16} className="-rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {mode === 'DETAIL' && (
                    <div className="p-5 bg-white border-t border-gray-100 flex gap-3 safe-bottom">
                        {initialData && (
                            <button 
                                onClick={handleDelete}
                                className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={24} />
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-brand text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-800 transition-colors text-lg"
                        >
                            {initialData ? '수정 완료' : '냉장고에 넣기'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
const MemberEditorModal = ({ isOpen, onClose, member }: { isOpen: boolean, onClose: () => void, member?: Member }) => {
    const { addMember, updateMember, deleteMember } = useData();
    const [dislikeSearch, setDislikeSearch] = useState('');
    const [showDislikeSuggestions, setShowDislikeSuggestions] = useState(false);
    const [form, setForm] = useState<Partial<Member>>({
        name: '',
        gender: 'M',
        birthDate: '',
        height: undefined,
        weight: undefined,
        bodyType: 'Average',
        hasNoAllergy: false,
        allergies: [],
        hasNoDisease: false,
        diseases: [],
        proteinFocus: false,
        quickOnly: false,
        dislikes: [],
        avatarColor: 'bg-gray-400'
    });

    // Helper states for date selection
    const [birthYear, setBirthYear] = useState(new Date().getFullYear());
    const [birthMonth, setBirthMonth] = useState(1);
    const [birthDay, setBirthDay] = useState(1);

    useEffect(() => {
        if (isOpen) {
            if (member) {
                setForm(member);
                if (member.birthDate) {
                    const d = new Date(member.birthDate);
                    setBirthYear(d.getFullYear());
                    setBirthMonth(d.getMonth() + 1);
                    setBirthDay(d.getDate());
                }
            } else {
                const now = new Date();
                setForm({
                    name: '',
                    gender: 'M',
                    birthDate: now.toISOString().split('T')[0],
                    height: 170,
                    weight: 65,
                    bodyType: 'Average',
                    hasNoAllergy: false,
                    allergies: [],
                    hasNoDisease: false,
                    diseases: [],
                    proteinFocus: false,
                    quickOnly: false,
                    dislikes: [],
                    avatarColor: ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500'][Math.floor(Math.random() * 4)],
                    relationship: 'FAMILY'
                });
                setBirthYear(now.getFullYear());
                setBirthMonth(now.getMonth() + 1);
                setBirthDay(now.getDate());
            }
            setDislikeSearch('');
            setShowDislikeSuggestions(false);
        }
    }, [isOpen, member]);

    useEffect(() => {
        // Sync birthDate string with selectors
        const m = birthMonth.toString().padStart(2, '0');
        const d = birthDay.toString().padStart(2, '0');
        setForm(prev => ({ ...prev, birthDate: `${birthYear}-${m}-${d}` }));
    }, [birthYear, birthMonth, birthDay]);

    const handleSave = () => {
        if (!form.name) return alert('이름을 입력해주세요.');
        if (member) {
            updateMember(member.id, form);
        } else {
            addMember({ ...form, id: Math.random().toString(36).substr(2, 9) } as Member);
        }
        onClose();
    };

    const handleDelete = () => {
        if (member) {
            if (member.relationship === 'ME') return alert('본인 계정은 삭제할 수 없습니다.');
            // More explicit warning message
            if (window.confirm(`${member.name} 멤버를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
                deleteMember(member.id);
                onClose();
            }
        }
    };

    const toggleArrayItem = (field: 'allergies' | 'diseases', value: string) => {
        setForm(prev => {
            const list = prev[field] || [];
            const newList = list.includes(value) ? list.filter(i => i !== value) : [...list, value];
            
            // Logic for mutual exclusivity with 'hasNo...'
            if (field === 'allergies') {
                return { ...prev, [field]: newList, hasNoAllergy: false };
            } else {
                return { ...prev, [field]: newList, hasNoDisease: false };
            }
        });
    };

    const toggleNoHealthIssue = (type: 'allergy' | 'disease') => {
        if (type === 'allergy') {
            const newState = !form.hasNoAllergy;
            setForm(prev => ({ 
                ...prev, 
                hasNoAllergy: newState, 
                allergies: newState ? [] : prev.allergies 
            }));
        } else {
            const newState = !form.hasNoDisease;
            setForm(prev => ({ 
                ...prev, 
                hasNoDisease: newState, 
                diseases: newState ? [] : prev.diseases 
            }));
        }
    };

    const addDislike = (ingredientName: string) => {
        if (form.dislikes?.includes(ingredientName)) return;
        setForm(prev => ({ ...prev, dislikes: [...(prev.dislikes || []), ingredientName] }));
        setDislikeSearch('');
        setShowDislikeSuggestions(false);
    };

    const removeDislike = (ingredientName: string) => {
        setForm(prev => ({ ...prev, dislikes: prev.dislikes?.filter(d => d !== ingredientName) }));
    };

    // Arrays for Selectors
    const years = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const days = Array.from({length: 31}, (_, i) => i + 1);
    const heights = Array.from({length: 151}, (_, i) => 100 + i); // 100-250
    const weights = Array.from({length: 131}, (_, i) => 20 + i); // 20-150

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-900">
                    <X size={24} />
                </button>
                <h2 className="font-bold text-lg text-gray-900">{member ? '멤버 수정' : '새 멤버 추가'}</h2>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Content Container - Increased bottom padding significantly (pb-80) to allow scrolling past keyboard */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-5 space-y-6 pb-80">
                {/* Section A: Basic Info */}
                <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2"><UserIcon size={16} /> 기본 정보</h3>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5">이름</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand outline-none"
                            value={form.name}
                            onChange={e => setForm({...form, name: e.target.value})}
                            placeholder="이름 입력"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">성별</label>
                            <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
                                {['M', 'F'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => setForm({...form, gender: g as any})}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.gender === g ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                                    >
                                        {g === 'M' ? '남성' : '여성'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">생년월일</label>
                            <div className="flex gap-2">
                                <select value={birthYear} onChange={e => setBirthYear(Number(e.target.value))} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold outline-none">
                                    {years.map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select value={birthMonth} onChange={e => setBirthMonth(Number(e.target.value))} className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold outline-none">
                                    {months.map(m => <option key={m} value={m}>{m}월</option>)}
                                </select>
                                <select value={birthDay} onChange={e => setBirthDay(Number(e.target.value))} className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold outline-none">
                                    {days.map(d => <option key={d} value={d}>{d}일</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">키</label>
                            <select 
                                value={form.height} 
                                onChange={e => setForm({...form, height: Number(e.target.value)})} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold outline-none"
                            >
                                {heights.map(h => <option key={h} value={h}>{h}cm</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">몸무게</label>
                            <select 
                                value={form.weight} 
                                onChange={e => setForm({...form, weight: Number(e.target.value)})} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold outline-none"
                            >
                                {weights.map(w => <option key={w} value={w}>{w}kg</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">체형</label>
                            <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-xs font-bold outline-none" value={form.bodyType} onChange={e => setForm({...form, bodyType: e.target.value as any})}>
                                <option value="Slim">마름</option>
                                <option value="Average">보통</option>
                                <option value="Muscular">근육질</option>
                                <option value="Chubby">통통</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Section B: Health Info */}
                <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Heart size={16} className="text-red-500" /> 건강 정보</h3>
                    
                    {/* Allergy */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500">알레르기</label>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleNoHealthIssue('allergy')}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.hasNoAllergy ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                                    {form.hasNoAllergy && <CheckCircle size={12} className="text-white" />}
                                </div>
                                <span className="text-xs text-gray-500">없음</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ALLERGY_TAGS.map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => toggleArrayItem('allergies', tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${form.allergies?.includes(tag) ? 'bg-red-50 text-red-500 border border-red-100 ring-1 ring-red-200' : 'bg-gray-50 text-gray-400 border border-transparent'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Disease */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500">지병/건강우려</label>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleNoHealthIssue('disease')}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.hasNoDisease ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                                    {form.hasNoDisease && <CheckCircle size={12} className="text-white" />}
                                </div>
                                <span className="text-xs text-gray-500">없음</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {DISEASE_TAGS.map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => toggleArrayItem('diseases', tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${form.diseases?.includes(tag) ? 'bg-orange-50 text-orange-500 border border-orange-100 ring-1 ring-orange-200' : 'bg-gray-50 text-gray-400 border border-transparent'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section C: Preferences */}
                <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Utensils size={16} className="text-brand" /> 식습관 & 취향</h3>
                        <span className="text-[10px] text-brand bg-brand/10 px-2 py-1 rounded-full font-bold">레시피 추천 기준</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm"><Flame size={14} className="text-orange-500"/></div>
                            <span className="text-xs font-bold text-gray-700">단백질 위주 식단</span>
                        </div>
                        <div 
                            onClick={() => setForm({...form, proteinFocus: !form.proteinFocus})}
                            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${form.proteinFocus ? 'bg-brand' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${form.proteinFocus ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm"><Clock size={14} className="text-blue-500"/></div>
                            <span className="text-xs font-bold text-gray-700">20분 이내 간단 요리 선호</span>
                        </div>
                        <div 
                            onClick={() => setForm({...form, quickOnly: !form.quickOnly})}
                            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${form.quickOnly ? 'bg-brand' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${form.quickOnly ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 mb-1.5">못 먹는 음식 (재료 선택)</label>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-brand outline-none placeholder:text-gray-300"
                                placeholder="못 먹는 재료 검색 (예: 오이)"
                                value={dislikeSearch}
                                onFocus={() => setShowDislikeSuggestions(true)}
                                onChange={e => {
                                    setDislikeSearch(e.target.value);
                                    setShowDislikeSuggestions(true);
                                }}
                            />
                        </div>
                        {/* Search Results Dropdown */}
                        {(showDislikeSuggestions) && (
                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-2 mt-2 max-h-48 overflow-y-auto w-full">
                                {dislikeSearch === '' && (
                                    <div className="px-3 py-2 text-xs font-bold text-gray-400">자주 선택하는 재료</div>
                                )}
                                {PREDEFINED_INGREDIENTS.filter(item => 
                                    item.name.includes(dislikeSearch) || (dislikeSearch === '' && ['오이', '당근', '가지', '피망', '버섯'].includes(item.name))
                                ).map(item => (
                                    <button 
                                        key={item.name}
                                        onClick={() => addDislike(item.name)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-800 flex items-center gap-2"
                                    >
                                        <span className="text-lg">{item.icon}</span> {item.name}
                                    </button>
                                ))}
                                {dislikeSearch !== '' && PREDEFINED_INGREDIENTS.filter(item => item.name.includes(dislikeSearch)).length === 0 && (
                                    <div className="p-2 text-xs text-gray-400 text-center">검색 결과가 없습니다</div>
                                )}
                            </div>
                        )}
                        {/* Selected Dislikes Tags */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {form.dislikes?.map((item, idx) => (
                                <span key={idx} className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-red-100">
                                    {item}
                                    <button onClick={() => removeDislike(item)} className="bg-red-200 rounded-full p-0.5 text-white hover:bg-red-300">
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer Buttons - Fixed Layout ensuring visibility */}
            <div className="absolute bottom-0 w-full p-5 bg-white border-t border-gray-100 flex gap-3 safe-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
                {member && member.relationship !== 'ME' && (
                    <button 
                        onClick={handleDelete}
                        className="px-6 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                    >
                        <Trash2 size={20} /> 삭제
                    </button>
                )}
                <button 
                    onClick={handleSave}
                    className="flex-1 bg-brand text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-800 transition-colors text-lg"
                >
                    저장하기
                </button>
            </div>
        </div>
    );
};
const GlobalLayout = ({ children }: { children?: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, searchQuery, setSearchQuery } = useData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Original Navigation Order and Icons
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
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [location.pathname]);

  const toggleSearch = () => {
    if (isSearchOpen) {
        setSearchQuery('');
    }
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans text-gray-900">
      <header className="bg-white px-5 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-1.5 cursor-pointer flex-1" onClick={() => navigate('/')}>
            <MealZipLogo className="w-8 h-8 text-brand" />
            <h1 className="text-xl font-bold text-gray-800 tracking-tight font-sans">MealZip</h1>
        </div>
        
        <div className="w-6 h-6 hidden"></div> 

        <div className="flex items-center gap-4">
          <button onClick={toggleSearch} className={`${isSearchOpen ? 'text-brand' : 'text-gray-800'}`}>
            <Search className="w-6 h-6 stroke-[1.5]" />
          </button>
          <div className="relative cursor-pointer" onClick={() => navigate('/shopping')}>
            <ShoppingBag className="w-6 h-6 text-gray-800 stroke-[1.5]" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {isSearchOpen && (
        <div className="px-4 pb-2 bg-white sticky top-[52px] z-30 animate-[slideDown_0.2s_ease-out]">
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="레시피, 재료, 글 검색..." 
                className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/20"
                autoFocus
            />
        </div>
      )}

      <GlobalSearchOverlay />
      <MealAddModal />

      <div 
        ref={scrollContainerRef}
        className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-1 shrink-0 z-20 sticky top-[52px] scroll-smooth"
      >
        {topNavItems.map((item) => {
           const isActive = location.pathname === item.path;
           return (
            <button
                key={item.label}
                data-active={isActive}
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 text-[15px] transition-all duration-300 relative mr-2 ${isActive ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium hover:text-gray-600'}`}
            >
                {item.label}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-brand rounded-full transition-all duration-300 ${isActive ? 'w-[20px]' : 'w-0'}`}></div>
            </button>
           );
        })}
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 no-scrollbar bg-background">
        {children}
      </main>

      <nav className="absolute bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-around py-2 pb-8 z-30 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const isMain = (item as any).isMain;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${isMain ? '-mt-8 z-10' : ''}`}
            >
              <div className={`${isMain ? 'w-16 h-16 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/40 mb-1 scale-110 border-4 border-white' : ''}`}>
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

const AppRoutes = () => {
  const { user, loading } = useAuth(); // 로딩 상태 가져오기
  
  // 로딩 중이면 흰 화면이나 스피너 보여주기 (로그인 페이지로 튕기는 것 방지)
  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-white">로딩중...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

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
