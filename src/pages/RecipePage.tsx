import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChefHat } from 'lucide-react'; // ShoppingCart 삭제 (글로벌 헤더에 있음)
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
  const [activeSegment, setActiveSegment] = useState<'RECIPE' | 'INGREDIENT'>('RECIPE');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 냉장고 재료 가져오기
        const fridgeSnap = await getDocs(collection(db, 'fridge'));
        const myIngredients = fridgeSnap.docs.map(doc => doc.data().name);
        setFridgeItems(myIngredients);

        // 레시피 가져오기
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
    <div className="min-h-screen bg-[#FFFDF9] px-5 pb-24">
      
      {/* 🚨 [수정됨] 상단 로고와 장바구니 버튼은 App.tsx(전역 헤더)에 있으므로 여기서 삭제했습니다.
        대신 실제 검색을 수행하는 입력창과 필터들은 유지합니다.
      */}

      <div className="sticky top-0 bg-[#FFFDF9] z-40 pt-2">
        {/* 1. 검색창 (실제 기능 작동) */}
        <div className="relative mb-3 pt-2">
          <input 
            type="text" 
            placeholder={activeSegment === 'INGREDIENT' ? "재료 이름으로 검색 (예: 계란)" : "요리 이름 검색 (예: 김치찌개)"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-[#FFE0B2] rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#FF6B6B] shadow-sm transition-all"
          />
          <Search className="absolute left-4 top-5 text-[#FFB74D] w-5 h-5" />
        </div>

        {/* 2. 탭 (레시피 vs 재료) */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button onClick={() => setActiveSegment('RECIPE')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSegment === 'RECIPE' ? 'bg-white text-[#FF6B6B] shadow-sm' : 'text-gray-400'}`}>🍳 레시피</button>
          <button onClick={() => setActiveSegment('INGREDIENT')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSegment === 'INGREDIENT' ? 'bg-white text-[#FF6B6B] shadow-sm' : 'text-gray-400'}`}>🥕 재료로 찾기</button>
        </div>

        {/* 3. 상세 필터 (한식/양식...) */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <select value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)} className="bg-white border border-[#FFE0B2] text-xs font-bold text-gray-600 px-3 py-2 rounded-full outline-none">
            {CUISINE_TYPES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-white border border-[#FFE0B2] text-xs font-bold text-gray-600 px-3 py-2 rounded-full outline-none">
            {DISH_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* 4. 레시피 리스트 */}
      <div className="grid gap-4 mt-2">
        {filteredData.slice(0, visibleCount).map((recipe) => {
          const matchRate = getMatchRate(recipe.ingredients);
          return (
            <div key={recipe.id} className="bg-white rounded-2xl p-3 shadow-sm border border-transparent hover:border-[#FFE0B2] flex gap-4 transition-all">
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
                  <span>⏱️ {recipe.cookingTime || 30}분</span>
                  <span>🔥 {recipe.difficulty === 'LEVEL1' ? '쉬움' : '보통'}</span>
                </div>
              </div>
            </div>
          );
        })}
        {visibleCount < filteredData.length && (
          <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-3 mt-4 text-sm font-bold text-[#FF6B6B] bg-orange-50 rounded-xl hover:bg-orange-100">더 보기 ({filteredData.length - visibleCount}개 남음)</button>
        )}
      </div>
    </div>
  );
};

export default RecipePage;
