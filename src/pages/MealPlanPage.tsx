import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, Plus, Trash2, ChevronLeft, ChevronRight, Flame, User as UserIcon } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, useData } from '../App';

const MealPlanPage = () => {
  const { user } = useAuth();
  const { mealPlans, openMealModal, members, recipes, removeFromMealPlan } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 가로 달력용 날짜 생성 (이번주)
  const getWeekDates = () => {
    const dates = [];
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay()); // 일요일부터
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dateStr = selectedDate.toISOString().split('T')[0];
  const todayPlan = mealPlans.find(p => p.date === dateStr);

  // 통계 계산
  let totalCalories = 0;
  const ingredientCount: Record<string, number> = {};

  ['BREAKFAST', 'LUNCH', 'DINNER'].forEach(type => {
    todayPlan?.meals[type as 'BREAKFAST'].forEach(item => {
      // 칼로리 (레시피에 없으면 대략 500으로 가정)
      totalCalories += (item.recipe.calories || 500);
      // 재료 카운트
      item.recipe.ingredients?.forEach(ing => {
        ingredientCount[ing.name] = (ingredientCount[ing.name] || 0) + 1;
      });
    });
  });

  const topIngredients = Object.entries(ingredientCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* 1. 상단 날짜 선택 (가로 스크롤) */}
      <div className="bg-white p-4 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-gray-800">{selectedDate.getMonth()+1}월 {Math.ceil(selectedDate.getDate()/7)}주차 식단</h2>
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
        {/* 2, 3. 요약 카드 (칼로리 & 재료) */}
        <div className="bg-white rounded-2xl p-5 mb-6 flex justify-between items-center shadow-sm">
           <div>
             <p className="text-xs text-gray-400 font-bold mb-1">오늘의 섭취 예정</p>
             <div className="flex items-end gap-1">
               <Flame className="text-orange-500" size={24} fill="orange" />
               <span className="text-2xl font-black text-gray-800">{totalCalories}</span>
               <span className="text-xs text-gray-500 mb-1">kcal</span>
             </div>
           </div>
           <div className="text-right">
             <p className="text-xs text-gray-400 font-bold mb-2">많이 쓰는 재료</p>
             <div className="flex gap-1 justify-end">
               {topIngredients.length > 0 ? topIngredients.map((ing, i) => (
                 <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold border border-green-100">
                   {ing}
                 </span>
               )) : <span className="text-xs text-gray-300">식단을 등록해주세요</span>}
             </div>
           </div>
        </div>

        {/* 4. 아침 / 점심 / 저녁 리스트 */}
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
                <button 
                  onClick={() => openMealModal(recipes[0])} // 실제로는 빈 모달 열어야 함 (단순화)
                  className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded hover:bg-gray-200"
                >
                  + 추가
                </button>
              </div>

              {meals.length === 0 ? (
                <div className="bg-white rounded-xl p-4 text-center text-gray-300 text-sm border border-dashed border-gray-200">
                  메뉴를 추가해주세요
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                      <div className="flex gap-4">
                        <img src={item.recipe.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{item.recipe.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.recipe.calories || 500} kcal</p>
                          
                          {/* 5. 구성원 표시 */}
                          <div className="flex gap-1 mt-2">
                            {item.memberIds.map(mid => {
                              const mem = members.find(m => m.id === mid);
                              return mem ? (
                                <div key={mid} className={`w-5 h-5 rounded-full ${mem.avatarColor || 'bg-gray-200'} flex items-center justify-center text-[10px] text-white border border-white shadow-sm`} title={mem.name}>
                                  {mem.name[0]}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <button onClick={() => removeFromMealPlan(dateStr, type as any, item.recipe.id)} className="text-gray-300 hover:text-red-400 self-start">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
