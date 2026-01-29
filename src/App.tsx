import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { Menu, Search, Bell, ShoppingCart, Home, Users, Calendar, Refrigerator, ChefHat, LogOut, ChevronLeft, ChevronRight, Plus, AlertTriangle, Bookmark, Settings, User as UserIcon, Heart, ShoppingBag, Utensils, Zap, Sparkles, X, Clock, Flame, Share2, MoreHorizontal, CheckCircle, CalendarPlus, TrendingUp, AlertCircle, Minus, Bot, Moon, Leaf, Search as SearchIcon, Trash2, Edit2, Star, Send, Receipt, CreditCard, HelpCircle, Truck, Package, MessageCircle } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_POSTS, PREDEFINED_INGREDIENTS, CATEGORIES, INGREDIENT_UNITS, ALLERGY_TAGS, DISEASE_TAGS, TODAY_MEAL } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, MealPlanItem, CartItem, Post, Product, DefaultMealSettings, IngredientCategory, PredefinedIngredient } from './types';

// [Firebase Imports]
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs, where } from 'firebase/firestore';

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

// --- DataProvider (Firebase DB 연동) ---
const DataProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  
  // 레시피는 공통 데이터이므로 더미 데이터 사용 (나중에 관리자 기능으로 DB화 가능)
  const [recipes] = useState<Recipe[]>(DUMMY_RECIPES);
  
  // 사용자별 데이터 (DB에서 불러옴)
  const [fridge, setFridge] = useState<Ingredient[]>([]); 
  const [members, setMembers] = useState<Member[]>([]);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>([]);
  
  // 로컬 상태 (장바구니 등은 임시)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posts] = useState<Post[]>(DUMMY_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [defaultSettings, setDefaultSettings] = useState<DefaultMealSettings>({
    weekday: { BREAKFAST: [], LUNCH: [], DINNER: [] },
    weekend: { BREAKFAST: [], LUNCH: [], DINNER: [] }
  });
  
  const [mealModalData, setMealModalData] = useState<{ isOpen: boolean; recipe: Recipe | null }>({ isOpen: false, recipe: null });

  // [Firebase] 데이터 실시간 동기화
  useEffect(() => {
    if (!user) {
        // 로그아웃 시 데이터 초기화
        setFridge([]);
        setMembers([]);
        setMealPlans([]);
        return;
    }

    // 1. 냉장고 재료 가져오기
    const fridgeUnsub = onSnapshot(collection(db, 'users', user.id, 'fridge'), (snapshot) => {
        const newFridge = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
        setFridge(newFridge);
    });

    // 2. 멤버 가져오기
    const membersUnsub = onSnapshot(collection(db, 'users', user.id, 'members'), (snapshot) => {
        const newMembers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
        setMembers(newMembers);
    });

    // 3. 식단 가져오기
    const mealsUnsub = onSnapshot(collection(db, 'users', user.id, 'mealPlans'), (snapshot) => {
        const newMeals = snapshot.docs.map(doc => ({ ...doc.data(), date: doc.id } as DailyMealPlan));
        // 식단이 비어있으면 오늘 날짜 기본 식단 하나 넣어주기 (UI용)
        if (newMeals.length === 0) {
            setMealPlans([TODAY_MEAL]); 
        } else {
            setMealPlans(newMeals);
        }
    });

    return () => {
        fridgeUnsub();
        membersUnsub();
        mealsUnsub();
    };
  }, [user]);


  // --- Actions (DB 쓰기) ---

  const addToCart = (product: any, quantity: number) => {
    setCart(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), product, quantity }]);
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const addIngredient = async (item: Ingredient) => {
    if (!user) return;
    // id는 제외하고 저장 (Firebase가 자동 생성하거나 덮어씀)
    const { id, ...data } = item; 
    await addDoc(collection(db, 'users', user.id, 'fridge'), data);
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.id, 'fridge', id);
    await updateDoc(docRef, updates);
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
    const docRef = doc(db, 'users', user.id, 'members', id);
    await updateDoc(docRef, updates);
  };

  const deleteMember = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'members', id));
  };

  // 식단 관련 로직 (조금 복잡함 - 날짜별 Document로 관리)
  const addToMealPlan = async (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipe: Recipe, specificMembers?: string[]) => {
    if (!user) return;
    
    // 기본 멤버 설정
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const defaultMembers = isWeekend ? defaultSettings.weekend[type] : defaultSettings.weekday[type];
    const initialMembers = specificMembers || defaultMembers;

    // 현재 해당 날짜의 식단 찾기
    const currentPlan = mealPlans.find(p => p.date === date) || { date, meals: { BREAKFAST: [], LUNCH: [], DINNER: [] } };
    
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[type] = [...updatedMeals[type], { recipe, memberIds: initialMembers, isCompleted: false }];

    // Firestore에 저장 (날짜를 ID로 사용)
    const docRef = doc(db, 'users', user.id, 'mealPlans', date);
    await setDoc(docRef, { meals: updatedMeals });

    alert(`[${recipe.name}]이(가) 식단에 추가되었습니다.`);
    closeMealModal();
  };

  const removeFromMealPlan = async (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string) => {
    if (!user) return;
    const currentPlan = mealPlans.find(p => p.date === date);
    if (!currentPlan) return;

    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[type] = updatedMeals[type].filter(item => item.recipe.id !== recipeId);

    const docRef = doc(db, 'users', user.id, 'mealPlans', date);
    await setDoc(docRef, { meals: updatedMeals }); // 덮어쓰기
  };

  const updateMealMembers = async (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string, memberId: string) => {
    if (!user) return;
    const currentPlan = mealPlans.find(p => p.date === date);
    if (!currentPlan) return;

    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[mealType] = updatedMeals[mealType].map(item => {
        if (item.recipe.id === recipeId) {
            const isSelected = item.memberIds.includes(memberId);
            const newMemberIds = isSelected 
                ? item.memberIds.filter(id => id !== memberId)
                : [...item.memberIds, memberId];
            return { ...item, memberIds: newMemberIds };
        }
        return item;
    });

    const docRef = doc(db, 'users', user.id, 'mealPlans', date);
    await setDoc(docRef, { meals: updatedMeals });
  };

  const openMealModal = (recipe: Recipe) => {
    setMealModalData({ isOpen: true, recipe });
  };

  const closeMealModal = () => {
    setMealModalData({ isOpen: false, recipe: null });
  };

  const saveDefaultSettings = (settings: DefaultMealSettings) => {
    setDefaultSettings(settings);
    // 추후 DB 저장 가능
    alert('기본 식단 설정이 저장되었습니다.');
  };

  const cookRecipe = (recipe: Recipe) => {
    if (!user) return;
    let deductedCount = 0;
    
    // 냉장고 재료 차감 로직 (DB 업데이트 필요)
    // 복잡성을 줄이기 위해 간단히 구현: 로컬에서 계산 후 각 재료별로 updateIngredient 호출
    fridge.forEach(item => {
        const recipeIng = recipe.ingredients.find(ri => item.name.includes(ri.name) || ri.name.includes(item.name));
        if (recipeIng && item.quantity > 0) {
            deductedCount++;
            updateIngredient(item.id, { quantity: Math.max(0, item.quantity - 1) });
        }
    });
    
    if (deductedCount > 0) {
        alert(`냉장고에서 ${deductedCount}개의 재료를 사용했습니다.`);
    } else {
        alert('사용 가능한 냉장고 재료가 없습니다.');
    }
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

            <button 
                onClick={() => login('google')}
                className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 relative"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                구글 계정으로 시작하기
            </button>
            <p className="text-[10px] text-gray-400 mt-6 text-center">계속 진행하면 서비스 이용약관에 동의하게 됩니다.</p>
        </div>
    </div>
  );
};

// ... 기존 컴포넌트들 (GlobalSearchOverlay, MealAddModal, IngredientModal, MemberEditorModal)은 
// ... 내용이 너무 길어 생략하지만, **기존 코드를 그대로 유지**하시면 됩니다!
// ... (아래 GlobalLayout, AppRoutes, App은 다시 적어드립니다)

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

      {/* 여기에 기존 GlobalSearchOverlay, MealAddModal 등을 꼭 넣어주세요! (위 코드에서 생략된 부분) */}
      
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
  const { user, loading } = useAuth();
  
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
        {/* HomePage 등 기존 페이지 컴포넌트들을 여기에 연결해주세요. 기존 코드 유지 */}
        <Route path="/" element={<div>홈페이지 내용</div>} />
        <Route path="/mealplan" element={<div>식단 페이지</div>} />
        {/* ... 나머지 라우트들 ... */}
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
