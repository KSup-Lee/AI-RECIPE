import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Clock, Flame, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 
import { useSearchParams } from 'react-router-dom'; // URL 검색어 받기

const CUISINE_TYPES = [
  { id: 'ALL', name: '전체' },
  { id: 'KOREAN', name: '🇰🇷 한식' },
  { id: 'WESTERN', name: '🍝 양식' },
  { id: 'CHINESE', name: '🥟 중식' },
  { id: 'JAPANESE', name: '🍣 일식' },
];

const RecipePage = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  const [searchParams] = useSearchParams(); 
  
  // ✨ 전역 헤더에서 ?q=검색어 로 보낸 값을 여기서 받습니다
  const searchTerm = searchParams.get('q') || ''; 
  
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fridgeSnap = await getDocs(collection(db, 'fridge'));
        setFridgeItems(fridgeSnap.docs.map(doc => doc.data().name));

        const recipeSnap = await getDocs(collection(db, 'recipes'));
        setRecipes(recipeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error:", error);
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
    // 카테고리 필터
    if (selectedCuisine !== 'ALL') result = result.filter(r => r.category === selectedCuisine);
    
    // ✨ 검색어 필터 (요리 이름 또는 재료에 검색어가 포함되면 보여줌)
    if (searchTerm) {
      result = result.filter(r => 
        r.name.includes(searchTerm) || 
        r.ingredients.some((ing: any) => ing.name.includes(searchTerm))
      );
    }
    return result.sort((a, b) => getMatchRate(b.ingredients) - getMatchRate(a.ingredients));
  }, [recipes, searchTerm, selectedCuisine, fridgeItems]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] px-5 pt-2 pb-24">
      
      {/* 필터 (한식, 양식...) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {CUISINE_TYPES.map(c => (
          <button 
            key={c.id} 
            onClick={() => setSelectedCuisine(c.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCuisine === c.id ? 'bg-[#FF6B6B] text-white shadow-md' : 'bg-white border border-[#FFE0B2] text-gray-500'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 검색 결과 텍스트 */}
      {searchTerm && (
        <p className="text-sm font-bold text-gray-600 mb-3">
          '<span className="text-[#FF6B6B]">{searchTerm}</span>' 검색 결과 ({filteredData.length})
        </p>
      )}

      {/* 레시피 리스트 */}
      <div className="grid gap-4">
        {filteredData.slice(0, visibleCount).map((recipe) => {
          const matchRate = getMatchRate(recipe.ingredients);
          return (
            <div 
              key={recipe.id} 
              onClick={() => setSelectedRecipe(recipe)}
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
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.description || '맛있는 레시피'}</p>
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

      {/* 상세 보기 모달 */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col relative animate-slide-up">
            <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 right-4 z-10 bg-black/20 p-2 rounded-full text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="h-56 bg-gray-200 shrink-0">
              {selectedRecipe.image ? <img src={selectedRecipe.image} className="w-full h-full object-cover" /> : null}
            </div>
            <div className="flex-1 overflow-y-auto p-6 pb-20">
              <h2 className="text-2xl font-black text-gray-800 mb-2">{selectedRecipe.name}</h2>
              <p className="text-gray-500 text-sm mb-6">{selectedRecipe.description}</p>
              
              <h3 className="font-bold text-gray-800 mb-3">🥕 재료</h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                {selectedRecipe.ingredients?.map((ing: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-600">
                    <span>• {ing.name}</span><span>{ing.amount}</span>
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-gray-800 mb-3">🔥 조리 순서</h3>
              <div className="space-y-4 text-sm text-gray-600">
                {selectedRecipe.steps?.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-3"><span className="font-bold text-[#FF6B6B]">{idx + 1}.</span>{step}</div>
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
