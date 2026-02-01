// ... (기존 import 및 Context 정의 유지)
// getRecommendedRecipes와 새로운 autoPlanDay 함수가 핵심입니다.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { DUMMY_RECIPES, DUMMY_POSTS, TODAY_MEAL } from './constants';
import { User, UserRole, Recipe, Ingredient, Member, DailyMealPlan, CartItem, Post, DefaultMealSettings } from './types';
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

// ... (Page imports)
import HomePage from './pages/Home';        
import FridgePage from './pages/FridgePage'; 
import RecipePage from './pages/RecipePage'; 
import ShoppingPage from './pages/ShoppingPage';   
import CommunityPage from './pages/CommunityPage'; 
import MealPlanPage from './pages/MealPlanPage';   
import MyPage from './pages/MyPage';         
import Navigation from './components/Navigation';
import Header from './components/Header';
import { X, Utensils, Heart } from 'lucide-react';

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
  autoPlanDay: (date: string) => void; // 9. 요일 전체 추천 기능 추가
  resetDay: (date: string) => void; // 10. 초기화 기능 추가
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error("useAuth error"); return context; };
export const useData = () => { const context = useContext(DataContext); if (!context) throw new Error("useData error"); return context; };

// ... (AuthProvider, DataProvider setup 기존 유지)
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
  const initialSchedule = { breakfast: true, lunch: true, dinner: true };
  const [defaultSettings, setDefaultSettings] = useState<DefaultMealSettings>({ MON: initialSchedule, TUE: initialSchedule, WED: initialSchedule, THU: initialSchedule, FRI: initialSchedule, SAT: initialSchedule, SUN: initialSchedule });
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

  // CRUD Functions (기존 유지)
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

  const getDayKey = (dateStr: string) => { const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; return days[new Date(dateStr).getDay()]; };

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

  // 10. 식단 초기화
  const resetDay = async (date: string) => {
      if (!user) return;
      await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: { BREAKFAST: [], LUNCH: [], DINNER: [] } });
  };

  // 8 & 9. 스마트 추천 로직 (냉장고 매칭률 + 구성원 필터)
  const getRecommendedRecipes = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER', date: string): Recipe[] => {
    const dayKey = getDayKey(date);
    // 4. 구성원 정보(스케줄) 확인
    const eatingMembers = members.filter(m => {
        const sched = m.defaultMeals?.[dayKey];
        if (!sched) return true;
        return type === 'BREAKFAST' ? sched.breakfast : type === 'LUNCH' ? sched.lunch : sched.dinner;
    });

    let candidates = recipes;

    // (1) 어린이 매운 것 제외
    const hasKid = eatingMembers.some(m => {
        if(!m.birthDate) return false;
        const age = new Date().getFullYear() - new Date(m.birthDate).getFullYear();
        return age < 10;
    });
    if (hasKid) {
        candidates = candidates.filter(r => !r.name.includes('불닭') && !r.tags?.includes('매움'));
    }

    // (2) 알러지 제외
    eatingMembers.forEach(m => {
        if (m.allergies && m.allergies.length > 0) {
            candidates = candidates.filter(r => !r.ingredients.some(ing => m.allergies.includes(ing.name)));
        }
    });

    // 8. 냉장고 매칭률 계산 (가산점 부여)
    const scoredCandidates = candidates.map(recipe => {
        let matchScore = 0;
        let matchCount = 0;
        recipe.ingredients.forEach(ing => {
            const hasItem = fridge.some(f => f.name.includes(ing.name) && f.quantity > 0);
            if (hasItem) {
                matchScore += 20; // 재료 하나당 20점
                matchCount++;
            }
        });
        
        // 70% 이상 일치하면 대폭 가산점
        const matchRate = matchCount / recipe.ingredients.length;
        if (matchRate >= 0.7) matchScore += 100;

        // 경고(기피재료) 있으면 감점
        const warnings = checkRecipeWarnings(recipe, eatingMembers.map(m => m.id));
        matchScore -= (warnings.length * 50);

        // 랜덤성 (0~10점)
        matchScore += Math.random() * 10;

        return { ...recipe, score: matchScore, matchRate };
    });

    // 점수 높은 순 정렬
    return scoredCandidates.sort((a, b) => b.score - a.score);
  };

  // 7 & 9. 요일 전체 자동 추천 (아침/점심/저녁 한 번에)
  const autoPlanDay = async (date: string) => {
      const types = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
      const newMeals: any = { BREAKFAST: [], LUNCH: [], DINNER: [] };
      
      types.forEach(type => {
          const recs = getRecommendedRecipes(type, date);
          if (recs.length > 0) {
              // 상위 3개 중 랜덤 하나 (다양성)
              const top3 = recs.slice(0, 3);
              const selected = top3[Math.floor(Math.random() * top3.length)];
              
              const dayKey = getDayKey(date);
              const targetMembers = members.filter(m => {
                  const sched = m.defaultMeals?.[dayKey];
                  return !sched || (type === 'BREAKFAST' ? sched.breakfast : type === 'LUNCH' ? sched.lunch : sched.dinner);
              }).map(m => m.id);

              newMeals[type].push({ recipe: selected, memberIds: targetMembers, isCompleted: false });
          }
      });
      if (!user) return;
      await setDoc(doc(db, 'users', user.id, 'mealPlans', date), { meals: newMeals });
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
    <DataContext.Provider value={{ recipes, fridge, members, mealPlans, cart, posts, userStats, favorites, defaultSettings, addToCart, removeFromCart, addIngredient, updateIngredient, deleteIngredient, addToMealPlan, removeFromMealPlan, updateMealMembers, addMember, updateMember, deleteMember, toggleFavorite, getRecommendedRecipes, checkRecipeWarnings, openMealModal, closeMealModal, mealModalData, autoPlanDay, resetDay }}>
      {children}
    </DataContext.Provider>
  );
};

