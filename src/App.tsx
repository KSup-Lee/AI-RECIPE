import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Flame, Wand2 } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_POSTS, TODAY_MEAL } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, CartItem, Post, DefaultMealSettings } from './types';
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

import HomePage from './pages/Home';        
import FridgePage from './pages/FridgePage'; 
import RecipePage from './pages/RecipePage'; 
import ShoppingPage from './pages/ShoppingPage';   
import CommunityPage from './pages/CommunityPage'; 
import MealPlanPage from './pages/MealPlanPage';   
import MyPage from './pages/MyPage';         
import Navigation from './components/Navigation';
import Header from './components/Header';

interface UserStats { points: number; coupons: number; reviews: number; shipping: number; }

interface AuthContextType { user: User | null; login: (type: string) => Promise<boolean>; logout: () => void; loading: boolean; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DataContextType {
  recipes: Recipe[]; fridge: Ingredient[]; members: Member[]; mealPlans: DailyMealPlan[]; cart: CartItem[]; posts: Post[]; userStats: UserStats; favorites: string[]; defaultSettings: DefaultMealSettings;
  addToCart: (product: any, qty: number) => void; removeFromCart: (id: string) => void;
  addIngredient: (item: Ingredient) => void; updateIngredient: (id: string, updates: Partial<Ingredient>) => void; deleteIngredient: (id: string) => void;
  addToMealPlan: (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipe: Recipe, specificMembers?: string[]) => void;
  removeFromMealPlan: (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string) => void;
  updateMealMembers: (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string, memberId: string) => void;
  addMember: (member: Member) => void; updateMember: (id: string, updates: Partial<Member>) => void; deleteMember: (id: string) => void; toggleFavorite: (recipeId: string) => void;
  getRecommendedRecipes: (type: 'BREAKFAST' | 'LUNCH' | 'DINNER', date: string) => Recipe[];
  checkRecipeWarnings: (recipe: Recipe, memberIds: string[]) => string[];
  openMealModal: (recipe: Recipe) => void;
  mealModalData: { isOpen: boolean; recipe: Recipe | null };
  closeMealModal: () => void;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error("useAuth error"); return context; };
export const useData = () => { const context = useContext(DataContext); if (!context) throw new Error("useData error"); return context; };

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
  
  // 🌟 [중요] 요일별 설정 초기값 (여기서 에러가 났을 확률 높음)
  const initialSchedule = { breakfast: true, lunch: true, dinner: true };
  const [defaultSettings, setDefaultSettings] = useState<DefaultMealSettings>({ 
      MON: initialSchedule, TUE: initialSchedule, WED: initialSchedule, THU: initialSchedule, FRI: initialSchedule, SAT: initialSchedule, SUN: initialSchedule 
  });
  
  const [mealModalData, setMealModalData] = useState<{ isOpen: boolean; recipe: Recipe | null }>({ isOpen: false, recipe: null });

