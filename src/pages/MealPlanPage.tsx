import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const MealPlanPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]); // 레시피 검색용
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('BREAKFAST'); // 아침/점심/저녁
  const [selectedRecipe, setSelectedRecipe] = useState('');

  // 1. 이번 주 식단 데이터 가져오기 (실시간)
  useEffect(() => {
    // 날짜 범위 계산 (일요일 ~ 토요일)
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const startStr = start.toISOString().split('T')[0];

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    // 간단하게 문자열 비교를 위해 전체 데이터를 가져와서 필터링 (프로덕션에선 쿼리 최적화 필요)
    
    const unsubscribe = onSnapshot(collection(db, 'meal_plans'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMealPlans(loaded);
    });
    
    // 레시피 목록도 미리 가져오기 (선택용)
    getDocs(collection(db, 'recipes')).then(snap => {
      setRecipes(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    });

    return () => unsubscribe();
  }, [currentDate]);

  // 날짜 이동
  const moveWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  // 식단 추가
  const handleAdd = async () => {
    if (!selectedRecipe) return;
    
    // 선택한 레시피 이름 찾기
    const recipeName = recipes.find(r => r.id === selectedRecipe)?.name || '기타 요리';

    await addDoc(collection(db, 'meal_plans'), {
      date: selectedDate,
      type: selectedType, // BREAKFAST, LUNCH, DINNER
      recipeId: selectedRecipe,
      recipeName: recipeName,
      createdAt: new Date()
    });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if(confirm('식단을 삭제하시겠습니까?')) await deleteDoc(doc(db, 'meal_plans', id));
  };

  // 주간 달력 생성
  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay()); // 일요일부터

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] px-5 pt-6 pb-24">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-[#FF6B6B] flex items-center gap-2">
          <Calendar className="w-6 h-6" /> 식단표
        </h1>
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-[#FFE0B2]">
          <button onClick={() => moveWeek(-1)}><ChevronLeft className="w-4 h-4 text-gray-400" /></button>
          <span className="text-sm font-bold text-gray-600">
            {currentDate.getMonth() + 1}월 {Math.ceil(currentDate.getDate() / 7)}주차
          </span>
          <button onClick={() => moveWeek(1)}><ChevronRight className="w-4 h-4 text-gray-400" /></button>
        </div>
      </div>

      {/* 식단 추가 모달 (간단 버전) */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">🍽️ 식단 추가하기</h3>
            
            <label className="block text-xs font-bold text-gray-400 mb-1">날짜</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full mb-3 p-2 border rounded-lg" />
            
            <label className="block text-xs font-bold text-gray-400 mb-1">시간</label>
            <div className="flex gap-2 mb-3">
              {['BREAKFAST', 'LUNCH', 'DINNER'].map(t => (
                <button key={t} onClick={() => setSelectedType(t)} 
                  className={`flex-1 py-2 text-xs rounded-lg font-bold ${selectedType === t ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100'}`}>
                  {t === 'BREAKFAST' ? '아침' : t === 'LUNCH' ? '점심' : '저녁'}
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold text-gray-400 mb-1">메뉴 선택</label>
            <select value={selectedRecipe} onChange={e => setSelectedRecipe(e.target.value)} className="w-full mb-6 p-2 border rounded-lg">
              <option value="">레시피를 선택하세요</option>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">취소</button>
              <button onClick={handleAdd} className="flex-1 py-3 bg-[#FF6B6B] text-white rounded-xl font-bold">등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 주간 리스트 */}
      <div className="space-y-4">
        {getWeekDays().map(dateStr => {
          const dayPlans = mealPlans.filter(p => p.date === dateStr);
          const dateObj = new Date(dateStr);
          const dayName = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div key={dateStr} className={`bg-white rounded-2xl p-4 border ${isToday ? 'border-[#FF6B6B] shadow-md' : 'border-transparent shadow-sm'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-black ${dateObj.getDay() === 0 ? 'text-red-400' : 'text-gray-800'}`}>{dateObj.getDate()}일</span>
                  <span className="text-xs font-bold text-gray-400">{dayName}요일</span>
                </div>
                <button 
                  onClick={() => { setSelectedDate(dateStr); setIsAdding(true); }}
                  className="text-xs bg-orange-50 text-[#FF6B6B] px-2 py-1 rounded-lg font-bold"
                >
                  + 추가
                </button>
              </div>

              {/* 해당 날짜의 식단들 */}
              <div className="space-y-2">
                {dayPlans.length === 0 ? (
                  <p className="text-xs text-gray-300 py-2 text-center">등록된 식단이 없습니다.</p>
                ) : (
                  dayPlans.sort((a,b) => (a.type === 'BREAKFAST' ? -1 : 1)).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 w-8">
                          {plan.type === 'BREAKFAST' ? '아침' : plan.type === 'LUNCH' ? '점심' : '저녁'}
                        </span>
                        <span className="text-sm font-bold text-gray-700">{plan.recipeName}</span>
                      </div>
                      <button onClick={() => handleDelete(plan.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealPlanPage;
