import React, { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame, Search, X, ChefHat } from 'lucide-react';
import { useData } from '../App';

const MealPlanPage = () => {
  const { mealPlans, addToMealPlan, removeFromMealPlan, recipes, members } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // 식단 추가 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('BREAKFAST');
  const [search, setSearch] = useState('');

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dateStr = selectedDate.toISOString().split('T')[0];
  const todayPlan = mealPlans.find(p => p.date === dateStr);

  const openAddModal = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
    setTargetType(type);
    setSearch('');
    setIsAddModalOpen(true);
  };

  const handleAddRecipe = (recipe: any) => {
    addToMealPlan(dateStr, targetType, recipe);
    setIsAddModalOpen(false);
  };

  let totalCalories = 0;
  ['BREAKFAST', 'LUNCH', 'DINNER'].forEach(type => {
    todayPlan?.meals[type as 'BREAKFAST'].forEach(item => totalCalories += (item.recipe.calories || 500));
  });

  // 검색된 레시피 목록
  const filteredRecipes = recipes.filter(r => r.name.includes(search));

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* 날짜 선택 */}
      <div className="bg-white p-4 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-gray-800">{selectedDate.getMonth()+1}월 {Math.ceil(selectedDate.getDate()/7)}주차</h2>
           <div className="flex gap-2">
             <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-7); setSelectedDate(d); }}><ChevronLeft/></button>
             <button onClick={() => setSelectedDate(new Date())} className="text-xs bg-gray-100 px-2 py-1 rounded">오늘</button>
             <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+7); setSelectedDate(d); }}><ChevronRight/></button>
           </div>
        </div>
        <div className="flex justify-between">
          {getWeekDates().map(date => {
            const isSelected = date.toISOString().split('T')[0] === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
            return (
              <button 
                key={date.toString()} 
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center p-2 rounded-xl min-w-[45px] transition-colors ${isSelected ? 'bg-[#FF6B6B] text-white shadow-md' : 'text-gray-500'}`}
              >
                <span className="text-[10px] mb-1">{['일','월','화','수','목','금','토'][date.getDay()]}</span>
                <span className={`text-lg font-bold ${isToday && !isSelected ? 'text-[#FF6B6B]' : ''}`}>{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5">
        <div className="bg-white rounded-2xl p-5 mb-6 flex items-center gap-3 shadow-sm border border-gray-100">
             <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
               <Flame size={24} fill="currentColor" />
             </div>
             <div>
               <p className="text-xs text-gray-400 font-bold">오늘 섭취 칼로리</p>
               <span className="text-2xl font-black text-gray-800">{totalCalories}</span>
               <span className="text-sm text-gray-500 ml-1">kcal</span>
             </div>
        </div>

        {['BREAKFAST', 'LUNCH', 'DINNER'].map((type) => {
          const meals = todayPlan?.meals[type as keyof typeof todayPlan.meals] || [];
          const label = type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : '저녁';
          
          return (
            <div key={type} className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <span className={`w-2 h-6 rounded-full ${type === 'BREAKFAST' ? 'bg-yellow-400' : type === 'LUNCH' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                  {label}
                </h3>
                {/* 1. 요리 추가 버튼 (레시피 검색 모달 열기) */}
                <button 
                  onClick={() => openAddModal(type as any)} 
                  className="text-xs bg-[#FF6B6B] text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:bg-[#ff5252] transition-colors flex items-center gap-1"
                >
                  <Plus size={14}/> 요리 추가
                </button>
              </div>

              {meals.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center text-gray-300 text-sm border border-dashed border-gray-200">
                  메뉴를 추가해주세요
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 relative flex gap-3">
                      <img src={item.recipe.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" alt={item.recipe.name} />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm">{item.recipe.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          {item.memberIds.map(mid => {
                            const mem = members.find(m => m.id === mid);
                            return mem ? (
                              <div key={mid} className={`w-5 h-5 rounded-full ${mem.avatarColor || 'bg-gray-200'} flex items-center justify-center text-[10px] text-white border border-white shadow-sm`}>
                                {mem.name[0]}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <button onClick={() => removeFromMealPlan(dateStr, type as any, item.recipe.id)} className="text-gray-300 hover:text-red-400 self-start p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. 레시피 검색 및 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 h-[80vh] flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-lg text-gray-800">
                {targetType === 'BREAKFAST' ? '아침' : targetType === 'LUNCH' ? '점심' : '저녁'} 메뉴 추가
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}><X className="text-gray-400"/></button>
            </div>

            <div className="relative mb-4 shrink-0">
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="레시피 검색 (예: 김치찌개)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#FF6B6B]"
              />
              <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4"/>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredRecipes.map(recipe => (
                <div key={recipe.id} onClick={() => handleAddRecipe(recipe)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#FF6B6B] cursor-pointer transition-colors">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {recipe.image ? <img src={recipe.image} className="w-full h-full object-cover"/> : <ChefHat className="text-gray-300 m-3"/>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-800">{recipe.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{recipe.cookingTime}분 • {recipe.calories}kcal</p>
                  </div>
                  <button className="bg-[#FF6B6B] text-white p-1.5 rounded-full"><Plus size={16}/></button>
                </div>
              ))}
              {filteredRecipes.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">검색 결과가 없습니다.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanPage;
