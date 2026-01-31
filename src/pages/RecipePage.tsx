import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChefHat, ShoppingCart, Clock, Flame, X, ChevronRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 
import { useNavigate } from 'react-router-dom';

const CUISINE_TYPES = [
  { id: 'ALL', name: '전체' },
  { id: 'KOREAN', name: '🇰🇷 한식' },
  { id: 'WESTERN', name: '🍝 양식' },
  { id: 'CHINESE', name: '🥟 중식' },
  { id: 'JAPANESE', name: '🍣 일식' },
];

const DISH_TYPES = [
  { id: 'ALL', name: '모든 종류' },
  { id: 'SOUP', name: '🍲 국/찌개' },
  { id: 'MAIN', name: '🍖 메인반찬' },
  { id: 'RICE', name: '🍚 밥/죽' },
  { id: 'NOODLE', name: '🍜 면요리' },
  { id: 'DESSERT', name: '🍰 간식' },
];

const RecipePage = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 필터 및 UI 상태
  const [activeSegment, setActiveSegment] = useState<'RECIPE' | 'INGREDIENT'>('RECIPE');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(20);
  
  // 상세 보기 모달 상태
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fridgeSnap = await getDocs(collection(db, 'fridge'));
        const myIngredients = fridgeSnap.docs.map(doc => doc.data().name);
        setFridgeItems(myIngredients);

        const recipeSnap = await getDocs(collection(db, 'recipes'));
        const loadedRecipes = recipeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecipes(loadedRecipes);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      }
    };
    fetchData();
  }, []);

  const getMatchRate = (ingredients: any[]) => {
    if (!ingredients || ingredients.length === 0) return 0;
    if (fridgeItems.length === 0) return 0;
    const matchCount = ingredients.filter(ing => 
      fridgeItems.some(myIng => myIng.includes(ing.name) || ing.name.includes(myIng))
    ).length;
    return Math.round((matchCount / ingredients.length) * 100);
  };

  const filteredData = useMemo(() => {
    let result = recipes;
    if (selectedCuisine !== 'ALL') result = result.filter(r => r.category === selectedCuisine);
    if (selectedType !== 'ALL') result = result.filter(r => r.type === selectedType);

    if (searchTerm) {
      if (activeSegment === 'RECIPE') result = result.filter(r => r.name.includes(searchTerm));
      else if (activeSegment === 'INGREDIENT') result = result.filter(r => r.ingredients.some((ing: any) => ing.name.includes(searchTerm)));
    }
    return result.sort((a, b) => getMatchRate(b.ingredients) - getMatchRate(a.ingredients));
  }, [recipes, searchTerm, activeSegment, selectedCuisine, selectedType, fridgeItems]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] px-5 pt-6 pb-24 relative">
      
      {/* 1. 상단 헤더 (로고 + 검색창 + 장바구니) */}
      <div className="sticky top-0 bg-[#FFFDF9] z-10 pb-2">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-xl font-black text-[#FF6B6B] tracking-tighter shrink-0" style={{ fontFamily: 'sans-serif' }}>MealZip</h1>
          
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={activeSegment === 'INGREDIENT' ? "냉장고 재료 검색" : "요리 이름 검색"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-[#FFE0B2] rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#FF6B6B] shadow-sm transition-all"
            />
            <Search className="absolute left-3 top-2.5 text-[#FFB74D] w-4 h-4" />
          </div>

          <button onClick={() => navigate('/shopping')} className="p-1 text-gray-400 hover:text-[#FF6B6B] transition-colors shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </button>
        </div>

        {/* 탭 & 필터 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button onClick={() => setActiveSegment('RECIPE')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSegment === 'RECIPE' ? 'bg-white text-[#FF6B6B] shadow-sm' : 'text-gray-400'}`}>🍳 레시피</button>
          <button onClick={() => setActiveSegment('INGREDIENT')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSegment === 'INGREDIENT' ? 'bg-white text-[#FF6B6B] shadow-sm' : 'text-gray-400'}`}>🥕 재료로 찾기</button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <select value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)} className="bg-white border border-[#FFE0B2] text-xs font-bold text-gray-600 px-3 py-2 rounded-full outline-none">
            {CUISINE_TYPES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-white border border-[#FFE0B2] text-xs font-bold text-gray-600 px-3 py-2 rounded-full outline-none">
            {DISH_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* 2. 레시피 리스트 */}
      <div className="grid gap-4 mt-2">
        {filteredData.slice(0, visibleCount).map((recipe) => {
          const matchRate = getMatchRate(recipe.ingredients);
          return (
            <div 
              key={recipe.id} 
              onClick={() => setSelectedRecipe(recipe)} // 👈 클릭하면 상세보기 열림!
              className="bg-white rounded-2xl p-3 shadow-sm border border-transparent hover:border-[#FFE0B2] flex gap-4 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 relative">
                {recipe.image ? <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat /></div>}
                {matchRate >= 50 && <div className="absolute bottom-0 w-full bg-[#FF6B6B] text-white text-[10px] font-bold text-center py-0.5">냉파추천!</div>}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-800 line-clamp-1">{recipe.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${matchRate > 70 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{matchRate}% 일치</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.description || '맛있는 레시피입니다.'}</p>
                <div className="mt-auto pt-2 flex gap-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {recipe.cookingTime || 30}분</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3"/> {recipe.difficulty === 'LEVEL1' ? '쉬움' : '보통'}</span>
                </div>
              </div>
            </div>
          );
        })}
        {visibleCount < filteredData.length && (
          <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-3 mt-4 text-sm font-bold text-[#FF6B6B] bg-orange-50 rounded-xl hover:bg-orange-100">더 보기</button>
        )}
      </div>

      {/* 3. 상세 보기 모달 (클릭 시 나타남) */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-slide-up">
            
            {/* 모달 헤더 (이미지) */}
            <div className="relative h-48 bg-gray-200 shrink-0">
              {selectedRecipe.image ? (
                <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-12 h-12 text-gray-400" /></div>
              )}
              <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-lg">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* 모달 내용 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto p-6 pb-20">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-black text-gray-800">{selectedRecipe.name}</h2>
                <span className="bg-orange-100 text-[#FF6B6B] text-xs font-bold px-2 py-1 rounded-lg">
                  {selectedRecipe.category === 'KOREAN' ? '한식' : '기타'}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-6">{selectedRecipe.description}</p>

              {/* 재료 목록 */}
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">🥕 필요 재료</h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                {selectedRecipe.ingredients?.map((ing: any, idx: number) => {
                  const hasItem = fridgeItems.some(my => my.includes(ing.name));
                  return (
                    <div key={idx} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span className={`${hasItem ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                        {hasItem ? '✅' : '•'} {ing.name}
                      </span>
                      <span className="text-gray-400 text-sm">{ing.amount}</span>
                    </div>
                  );
                })}
              </div>

              {/* 조리 순서 */}
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">🔥 조리 방법</h3>
              <div className="space-y-4">
                {selectedRecipe.steps?.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <span className="bg-[#FF6B6B] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                    <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default RecipePage;
