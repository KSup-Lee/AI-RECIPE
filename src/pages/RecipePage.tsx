import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Clock, Heart, X, Sparkles, FolderPlus, Utensils, CalendarPlus } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 
import { useSearchParams } from 'react-router-dom';
import { useData } from '../App';

const CUISINE_FILTERS = [
  { id: 'ALL', label: '전체' }, { id: 'KOREAN', label: '한식' }, { id: 'WESTERN', label: '양식' },
  { id: 'CHINESE', label: '중식' }, { id: 'JAPANESE', label: '일식' }, { id: 'ETC', label: '기타' },
];

const RecipePage = () => {
  const { fridge, favorites, toggleFavorite, addToMealPlan } = useData();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  
  const [activeTab, setActiveTab] = useState('RECOMMEND'); 
  const [cuisineFilter, setCuisineFilter] = useState('ALL');
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTargetRecipe, setPlanTargetRecipe] = useState<any>(null);
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [planType, setPlanType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('DINNER');

  useEffect(() => {
    getDocs(collection(db, 'recipes')).then(snap => setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) setShowHeader(false); else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleAddToPlan = () => {
    if (planTargetRecipe) { addToMealPlan(planDate, planType, planTargetRecipe); setIsPlanModalOpen(false); setPlanTargetRecipe(null); }
  };

  const getIngredientStatus = (recipeIngs: any[]) => {
    if (!recipeIngs) return { matchRate: 0, analysis: [] };
    let matchCount = 0;
    const analysis = recipeIngs.map(rIng => {
      const myItem = fridge.find(f => f.name.includes(rIng.name) || rIng.name.includes(f.name));
      if (myItem) matchCount++;
      return { name: rIng.name, need: rIng.amount, have: myItem ? `${myItem.quantity}${myItem.unit}` : '없음', isHave: !!myItem };
    });
    return { matchRate: Math.round((matchCount / recipeIngs.length) * 100), analysis };
  };

  const displayRecipes = useMemo(() => {
    let list = recipes.filter(r => r.name.includes(searchTerm));
    if (cuisineFilter !== 'ALL') list = list.filter(r => r.category === cuisineFilter);
    if (activeTab === 'FAVORITE') list = list.filter(r => favorites.includes(r.id));
    else if (activeTab === 'NAENGPA') list = list.map(r => ({ ...r, matchRate: getIngredientStatus(r.ingredients).matchRate })).filter(r => r.matchRate > 0).sort((a, b) => b.matchRate - a.matchRate);
    return list;
  }, [recipes, searchTerm, activeTab, cuisineFilter, favorites, fridge]);

  const renderDifficulty = (diff: string) => {
    const score = diff === 'LEVEL1' ? 1 : diff === 'LEVEL2' ? 3 : 5;
    return <div className="flex text-[#FF6B6B]">{[...Array(5)].map((_, i) => <Utensils key={i} size={12} className={i < score ? "fill-[#FF6B6B]" : "text-gray-200"} style={{ transform: 'rotate(45deg)' }} />)}</div>;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 pb-24">
      <div className={`sticky top-0 z-30 bg-[#f8f9fa] pt-2 pb-2 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex bg-white p-1 rounded-xl mb-3 shadow-sm overflow-x-auto no-scrollbar">
          {[{ id: 'RECOMMEND', label: '추천요리' }, { id: 'NAENGPA', label: '냉파요리' }, { id: 'FAVORITE', label: '찜한요리' }, { id: 'CUSTOM', label: '나만의폴더' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 min-w-[70px] py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === t.id ? 'bg-[#FF6B6B] text-white shadow' : 'text-gray-400'}`}>{t.label}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CUISINE_FILTERS.map(f => (
            <button key={f.id} onClick={() => setCuisineFilter(f.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${cuisineFilter === f.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {activeTab === 'CUSTOM' && (
        <div className="mb-4 mt-2 flex items-center justify-between bg-orange-50 p-3 rounded-xl border border-orange-100">
          <div className="flex items-center gap-2 text-sm font-bold text-[#FF6B6B]"><FolderPlus size={18} /><span>내 스크랩북</span></div>
          <button className="text-xs bg-white border border-orange-200 px-2 py-1 rounded text-orange-600">+ 폴더 추가</button>
        </div>
      )}

      {/* 레시피 리스트 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
        {displayRecipes.map((recipe) => {
          const { matchRate } = getIngredientStatus(recipe.ingredients);
          return (
            <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
              {/* 🌟 PC/모바일 이미지 비율 조정 (핵심) */}
              <div className="relative w-full h-40 sm:h-48 md:h-56 bg-gray-100">
                 {recipe.image ? <img src={recipe.image} className="w-full h-full object-cover" alt={recipe.name}/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat /></div>}
                 
                 {matchRate > 0 && <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles size={8} className="text-yellow-400"/> {matchRate}%</div>}
                 <button onClick={(e) => { e.stopPropagation(); setPlanTargetRecipe(recipe); setIsPlanModalOpen(true); }} className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full text-[#FF6B6B] shadow-md hover:bg-white transition-colors"><CalendarPlus size={16} /></button>
              </div>
              <div className="p-3">
                <div className="text-[10px] text-[#FF6B6B] font-bold mb-1">{recipe.category}</div>
                <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{recipe.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  {renderDifficulty(recipe.difficulty)}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={10}/> {recipe.cookingTime}분</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRecipe && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md h-[85vh] rounded-3xl relative flex flex-col overflow-hidden animate-slide-up">
              <div className="relative h-56 bg-gray-200 shrink-0">
                <img src={selectedRecipe.image} className="w-full h-full object-cover"/>
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent">
                   <span className="text-white font-bold text-sm bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">{selectedRecipe.category}</span>
                   <button onClick={() => setSelectedRecipe(null)} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"><X size={20}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedRecipe.name}</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{selectedRecipe.description}</p>
                <h3 className="font-bold text-gray-800 mb-3 text-lg">재료 준비</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                  {getIngredientStatus(selectedRecipe.ingredients).analysis.map((ing: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                         <span className={ing.isHave ? "text-green-600" : "text-gray-400"}>{ing.isHave ? "✅" : "⬜"}</span>
                         <span className={ing.isHave ? "font-bold text-gray-800" : "text-gray-500"}>{ing.name}</span>
                      </div>
                      <div className="text-xs text-right text-gray-400">{ing.need} / <span className={ing.isHave ? "text-[#FF6B6B]" : ""}>{ing.have}</span></div>
                    </div>
                  ))}
                </div>
                <h3 className="font-bold text-gray-800 mb-3 text-lg">조리 순서</h3>
                <div className="space-y-4 text-sm text-gray-600 pb-10">
                  {selectedRecipe.steps?.map((step: string, i: number) => (
                     <div key={i} className="flex gap-4"><span className="bg-[#FF6B6B] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span><p className="leading-relaxed pt-0.5">{step}</p></div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t bg-white shrink-0 flex gap-2">
                 <button onClick={() => { setPlanTargetRecipe(selectedRecipe); setIsPlanModalOpen(true); }} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm">식단추가</button>
                 <button onClick={() => toggleFavorite(selectedRecipe.id)} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${favorites.includes(selectedRecipe.id) ? 'bg-[#FF6B6B] text-white' : 'bg-gray-800 text-white'}`}>
                   <Heart size={16} fill={favorites.includes(selectedRecipe.id) ? "currentColor" : "none"}/> {favorites.includes(selectedRecipe.id) ? '찜 취소' : '찜하기'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {isPlanModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5 animate-slide-up">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📅 식단에 추가하기</h3>
            <p className="text-center text-gray-600 mb-4 text-sm font-bold">{planTargetRecipe?.name}</p>
            <div className="space-y-3 mb-6">
              <div><label className="text-xs text-gray-400 block mb-1">날짜</label><input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full border p-2 rounded-lg bg-gray-50"/></div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">시간</label>
                <div className="flex gap-2">
                  {['BREAKFAST', 'LUNCH', 'DINNER'].map(t => (
                    <button key={t} onClick={() => setPlanType(t as any)} className={`flex-1 py-2 text-xs rounded-lg font-bold ${planType === t ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100 text-gray-500'}`}>{t === 'BREAKFAST' ? '아침' : t === 'LUNCH' ? '점심' : '저녁'}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsPlanModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-500">취소</button>
              <button onClick={handleAddToPlan} className="flex-1 bg-[#FF6B6B] text-white py-3 rounded-xl font-bold">추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipePage;
