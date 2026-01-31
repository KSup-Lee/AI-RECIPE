import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { X } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_POSTS, TODAY_MEAL, INGREDIENT_UNITS } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, CartItem, Post, DefaultMealSettings } from './types';

// [Firebase Imports]
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

// 👇 페이지들 불러오기 (파일 경로 확인 필요!)
import HomePage from './pages/Home';        
import FridgePage from './pages/FridgePage'; 
import RecipePage from './pages/RecipePage'; 
import ShoppingPage from './pages/ShoppingPage';   
import CommunityPage from './pages/CommunityPage'; 
import MealPlanPage from './pages/MealPlanPage';   
import MyPage from './pages/MyPage';         

// 👇 공통 컴포넌트
import Navigation from './components/Navigation';
import Header from './components/Header';

// [사용자 통계 데이터 타입]
interface UserStats {
  points: number; coupons: number; reviews: number; shipping: number;
}

// --- Context Definitions ---
interface AuthContextType {
  user: User | null; login: (type: string) => Promise<boolean>; logout: () => void; loading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DataContextType {
  recipes: Recipe[]; fridge: Ingredient[]; members: Member[]; mealPlans: DailyMealPlan[]; cart: CartItem[]; posts: Post[]; userStats: UserStats; favorites: string[]; defaultSettings: DefaultMealSettings;
  addToCart: (product: any, qty: number) => void; removeFromCart: (id: string) => void;
  addIngredient: (item: Ingredient) => void; updateIngredient: (id: string, updates: Partial<Ingredient>) => void; deleteIngredient: (id: string) => void;
  addToMealPlan: (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipe: Recipe, specificMembers?: string[]) => void;
  removeFromMealPlan: (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string) => void;
  openMealModal: (recipe: Recipe) => void; updateMealMembers: (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string, memberId: string) => void;
  saveDefaultSettings: (settings: DefaultMealSettings) => void; mealModalData: { isOpen: boolean; recipe: Recipe | null }; closeMealModal: () => void;
  cookRecipe: (recipe: Recipe) => void; addMember: (member: Member) => void; updateMember: (id: string, updates: Partial<Member>) => void; deleteMember: (id: string) => void; toggleFavorite: (recipeId: string) => void;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Custom Hooks ---
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error("useAuth error"); return context; };
export const useData = () => { const context = useContext(DataContext); if (!context) throw new Error("useData error"); return context; };

// --- Providers ---
const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser({ id: firebaseUser.uid, username: firebaseUser.email || 'user', name: firebaseUser.displayName || '사용자', role: UserRole.USER, avatar: firebaseUser.photoURL || 'https://ui-avatars.com/api/?name=User' });
      else setUser(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const login = async (type: string) => { try { await signInWithPopup(auth, googleProvider); return true; } catch { return false; } };
  const logout = async () => { await signOut(auth); setUser(null); };
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};

const DataProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>(DUMMY_RECIPES);
  const [fridge, setFridge] = useState<Ingredient[]>([]); 
  const [members, setMembers] = useState<Member[]>([]);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posts] = useState<Post[]>(DUMMY_POSTS);
  const [userStats, setUserStats] = useState<UserStats>({ points: 0, coupons: 0, reviews: 0, shipping: 0 });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [defaultSettings, setDefaultSettings] = useState<DefaultMealSettings>({ weekday: { BREAKFAST: [], LUNCH: [], DINNER: [] }, weekend: { BREAKFAST: [], LUNCH: [], DINNER: [] } });
  const [mealModalData, setMealModalData] = useState<{ isOpen: boolean; recipe: Recipe | null }>({ isOpen: false, recipe: null });

  useEffect(() => {
    if (!user) { setFridge([]); setMembers([]); setMealPlans([]); setFavorites([]); setUserStats({ points: 0, coupons: 0, reviews: 0, shipping: 0 }); return; }
    const unsubs = [
        onSnapshot(collection(db, 'recipes'), (snap) => { if(!snap.empty) setRecipes(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe))); }),
        onSnapshot(collection(db, 'users', user.id, 'fridge'), (snap) => setFridge(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient)))),
        onSnapshot(collection(db, 'users', user.id, 'members'), (snap) => setMembers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member)))),
        onSnapshot(collection(db, 'users', user.id, 'mealPlans'), (snap) => { const m = snap.docs.map(doc => ({ ...doc.data(), date: doc.id } as DailyMealPlan)); setMealPlans(m.length ? m : [TODAY_MEAL]); }),
        onSnapshot(doc(db, 'users', user.id), (snap) => { if(snap.exists()) { const d = snap.data(); setUserStats({ points: d.points||0, coupons: d.coupons||0, reviews: d.reviews||0, shipping: d.shipping||0 }); setFavorites(d.favorites||[]); if(d.defaultSettings) setDefaultSettings(d.defaultSettings); } })
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  // 데이터 조작 함수들
  const addToCart = (product: any, quantity: number) => setCart(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), product, quantity }]);
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const addIngredient = async (item: Ingredient) => { if (!user) return; const { id, ...data } = item; await addDoc(collection(db, 'users', user.id, 'fridge'), data); };
  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => { if (!user) return; await updateDoc(doc(db, 'users', user.id, 'fridge', id), updates); };
  const deleteIngredient = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'users', user.id, 'fridge', id)); };
  const addMember = async (member: Member) => { if (!user) return; const { id, ...data } = member; await addDoc(collection(db, 'users', user.id, 'members'), data); };
  const updateMember = async (id: string, updates: Partial<Member>) => { if (!user) return; await updateDoc(doc(db, 'users', user.id, 'members', id), updates); };
  const deleteMember = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'users', user.id, 'members', id)); };
  
  const addToMealPlan = async (date: string, type: 'BREAKFAST'|'LUNCH'|'DINNER', recipe: Recipe, specificMembers?: string[]) => {
    if (!user) return;
    const currentPlan = mealPlans.find(p => p.date === date) || { date, meals: { BREAKFAST: [], LUNCH: [], DINNER: [] } };
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[type] = [...updatedMeals[type], { recipe, memberIds: specificMembers || members.map(m => m.id), isCompleted: false }];
    await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: updatedMeals });
    closeMealModal();
  };
  const removeFromMealPlan = async (date: string, type: 'BREAKFAST'|'LUNCH'|'DINNER', recipeId: string) => {
    if (!user) return;
    const currentPlan = mealPlans.find(p => p.date === date); if (!currentPlan) return;
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[type] = updatedMeals[type].filter(item => item.recipe.id !== recipeId);
    await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: updatedMeals });
  };
  const updateMealMembers = async (date: string, mealType: 'BREAKFAST'|'LUNCH'|'DINNER', recipeId: string, memberId: string) => {
    if (!user) return;
    const currentPlan = mealPlans.find(p => p.date === date); if (!currentPlan) return;
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[mealType] = updatedMeals[mealType].map(item => item.recipe.id === recipeId ? { ...item, memberIds: item.memberIds.includes(memberId) ? item.memberIds.filter(id => id !== memberId) : [...item.memberIds, memberId] } : item);
    await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: updatedMeals });
  };
  const toggleFavorite = async (recipeId: string) => { if(!user) return; const newFavs = favorites.includes(recipeId) ? favorites.filter(id => id !== recipeId) : [...favorites, recipeId]; setFavorites(newFavs); await updateDoc(doc(db, 'users', user.id), { favorites: newFavs }); };
  const saveDefaultSettings = async (settings: DefaultMealSettings) => { if(!user) return; setDefaultSettings(settings); await updateDoc(doc(db, 'users', user.id), { defaultSettings: settings }); };
  const openMealModal = (recipe: Recipe) => setMealModalData({ isOpen: true, recipe });
  const closeMealModal = () => setMealModalData({ isOpen: false, recipe: null });
  const cookRecipe = (recipe: Recipe) => { if (!user) return; alert('요리가 완료되었습니다!'); };

  return (
    <DataContext.Provider value={{ recipes, fridge, members, mealPlans, cart, posts, userStats, favorites, defaultSettings, addToCart, removeFromCart, addIngredient, updateIngredient, deleteIngredient, addToMealPlan, removeFromMealPlan, openMealModal, closeMealModal, mealModalData, updateMealMembers, saveDefaultSettings, cookRecipe, addMember, updateMember, deleteMember, toggleFavorite }}>
      {children}
    </DataContext.Provider>
  );
};