// ... (MealDetailModal, AuthPage, AppRoutes, App 기존 코드 유지 - 생략)
// (기존 App.tsx 하단의 Modal, Auth, Route 등은 그대로 두시면 됩니다. DataContext.Provider 내부 로직만 바뀌었습니다.)
// 편의를 위해 전체 코드가 필요하면 말씀해주세요. 위 DataContext 부분만 갈아끼우셔도 됩니다.
// 하지만 사용자님의 편의를 위해 전체 코드를 아래에 붙여드립니다.

const MealDetailModal = () => {
    const { mealModalData, closeMealModal, favorites, toggleFavorite, fridge } = useData();
    const recipe = mealModalData.recipe;
    if (!mealModalData.isOpen || !recipe) return null;

    const renderDifficulty = (diff: string) => {
        // 2. 난이도 실제 반영 (LEVEL1 -> 1개, LEVEL3 -> 3개)
        const score = diff === 'LEVEL1' ? 1 : diff === 'LEVEL2' ? 2 : 3;
        return <div className="flex text-[#FF6B6B] gap-0.5">{[...Array(3)].map((_, i) => <Utensils key={i} size={14} className={i < score ? "fill-[#FF6B6B]" : "text-gray-200"} />)} <span className="text-xs text-gray-500 ml-1">{score === 1 ? '쉬움' : score === 2 ? '보통' : '어려움'}</span></div>;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md h-[85vh] rounded-3xl relative flex flex-col overflow-hidden animate-slide-up">
              <div className="relative w-full aspect-video bg-gray-100 shrink-0">
                <img src={recipe.image} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; }} className="absolute inset-0 w-full h-full object-cover"/>
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent">
                   <span className="text-white font-bold text-sm bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">{recipe.category}</span>
                   <button onClick={closeMealModal} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"><X size={20}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <h2 className="text-2xl font-black text-gray-900 mb-1">{recipe.name}</h2>
                <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                    {renderDifficulty(recipe.difficulty)}
                    <span>🔥 {recipe.nutrition?.calories || 500}kcal</span>
                </div>
                
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
              <div className="p-4 border-t bg-white shrink-0 flex gap-2">
                 <button onClick={() => toggleFavorite(recipe.id)} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${favorites.includes(recipe.id) ? 'bg-[#FF6B6B] text-white' : 'bg-gray-800 text-white'}`}>
                   <Heart size={16} fill={favorites.includes(recipe.id) ? "currentColor" : "none"}/> {favorites.includes(recipe.id) ? '찜 취소' : '찜하기'}
                 </button>
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
