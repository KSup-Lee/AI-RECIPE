import React, { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame, Search, X, AlertTriangle, Wand2, RefreshCw } from 'lucide-react';
import { useData } from '../App';

const MealPlanPage = () => {
  const { mealPlans, addToMealPlan, removeFromMealPlan, updateMealMembers, members, getRecommendedRecipes, checkRecipeWarnings, openMealModal } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('BREAKFAST');
  const [search, setSearch] = useState('');

  const getWeekDates = () => {
    const dates = [];
    const current = new Date(selectedDate);
    const start = new Date(current);
    start.setDate(current.getDate() - current.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dateStr = selectedDate; 
  const todayPlan = mealPlans.find(p => p.date === dateStr);
  const recommendedRecipes = getRecommendedRecipes(targetType, dateStr).filter(r => r.name.includes(search));

  // 🌟 [개선] 랜덤 추천: 상위 5개 중 랜덤으로 하나 선택
  const handleAutoRecommend = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
    const candidates = getRecommendedRecipes(type, dateStr);
    if (candidates.length > 0) {
      // 상위 5개(혹은 그 이하) 중에서 랜덤 선택
      const topCandidates = candidates.slice(0, 5);
      const randomRecipe = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      addToMealPlan(dateStr, type, randomRecipe);
    } else {
      alert('조건에 맞는 추천 레시피가 없어요.');
    }
  };

  const handleAddRecipe = (recipe: any) => {
    addToMealPlan(dateStr, targetType, recipe);
    setIsAddModalOpen(false);
  };

  const toggleMember = (mealType: any, recipeId: string, memberId: string) => {
    updateMealMembers(dateStr, mealType, recipeId, memberId);
  };

  const handleClearDay = () => {
    if (window.confirm(`${dateStr} 식단을 모두 비우시겠습니까?`)) {
      ['BREAKFAST', 'LUNCH', 'DINNER'].forEach(type => {
        const meals = todayPlan?.meals[type as 'BREAKFAST'] || [];
        meals.forEach(item => removeFromMealPlan(dateStr, type as any, item.recipe.id));
      });
    }
  };

  // 🌟 [수정] 칼로리 계산: 먹는 사람 수 반영
  let totalCalories = 0;
  ['BREAKFAST', 'LUNCH', 'DINNER'].forEach(type => {
    const meals = todayPlan?.meals[type as 'BREAKFAST'] || [];
    meals.forEach(item => {
        const recipeCal = item.recipe.calories || 500;
        const eatersCount = item.memberIds.length; // 먹는 사람 수
        totalCalories += (recipeCal * eatersCount);
    });
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      <div className="bg-white p-4 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-gray-800">{new Date(selectedDate).getMonth() + 1}월 {Math.ceil(new Date(selectedDate).getDate()/7)}주차</h2>
           <div className="flex gap-2">
             <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-7); setSelectedDate(d.toISOString().split('T')[0]); }}><ChevronLeft/></button>
             <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="text-xs bg-gray-100 px-2 py-1 rounded">오늘</button>
             <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+7); setSelectedDate(d.toISOString().split('T')[0]); }}><ChevronRight/></button>
           </div>
        </div>
        <div className="flex justify-between">
          {getWeekDates().map(date => {
            const dStr = date.toISOString().split('T')[0];
            const isSelected = dStr === selectedDate;
            const isToday = new Date().toISOString().split('T')[0] === dStr;
            const dayNames = ['일','월','화','수','목','금','토'];
            return (
              <button key={dStr} onClick={() => setSelectedDate(dStr)} className={`flex flex-col items-center p-2 rounded-xl min-w-[45px] transition-colors ${isSelected ? 'bg-[#FF6B6B] text-white shadow-md' : 'text-gray-500'}`}>
                <span className="text-[10px] mb-1">{dayNames[date.getDay()]}</span>
                <span className={`text-lg font-bold ${isToday && !isSelected ? 'text-[#FF6B6B]' : ''}`}>{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5">
        <div className="flex justify-between items-center mb-4">
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 flex-1 mr-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500"><Flame size={20} fill="currentColor" /></div>
                <div><p className="text-[10px] text-gray-400 font-bold">오늘 섭취 칼로리</p><span className="text-xl font-black text-gray-800">{totalCalories}</span><span className="text-xs text-gray-500 ml-1">kcal</span></div>
            </div>
            <button onClick={handleClearDay} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 transition-colors"><RefreshCw size={20} /></button>
        </div>

        {['BREAKFAST', 'LUNCH', 'DINNER'].map((type) => {
          const meals = todayPlan?.meals[type as keyof typeof todayPlan.meals] || [];
          const label = type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : '저녁';
          return (
            <div key={type} className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><span className={`w-2 h-6 rounded-full ${type === 'BREAKFAST' ? 'bg-yellow-400' : type === 'LUNCH' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>{label}</h3>
                <div className="flex gap-2">
                    <button onClick={() => handleAutoRecommend(type as any)} className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:opacity-90 transition-colors flex items-center gap-1"><Wand2 size={12}/> AI 추천</button>
                    <button onClick={() => { setTargetType(type as any); setSearch(''); setIsAddModalOpen(true); }} className="text-xs bg-[#FF6B6B] text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:bg-[#ff5252] transition-colors flex items-center gap-1"><Plus size={14}/> 추가</button>
                </div>
              </div>
              {meals.length === 0 ? <div className="bg-white rounded-xl p-6 text-center text-gray-300 text-sm border border-dashed border-gray-200">메뉴를 추가해주세요</div> : (
                <div className="space-y-3">
                  {meals.map((item, idx) => {
                    const warnings = checkRecipeWarnings(item.recipe, item.memberIds);
                    return (
                        <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border ${warnings.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'} relative`}>
                        <div className="flex gap-3 mb-3 cursor-pointer" onClick={() => openMealModal(item.recipe)}>
                            <img src={item.recipe.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm">{item.recipe.name}</h4>
                                <p className="text-xs text-gray-400 mt-0.5">{item.recipe.calories} kcal</p>
                                {warnings.length > 0 && (<div className="mt-1 flex flex-wrap gap-1">{warnings.map((w, i) => <span key={i} className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><AlertTriangle size={10}/> {w}</span>)}</div>)}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeFromMealPlan(dateStr, type as any, item.recipe.id); }} className="text-gray-300 hover:text-red-400 self-start p-1"><Trash2 size={16} /></button>
                        </div>
                        <div className="flex gap-2 items-center pt-2 border-t border-gray-100 overflow-x-auto no-scrollbar">
                            <span className="text-[10px] text-gray-400 font-bold shrink-0">식사 인원:</span>
                            {members.map(m => (
                                <button key={m.id} onClick={() => toggleMember(type as any, item.recipe.id, m.id)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${item.memberIds.includes(m.id) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-50'}`}><div className={`w-3 h-3 rounded-full ${m.avatarColor}`}/> {m.name}</button>
                            ))}
                        </div>
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 h-[80vh] flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-4 shrink-0"><h3 className="font-bold text-lg text-gray-800">{targetType === 'BREAKFAST' ? '아침' : targetType === 'LUNCH' ? '점심' : '저녁'} 메뉴 수동 추가</h3><button onClick={() => setIsAddModalOpen(false)}><X className="text-gray-400"/></button></div>
            <div className="relative mb-4 shrink-0"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="레시피 검색" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#FF6B6B]" /><Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4"/></div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <p className="text-xs text-[#FF6B6B] font-bold mb-2">✨ AI 맞춤 추천 (알러지/기피재료 고려)</p>
              {recommendedRecipes.map(recipe => (
                <div key={recipe.id} onClick={() => handleAddRecipe(recipe)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#FF6B6B] cursor-pointer transition-colors">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0"><img src={recipe.image} className="w-full h-full object-cover"/></div>
                  <div className="flex-1"><h4 className="font-bold text-sm text-gray-800">{recipe.name}</h4><p className="text-xs text-gray-400 mt-0.5">{recipe.cookingTime}분 • {recipe.calories}kcal</p></div>
                  <button className="bg-[#FF6B6B] text-white p-1.5 rounded-full"><Plus size={16}/></button>
                </div>
              ))}
              {recommendedRecipes.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">검색 결과가 없어요.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanPage;
