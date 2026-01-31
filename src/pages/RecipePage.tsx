import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Clock, Star, Heart, X, Sparkles } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 
import { useSearchParams } from 'react-router-dom';
import { useData } from '../App';

const RecipePage = () => {
  const { fridge, favorites, toggleFavorite } = useData();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  
  const [tab, setTab] = useState<'RECOMMEND' | 'MATCH' | 'FAVORITE'>('RECOMMEND');
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  useEffect(() => {
    getDocs(collection(db, 'recipes')).then(snap => {
      setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // 일치율 계산
  const getMatchRate = (recipeIngs: any[]) => {
    if (!recipeIngs || !fridge.length) return 0;
    const count = recipeIngs.filter(rIng => fridge.some(fIng => fIng.name.includes(rIng.name))).length;
    return Math.round((count / recipeIngs.length) * 100);
  };

  // 필터링 및 정렬
  const displayRecipes = useMemo(() => {
    let list = recipes.filter(r => r.name.includes(searchTerm));

    if (tab === 'FAVORITE') {
      list = list.filter(r => favorites.includes(r.id));
    } else if (tab === 'MATCH') {
      list = list.sort((a, b) => getMatchRate(b.ingredients) - getMatchRate(a.ingredients));
    }
    // RECOMMEND는 기본 순서 (또는 랜덤)
    return list;
  }, [recipes, searchTerm, tab, favorites, fridge]);

  // 난이도 별점 변환
  const renderDifficulty = (diff: string) => {
    const score = diff === 'LEVEL1' ? 1 : diff === 'LEVEL2' ? 3 : 5;
    return <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < score ? "currentColor" : "none"} />)}</div>;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 pt-4 pb-24">
      
      {/* 5. 세그먼트 탭 */}
      <div className="flex bg-white p-1 rounded-xl mb-4 shadow-sm">
        {[
          { id: 'RECOMMEND', label: '추천요리' },
          { id: 'MATCH', label: '냉파요리' }, // 냉장고 파먹기
          { id: 'FAVORITE', label: '찜한요리' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === t.id ? 'bg-[#FF6B6B] text-white shadow' : 'text-gray-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 레시피 리스트 (2열) */}
      <div className="grid grid-cols-2 gap-4">
        {displayRecipes.map((recipe) => {
          const matchRate = getMatchRate(recipe.ingredients);
          return (
            <div 
              key={recipe.id} 
              onClick={() => setSelectedRecipe(recipe)} // 1. 상세 보기 클릭
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
            >
              <div className="relative aspect-square bg-gray-100">
                 {recipe.image ? <img src={recipe.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat /></div>}
                 
                 {/* 4. 일치율 배지 */}
                 {matchRate > 0 && (
                   <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                     <Sparkles size={8} className="text-yellow-400"/> {matchRate}% 일치
                   </div>
                 )}

                 <button 
                   onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                   className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-gray-400 hover:text-red-500"
                 >
                   <Heart size={16} fill={favorites.includes(recipe.id) ? "red" : "none"} className={favorites.includes(recipe.id) ? "text-red-500" : ""} />
                 </button>
              </div>
              <div className="p-3">
                {/* 3. 요리 정보 (한식/중식...) */}
                <div className="text-[10px] text-[#FF6B6B] font-bold mb-1">
                  {recipe.category === 'KOREAN' ? '한식' : recipe.category === 'WESTERN' ? '양식' : '기타'}
                </div>
                <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{recipe.name}</h3>
                
                <div className="flex justify-between items-center mt-2">
                  {renderDifficulty(recipe.difficulty)} {/* 2. 별점 */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock size={10}/> {recipe.cookingTime}분
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 레시피 상세 모달 */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white w-full max-w-sm max-h-[80vh] overflow-y-auto rounded-3xl relative animate-slide-up">
              <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white z-10"><X size={20}/></button>
              <div className="h-64 bg-gray-200">
                <img src={selectedRecipe.image} className="w-full h-full object-cover"/>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedRecipe.name}</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{selectedRecipe.description}</p>
                
                <h3 className="font-bold text-gray-800 mb-2">재료</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-1">
                  {selectedRecipe.ingredients?.map((ing: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>{ing.name}</span>
                      <span className="text-gray-400">{ing.amount}</span>
                    </div>
                  ))}
                </div>

                <h3 className="font-bold text-gray-800 mb-2">조리법</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {selectedRecipe.steps?.map((step: string, i: number) => (
                     <div key={i} className="flex gap-3">
                       <span className="font-bold text-[#FF6B6B] shrink-0">{i+1}.</span>
                       <p>{step}</p>
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