  useEffect(() => {
    if (!user) { setFridge([]); setMembers([]); setMealPlans([]); return; }
    const unsubs = [
        onSnapshot(collection(db, 'recipes'), (snap) => { if(!snap.empty) setRecipes(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe))); }),
        onSnapshot(collection(db, 'users', user.id, 'fridge'), (snap) => setFridge(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient)))),
        onSnapshot(collection(db, 'users', user.id, 'members'), (snap) => setMembers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member)))),
        onSnapshot(collection(db, 'users', user.id, 'mealPlans'), (snap) => { const m = snap.docs.map(doc => ({ ...doc.data(), date: doc.id } as DailyMealPlan)); setMealPlans(m.length ? m : [TODAY_MEAL]); }),
        onSnapshot(doc(db, 'users', user.id), (snap) => { if(snap.exists()) { const d = snap.data(); setFavorites(d.favorites||[]); } })
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  // CRUD Functions
  const addToCart = (product: any, quantity: number) => setCart(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), product, quantity }]);
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const addIngredient = async (item: Ingredient) => { if (!user) return; const { id, ...data } = item; await addDoc(collection(db, 'users', user.id, 'fridge'), data); };
  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => { if (!user) return; await updateDoc(doc(db, 'users', user.id, 'fridge', id), updates); };
  const deleteIngredient = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'users', user.id, 'fridge', id)); };
  const addMember = async (member: Member) => { if (!user) return; const { id, ...data } = member; await addDoc(collection(db, 'users', user.id, 'members'), data); };
  const updateMember = async (id: string, updates: Partial<Member>) => { if (!user) return; await updateDoc(doc(db, 'users', user.id, 'members', id), updates); };
  const deleteMember = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'users', user.id, 'members', id)); };
  const toggleFavorite = async (recipeId: string) => { if(!user) return; const newFavs = favorites.includes(recipeId) ? favorites.filter(id => id !== recipeId) : [...favorites, recipeId]; setFavorites(newFavs); await updateDoc(doc(db, 'users', user.id), { favorites: newFavs }); };
  const openMealModal = (recipe: Recipe) => setMealModalData({ isOpen: true, recipe });
  const closeMealModal = () => setMealModalData({ isOpen: false, recipe: null });

  const getDayKey = (dateStr: string) => {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      return days[new Date(dateStr).getDay()];
  };

  const addToMealPlan = async (date: string, type: 'BREAKFAST'|'LUNCH'|'DINNER', recipe: Recipe, specificMembers?: string[]) => {
    if (!user) return;
    let targetMembers = specificMembers;
    if (!targetMembers) {
        const dayKey = getDayKey(date);
        targetMembers = members.filter(m => {
            const sched = m.defaultMeals?.[dayKey];
            if (!sched) return true;
            return type === 'BREAKFAST' ? sched.breakfast : type === 'LUNCH' ? sched.lunch : sched.dinner;
        }).map(m => m.id);
    }
    const currentPlan = mealPlans.find(p => p.date === date) || { date, meals: { BREAKFAST: [], LUNCH: [], DINNER: [] } };
    const updatedMeals = { ...currentPlan.meals };
    updatedMeals[type] = [...updatedMeals[type], { recipe, memberIds: targetMembers || [], isCompleted: false }];
    await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: updatedMeals });
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

  const getRecommendedRecipes = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER', date: string): Recipe[] => {
    const dayKey = getDayKey(date);
    const eatingMembers = members.filter(m => {
        const sched = m.defaultMeals?.[dayKey];
        if (!sched) return true;
        return type === 'BREAKFAST' ? sched.breakfast : type === 'LUNCH' ? sched.lunch : sched.dinner;
    });

    let candidates = recipes;
    const hasKid = eatingMembers.some(m => {
        const age = new Date().getFullYear() - new Date(m.birthDate).getFullYear();
        return age < 10;
    });
    if (hasKid) {
        candidates = candidates.filter(r => !r.name.includes('불닭') && !r.tags.includes('매움'));
    }
    eatingMembers.forEach(m => {
        if (m.allergies && m.allergies.length > 0) {
            candidates = candidates.filter(r => !r.ingredients.some(ing => m.allergies.includes(ing.name)));
        }
    });
    return candidates.sort((a, b) => {
        const aWarnings = checkRecipeWarnings(a, eatingMembers.map(m => m.id)).length;
        const bWarnings = checkRecipeWarnings(b, eatingMembers.map(m => m.id)).length;
        return aWarnings - bWarnings;
    });
  };

  const checkRecipeWarnings = (recipe: Recipe, memberIds: string[]): string[] => {
    const warnings: string[] = [];
    const eaters = members.filter(m => memberIds.includes(m.id));
    eaters.forEach(m => {
        m.dislikes?.forEach(dislike => {
            if (recipe.ingredients.some(ing => ing.name.includes(dislike))) {
                warnings.push(`${m.name}님이 싫어하는 '${dislike}' 포함`);
            }
        });
        m.allergies?.forEach(allergy => {
             if (recipe.ingredients.some(ing => ing.name.includes(allergy))) {
                warnings.push(`🚨 ${m.name}님 알러지 유발: ${allergy}`);
            }
        });
    });
    return warnings;
  };

  return (
    <DataContext.Provider value={{ recipes, fridge, members, mealPlans, cart, posts, userStats, favorites, defaultSettings, addToCart, removeFromCart, addIngredient, updateIngredient, deleteIngredient, addToMealPlan, removeFromMealPlan, updateMealMembers, addMember, updateMember, deleteMember, toggleFavorite, getRecommendedRecipes, checkRecipeWarnings, openMealModal, closeMealModal, mealModalData }}>
      {children}
    </DataContext.Provider>
  );
};

