import React, { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useData } from '../App';

const MealPlanPage = () => {
  const { mealPlans, addToMealPlan, removeFromMealPlan, recipes, members } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // [수정] 스마트 레시피 추천 및 자동 추가
  const handleSmartAdd = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
    if (recipes.length === 0) return alert('추천할 레시피가 없어요.');
    
    // 시간대에 맞는 추천 로직 (예시: 아침엔 가벼운거)
    // 현재는 랜덤으로 뽑지만, 나중엔 태그 기반 필터링 가능
    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    
    addToMealPlan(dateStr, type, randomRecipe);
  };

  let totalCalories = 0;
  ['BREAKFAST', 'LUNCH', 'DINNER'].forEach(type => {
    todayPlan?.meals[type as 'BREAKFAST'].forEach(item => totalCalories += (item.recipe.calories || 500));
  });

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
                {/* 스마트 추가 버튼 */}
                <button 
                  onClick={() => handleSmartAdd(type as any)} 
                  className="text-xs bg-[#FF6B6B] text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:bg-[#ff5252] transition-colors"
                >
                  + 추천 메뉴 추가
                </button>
              </div>

              {meals.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center text-gray-300 text-sm border border-dashed border-gray-200">
                  메뉴가 비어있어요. 추천 버튼을 눌러보세요!
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 relative flex gap-3">
                      <img src={item.recipe.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
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
    </div>
  );
};

export default MealPlanPage;
