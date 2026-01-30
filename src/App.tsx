import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, ShoppingCart, Home, Users, Calendar, Refrigerator, ChefHat, LogOut, ChevronLeft, ChevronRight, Plus, AlertTriangle, Bookmark, Settings, User as UserIcon, Heart, ShoppingBag, Utensils, Zap, Sparkles, X, Clock, Flame, Share2, MoreHorizontal, CheckCircle, CalendarPlus, TrendingUp, AlertCircle, Minus, Bot, Moon, Leaf, Search as SearchIcon, Trash2, Edit2, Star, Send, Receipt, CreditCard, HelpCircle, Truck, Package, MessageCircle } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_POSTS, CATEGORIES, INGREDIENT_UNITS, ALLERGY_TAGS, DISEASE_TAGS, TODAY_MEAL, PREDEFINED_INGREDIENTS } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, CartItem, Post, DefaultMealSettings, IngredientCategory, PredefinedIngredient } from './types';

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

// --- AuthProvider ---
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

// --- DataProvider ---
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
                <img 
  src="https://www.svgrepo.com/show/475656/google-color.svg" 
  style={{ width: '20px', height: '20px', marginRight: '10px' }} 
  alt="Google" 
/>
                구글 계정으로 시작하기
            </button>
        </div>
    </div>
  );
};

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
                            <h3 className="font-bold text-gray-900 mb-3">레시피 ({matchedRecipes.length})</h3>
                            {matchedRecipes.map(r => (
                                <div key={r.id} onClick={() => { setSearchQuery(''); navigate('/recipes'); }} className="p-2 border-b">{r.name}</div>
                            ))}
                        </div>
                    )}
                    {matchedFridge.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">냉장고 ({matchedFridge.length})</h3>
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
                <div className="mb-4 font-bold text-lg">{mealModalData.recipe.name}</div>
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

// ... IngredientModal, MemberEditorModal 생략된 부분 복원 ...
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
    const { mealPlans, user } = useData();
    const today = new Date().toISOString().split('T')[0];
    const todayPlan = mealPlans.find(p => p.date === today);
    return (
        <div className="p-5">
            <h2 className="text-2xl font-bold mb-4">안녕하세요, {user?.name}님! 👋</h2>
            <div className="bg-brand/5 p-5 rounded-3xl mb-6">
                <h3 className="font-bold text-brand mb-2">오늘의 식단</h3>
                {todayPlan && (todayPlan.meals.BREAKFAST.length + todayPlan.meals.LUNCH.length + todayPlan.meals.DINNER.length) > 0 ? (
                    <div className="space-y-2">
                        {['BREAKFAST', 'LUNCH', 'DINNER'].map(type => (
                            todayPlan.meals[type as any].length > 0 && 
                            <div key={type} className="flex gap-2"><span className="text-xs font-bold w-10">{type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : '저녁'}</span><span className="text-sm">{todayPlan.meals[type as any].map((m: any) => m.recipe.name).join(', ')}</span></div>
                        ))}
                    </div>
                ) : <div className="text-gray-400 text-sm">아직 계획된 식단이 없습니다.</div>}
            </div>
        </div>
    );
};

const MealPlanPage = () => {
    const { mealPlans, removeFromMealPlan } = useData();
    const today = new Date().toISOString().split('T')[0];
    const plan = mealPlans.find(p => p.date === today);
    return (
        <div className="p-5">
            <h2 className="text-2xl font-bold mb-4">오늘의 식단 📅</h2>
            {plan ? ['BREAKFAST', 'LUNCH', 'DINNER'].map(type => (
                <div key={type} className="mb-6">
                    <h3 className="font-bold text-gray-500 mb-2">{type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : '저녁'}</h3>
                    {plan.meals[type as any].map((item: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl mb-2 flex justify-between items-center">
                            <span className="font-bold">{item.recipe.name}</span>
                            <button onClick={() => removeFromMealPlan(today, type as any, item.recipe.id)} className="text-red-400 text-xs">삭제</button>
                        </div>
                    ))}
                </div>
            )) : <div>식단이 없습니다.</div>}
        </div>
    );
};

const FridgePage = () => {
    const { fridge } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Ingredient | undefined>(undefined);
    return (
        <div className="p-5">
            <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">나의 냉장고 🧊</h2><button onClick={() => { setSelectedItem(undefined); setIsModalOpen(true); }}><Plus className="text-brand"/></button></div>
            <div className="grid grid-cols-3 gap-3">
                {fridge.map(item => (
                    <div key={item.id} onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center gap-2">
                        <div className="text-3xl">{item.image}</div><div className="font-bold text-sm text-center">{item.name}</div><div className="text-xs text-brand">{item.quantity}{item.unit}</div>
                    </div>
                ))}
            </div>
            <IngredientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={selectedItem} />
        </div>
    );
};

const RecipePage = () => {
    const { recipes, openMealModal } = useData();
    return (
        <div className="p-5">
            <h2 className="text-2xl font-bold mb-4">레시피 📖</h2>
            <div className="grid grid-cols-2 gap-4">
                {recipes.map(recipe => (
                    <div key={recipe.id} onClick={() => openMealModal(recipe)} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm">
                        <img src={recipe.image} alt={recipe.name} className="w-full h-32 object-cover" />
                        <div className="p-3"><div className="font-bold mb-1">{recipe.name}</div><div className="text-xs text-gray-400">{recipe.cookingTime}분</div></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ShoppingPage, CommunityPage, MyPage - Simple Placeholders to prevent errors
const ShoppingPage = () => <div className="p-5 text-center">장보기 페이지 (준비중)</div>;
const CommunityPage = () => <div className="p-5 text-center">커뮤니티 페이지 (준비중)</div>;
const MyPage = () => {
    const { user, logout } = useAuth();
    return (
        <div className="p-5 text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden"><img src={user?.avatar} alt="User" /></div>
            <h2 className="text-xl font-bold mb-2">{user?.name}</h2>
            <button onClick={logout} className="text-red-500 font-bold border border-red-200 px-6 py-2 rounded-xl mt-4">로그아웃</button>
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