// [추가] 레시피 상세 모달 (전역)
import { X, Utensils } from 'lucide-react';
const MealDetailModal = () => {
    const { mealModalData, closeMealModal, favorites, toggleFavorite, fridge } = useData();
    const recipe = mealModalData.recipe;
    if (!mealModalData.isOpen || !recipe) return null;

    const renderDifficulty = (diff: string) => {
        const score = diff === 'LEVEL1' ? 1 : diff === 'LEVEL2' ? 3 : 5;
        return <div className="flex text-[#FF6B6B]">{[...Array(5)].map((_, i) => <Utensils key={i} size={12} className={i < score ? "fill-[#FF6B6B]" : "text-gray-200"} style={{ transform: 'rotate(45deg)' }} />)}</div>;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md h-[85vh] rounded-3xl relative flex flex-col overflow-hidden animate-slide-up">
              <div className="relative h-56 bg-gray-200 shrink-0">
                <img src={recipe.image} className="w-full h-full object-cover"/>
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent">
                   <span className="text-white font-bold text-sm bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">{recipe.category}</span>
                   <button onClick={closeMealModal} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"><X size={20}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{recipe.name}</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{recipe.description}</p>
                <h3 className="font-bold text-gray-800 mb-3 text-lg">재료</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                  {recipe.ingredients?.map((ing: any, i: number) => {
                     const hasItem = fridge.some(f => f.name.includes(ing.name));
                     return (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                             <span className={hasItem ? "text-green-600" : "text-gray-400"}>{hasItem ? "✅" : "⬜"}</span>
                             <span className={hasItem ? "font-bold text-gray-800" : "text-gray-500"}>{ing.name}</span>
                          </div>
                          <span className="text-gray-400">{ing.amount}</span>
                        </div>
                     );
                  })}
                </div>
                <h3 className="font-bold text-gray-800 mb-3 text-lg">조리법</h3>
                <div className="space-y-4 text-sm text-gray-600 pb-10">
                  {recipe.steps?.map((step: string, i: number) => (
                     <div key={i} className="flex gap-4"><span className="bg-[#FF6B6B] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span><p className="leading-relaxed pt-0.5">{step}</p></div>
                  ))}
                </div>
              </div>
           </div>
        </div>
    );
};

const AuthPage = () => {
  const { login } = useAuth();
  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 bg-white">
        <h1 className="text-3xl font-black text-[#FF6B6B] mb-2">MealZip</h1>
        <p className="text-gray-400 mb-10">건강한 식탁의 시작</p>
        <button onClick={() => login('google')} className="w-full bg-gray-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"><span>G</span> 구글 계정으로 시작하기</button>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-white">로딩중...</div>;
  if (!user) return <Routes><Route path="*" element={<AuthPage />} /></Routes>;

  return (
    <div className="bg-white min-h-screen pb-24 relative shadow-lg max-w-md mx-auto">
      <Header />
      <MealDetailModal /> 
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fridge" element={<FridgePage />} />
        <Route path="/recipes" element={<RecipePage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/mealplan" element={<MealPlanPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
      <Navigation />
    </div>
  );
};

const App = () => (
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </HashRouter>
);

export default App;