// [필수 모달] 식단 추가 팝업
const MealAddModal = () => {
    const { mealModalData, closeMealModal, addToMealPlan } = useData();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('DINNER');
    if (!mealModalData.isOpen || !mealModalData.recipe) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-5">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6">
                <div className="flex justify-between mb-4"><h3>식단 추가</h3><button onClick={closeMealModal}><X/></button></div>
                <div className="font-bold text-lg mb-4">{mealModalData.recipe.name}</div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border p-2 rounded mb-4" />
                <div className="flex gap-2 mb-4">{['BREAKFAST', 'LUNCH', 'DINNER'].map((t) => (<button key={t} onClick={() => setType(t as any)} className={`flex-1 py-2 rounded ${type === t ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>{t === 'BREAKFAST'?'아침':t==='LUNCH'?'점심':'저녁'}</button>))}</div>
                <button onClick={() => addToMealPlan(date, type, mealModalData.recipe!)} className="w-full bg-green-600 text-white py-3 rounded-xl">추가하기</button>
            </div>
        </div>
    );
};

// [로그인 페이지]
const AuthPage = () => {
  const { login } = useAuth();
  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 bg-white">
        <h1 className="text-3xl font-black text-green-700 mb-2">MealZip</h1>
        <p className="text-gray-400 mb-10">건강한 식탁의 시작</p>
        <button onClick={() => login('google')} className="w-full bg-gray-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
            <span>G</span> 구글 계정으로 시작하기
        </button>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-white">로딩중...</div>;
  if (!user) return <Routes><Route path="*" element={<AuthPage />} /></Routes>;

  return (
    <div className="bg-white min-h-screen pb-24 relative shadow-lg max-w-md mx-auto">
      {/* 1. 전역 헤더 (상단 탭 포함) */}
      <Header />
      
      {/* 2. 필수 모달 */}
      <MealAddModal />
      
      {/* 3. 라우팅 */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fridge" element={<FridgePage />} />
        <Route path="/recipes" element={<RecipePage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/mealplan" element={<MealPlanPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>

      {/* 4. 하단 네비게이션 */}
      <Navigation />
    </div>
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
