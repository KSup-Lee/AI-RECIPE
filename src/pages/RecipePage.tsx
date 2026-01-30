import React, { useState, useEffect } from 'react';
import { Search, Filter, ChefHat, ArrowRight } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase'; // 경로 확인!
import { useNavigate } from 'react-router-dom';

// 카테고리 정의 (귀여운 이모지 사용)
const CATEGORIES = [
  { id: 'ALL', name: '전체', icon: '🍽️' },
  { id: 'SOUP', name: '국/찌개', icon: '🥘' },
  { id: 'MAIN', name: '메인요리', icon: '🍖' },
  { id: 'SIDE', name: '반찬', icon: '🥗' },
  { id: 'DESSERT', name: '간식', icon: '🍪' },
  { id: 'RICE', name: '밥/죽', icon: '🍚' },
];

const RecipePage = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([]);
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchMode, setSearchMode] = useState<'RECIPE' | 'INGREDIENT'>('RECIPE'); // 검색 모드 (레시피명 vs 재료명)

  // 1. 데이터 불러오기 (내 냉장고 & 레시피 DB)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 내 냉장고 재료 가져오기 (가짜 데이터 제거, 실제 DB 연동)
        // 로그인한 유저 ID가 필요하지만, 일단 전체 냉장고 컬렉션에서 테스트 (추후 userQuery로 변경 필요)
        const fridgeSnapshot = await getDocs(collection(db, 'fridge')); 
        const myIngredients = fridgeSnapshot.docs.map(doc => doc.data().name);
        setFridgeItems(myIngredients);

        // 레시피 가져오기
        const recipeSnapshot = await getDocs(collection(db, 'recipes'));
        const loadedRecipes = recipeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecipes(loadedRecipes);
        setFilteredRecipes(loadedRecipes);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      }
    };
    fetchData();
  }, []);

  // 2. 냉장고 매칭률 계산 함수 (NaN 해결!)
  const calculateMatchRate = (recipeIngredients: any[]) => {
    if (!recipeIngredients || recipeIngredients.length === 0) return 0;
    if (fridgeItems.length === 0) return 0;

    // 재료 이름만 추출해서 비교
    const matchCount = recipeIngredients.filter(ing => 
      fridgeItems.some(myIng => myIng.includes(ing.name) || ing.name.includes(myIng))
    ).length;

    return Math.round((matchCount / recipeIngredients.length) * 100);
  };

  // 3. 검색 및 필터링 로직
  useEffect(() => {
    let result = recipes;

    // 카테고리 필터
    if (selectedCategory !== 'ALL') {
      result = result.filter(r => r.type === selectedCategory);
    }

    // 검색어 필터
    if (searchTerm) {
      if (searchMode === 'RECIPE') {
        result = result.filter(r => r.name.includes(searchTerm));
      } else {
        // 재료로 검색
        result = result.filter(r => 
          r.ingredients.some((ing: any) => ing.name.includes(searchTerm))
        );
      }
    }

    // 매칭률 높은 순으로 정렬 (냉파요리 추천)
    result.sort((a, b) => {
      const matchA = calculateMatchRate(a.ingredients);
      const matchB = calculateMatchRate(b.ingredients);
      return matchB - matchA; // 내림차순
    });

    setFilteredRecipes(result);
  }, [searchTerm, selectedCategory, recipes, searchMode, fridgeItems]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-24 px-5 pt-6">
      
      {/* 1. 상단: 로고 & 검색창 */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#FF6B6B] mb-4 tracking-tighter" style={{fontFamily: 'GmarketSansBold, sans-serif'}}>
          MealZip <span className="text-sm font-normal text-gray-400 ml-1">오늘 뭐 먹지?</span>
        </h1>

        <div className="relative">
          <input 
            type="text" 
            placeholder={searchMode === 'RECIPE' ? "김치찌개, 파스타..." : "가진 재료를 입력해보세요"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-[#FFE0B2] rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#FF6B6B] transition-colors shadow-sm"
          />
          <Search className="absolute left-4 top-3.5 text-[#FFB74D] w-5 h-5" />
        </div>

        {/* 검색 모드 전환 탭 */}
        <div className="flex gap-2 mt-3">
            <button 
                onClick={() => setSearchMode('RECIPE')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${searchMode === 'RECIPE' ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100 text-gray-400'}`}
            >
                요리명으로 찾기
            </button>
            <button 
                onClick={() => setSearchMode('INGREDIENT')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${searchMode === 'INGREDIENT' ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100 text-gray-400'}`}
            >
                재료로 찾기
            </button>
        </div>
      </div>

      {/* 2. 카테고리 가로 스크롤 (세그먼트) */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-all ${
              selectedCategory === cat.id 
                ? 'bg-[#FFECB3] scale-105 shadow-md' 
                : 'bg-white border border-gray-100'
            }`}
          >
            <span className="text-2xl mb-1">{cat.icon}</span>
            <span className={`text-[10px] font-bold ${selectedCategory === cat.id ? 'text-[#FF6F00]' : 'text-gray-400'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* 3. 검색 결과 & 추천 리스트 */}
      <div>
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-800">
                {searchTerm ? `'${searchTerm}' 검색결과` : '🍳 추천 레시피'}
                <span className="text-[#FF6B6B] ml-1 text-sm">{filteredRecipes.length}개</span>
            </h2>
        </div>

        <div className="grid gap-4">
          {filteredRecipes.map((recipe) => {
            const matchRate = calculateMatchRate(recipe.ingredients);
            const isNaengPa = matchRate >= 50; // 매칭률 50% 이상이면 냉파요리 뱃지

            return (
              <div 
                key={recipe.id} 
                onClick={() => navigate(`/recipes/${recipe.id}`)} // 클릭 시 상세페이지 이동
                className="bg-white rounded-2xl p-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex gap-4 cursor-pointer hover:bg-orange-50 transition-colors border border-transparent hover:border-[#FFE0B2]"
              >
                {/* 이미지 영역 */}
                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ChefHat />
                    </div>
                  )}
                  {isNaengPa && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#FF6B6B] text-white text-[10px] font-bold text-center py-0.5">
                        냉파추천!
                    </div>
                  )}
                </div>

                {/* 정보 영역 */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-800 text-md line-clamp-1">{recipe.name}</h3>
                    {/* 매칭률 뱃지 */}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        matchRate > 70 ? 'bg-green-100 text-green-600' :
                        matchRate > 30 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                        {matchRate}% 일치
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
                  
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex gap-1 text-[10px] text-gray-400">
                        <span>⏱️ {recipe.cookingTime || '20'}분</span>
                        <span>•</span>
                        <span>🔥 {recipe.difficulty === 'LEVEL1' ? '쉬움' : '보통'}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRecipes.length === 0 && (
            <div className="text-center py-20">
                <p className="text-4xl mb-2">🤔</p>
                <p className="text-gray-400">검색 결과가 없어요.<br/>다른 키워드로 검색해보세요!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RecipePage;
