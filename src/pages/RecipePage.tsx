import React, { useState, useEffect } from 'react';
import { Clock, Heart, Sparkles, ChefHat } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 
import { useSearchParams } from 'react-router-dom';

const RecipePage = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';

  useEffect(() => {
    getDocs(collection(db, 'recipes')).then(snap => {
      setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const filteredRecipes = recipes.filter(r => r.name.includes(searchTerm));
  
  // 9. AI 추천 기능 (Mock)
  const recommendedRecipe = recipes[0]; 

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 pt-6 pb-24">
      
      {/* 9. AI 맞춤 추천 섹션 */}
      {!searchTerm && recommendedRecipe && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-[#FF6B00]" size={20} />
            <h2 className="text-lg font-bold text-gray-800">지금 딱 맞는 AI 추천</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-md flex gap-4 border border-[#FFE0B2]">
             <img src={recommendedRecipe.image} className="w-24 h-24 rounded-xl object-cover" alt="추천" />
             <div className="flex-1 py-1">
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">🌧️ 비오는 날</span>
                  <span className="text-[10px] bg-orange-50 text-[#FF6B00] px-2 py-0.5 rounded-md">15분 컷</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{recommendedRecipe.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{recommendedRecipe.description}</p>
             </div>
          </div>
        </div>
      )}

      {/* 8. 레시피 2열 그리드 */}
      <h2 className="text-lg font-bold mb-4">레시피 목록 ({filteredRecipes.length})</h2>
      <div className="grid grid-cols-2 gap-4">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="relative aspect-square bg-gray-100">
               {recipe.image ? (
                 <img src={recipe.image} className="w-full h-full object-cover" alt={recipe.name} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat /></div>
               )}
               <button className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-gray-400 hover:text-red-500">
                 <Heart size={16} />
               </button>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{recipe.name}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock size={12}/> {recipe.cookingTime || 30}분</span>
                <span>{recipe.difficulty || '보통'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipePage;
