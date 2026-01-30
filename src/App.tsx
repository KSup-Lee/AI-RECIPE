import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, ShoppingCart, Home, Users, Calendar, Refrigerator, ChefHat, LogOut, ChevronLeft, ChevronRight, Plus, AlertTriangle, Bookmark, Settings, User as UserIcon, Heart, ShoppingBag, Utensils, Zap, Sparkles, X, Clock, Flame, Share2, MoreHorizontal, CheckCircle, CalendarPlus, TrendingUp, AlertCircle, Minus, Bot, Moon, Leaf, Search as SearchIcon, Trash2, Edit2, Star, Send, Receipt, CreditCard, HelpCircle, Truck, Package, MessageCircle } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_POSTS, DUMMY_PRODUCTS, CATEGORIES, INGREDIENT_UNITS, ALLERGY_TAGS, DISEASE_TAGS, TODAY_MEAL, PREDEFINED_INGREDIENTS } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, CartItem, Post, DefaultMealSettings, IngredientCategory, PredefinedIngredient, MealPlanItem } from './types';

// [Firebase Imports]
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

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
  const [recipes] = useState<Recipe[]>(DUMMY_RECIPES);
  const [fridge, setFridge] = useState<Ingredient[]>([]); 
  const [members, setMembers] = useState<Member[]>([]);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posts] = useState<Post[]>(DUMMY_POSTS);
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
        return;
    }
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
    return () => { fridgeUnsub(); membersUnsub(); mealsUnsub(); };
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
    <DataContext.Provider value={{ recipes, fridge, members, mealPlans, cart, posts, searchQuery, setSearchQuery, addToCart, removeFromCart, addIngredient, updateIngredient, deleteIngredient, addToMealPlan, removeFromMealPlan, openMealModal, closeMealModal, mealModalData, updateMealMembers, defaultSettings, saveDefaultSettings, cookRecipe, addMember, updateMember, deleteMember }}>
      {children}
    </DataContext.Provider>
  );
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

// ... (Overlay, Modals 복구) ...
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

const IngredientModal = ({ isOpen, onClose, initialData }: any) => {
    const { addIngredient, updateIngredient, deleteIngredient } = useData();
    const [form, setForm] = useState<Partial<Ingredient>>({ name: '', category: 'VEGETABLE', quantity: 1, unit: '개', storage: 'FRIDGE', expiryDate: '', image: '📦' });
    useEffect(() => { if (isOpen) setForm(initialData || { name: '', category: 'VEGETABLE', quantity: 1, unit: '개', storage: 'FRIDGE', expiryDate: '', image: '📦' }); }, [isOpen, initialData]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
                <div className="flex justify-between mb-4"><h3 className="font-bold text-xl">{initialData ? '재료 수정' : '재료 추가'}</h3><button onClick={onClose}><X/></button></div>
                <input placeholder="이름" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl mb-3" />
                <div className="flex gap-2 mb-3">
                    <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="flex-1 p-3 bg-gray-50 rounded-xl" />
                    <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-20 bg-gray-50 rounded-xl">{INGREDIENT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
                </div>
                <button onClick={() => { initialData ? updateIngredient(initialData.id, form) : addIngredient({...form, id: Math.random().toString()} as Ingredient); onClose(); }} className="w-full bg-brand text-white py-4 rounded-2xl font-bold">저장</button>
                {initialData && <button onClick={() => { deleteIngredient(initialData.id); onClose(); }} className="w-full mt-2 text-red-500 py-2">삭제</button>}
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

// --- Pages (Rich Version 복구) ---
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
    const { members } = useData();
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
                <div className="grid grid-cols-4 gap-2">
                    {[ { label: '포인트', val: '2,500', icon: CreditCard }, { label: '쿠폰', val: '3장', icon: Receipt }, { label: '리뷰', val: '12', icon: MessageCircle }, { label: '주문배송', val: '1건', icon: Truck } ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 cursor-pointer group"><div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 group-hover:bg-brand/10 group-hover:text-brand transition-colors"><item.icon size={20} strokeWidth={1.5} /></div><span className="text-[10px] text-gray-400 font-medium mb-0.5">{item.label}</span><span className="text-sm font-bold text-gray-900">{item.val}</span></div>
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

// ... (MealPlanPage, FridgePage, RecipePage, ShoppingPage, CommunityPage 등 기존 페이지 유지)
// 코드가 너무 길어지므로 생략된 부분은 기존 코드를 그대로 유지하세요. 
// 아래 AppRoutes와 App만 교체하세요.

const MealPlanPage = () => <div className="p-5">식단 페이지 (내용 복구 필요)</div>;
const FridgePage = () => {
    const { fridge } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="p-5">
            <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">나의 냉장고</h2><button onClick={() => setIsModalOpen(true)}><Plus/></button></div>
            <div className="grid grid-cols-3 gap-3">{fridge.map(f => <div key={f.id} className="bg-gray-50 p-3 rounded-2xl text-center"><div className="text-3xl">{f.image}</div><div className="font-bold">{f.name}</div></div>)}</div>
            <IngredientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};
const RecipePage = () => <div className="p-5">레시피 페이지 (내용 복구 필요)</div>;
const ShoppingPage = () => <div className="p-5">장보기 페이지 (내용 복구 필요)</div>;
const CommunityPage = () => <div className="p-5">커뮤니티 페이지 (내용 복구 필요)</div>;

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
