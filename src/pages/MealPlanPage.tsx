import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame, Search, X, AlertTriangle, Wand2, RefreshCw, ShoppingCart, Calendar, CheckSquare, Square } from 'lucide-react';
import { useData } from '../App';
import { useNavigate } from 'react-router-dom';

const MealPlanPage = () => {
  const navigate = useNavigate();
  const { mealPlans, addToMealPlan, removeFromMealPlan, updateMealMembers, members, getRecommendedRecipes, checkRecipeWarnings, openMealModal, autoPlanDay, resetDay, autoPlanPeriod, analyzeShoppingNeeds, addShoppingList } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isShoppingAnalysisOpen, setIsShoppingAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any[]>([]);
  const [analysisDays, setAnalysisDays] = useState(3);
  
  // 🌟 [추가] 장보기 선택 상태 관리
  const [selectedShoppingItems, setSelectedShoppingItems] = useState<Set<string>>(new Set());

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

  const handleAutoRecommend = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
    const candidates = getRecommendedRecipes(type, dateStr);
    if (candidates.length > 0) {
      const topFive = candidates.slice(0, 5);
      const randomRecipe = topFive[Math.floor(Math.random() * topFive.length)];
      addToMealPlan(dateStr, type, randomRecipe);
    } else {
      alert('조건에 맞는 추천 레시피가 없어요.');
    }
  };

  const handleRecommendDay = async () => {
      if(confirm('오늘 식단을 AI가 자동으로 짜드릴까요?')) {
          await autoPlanDay(dateStr);
      }
  };

  const handleResetDay = async () => {
      if(confirm('오늘 식단을 모두 비우시겠습니까?')) {
          await resetDay(dateStr);
      }
  };

  const handlePeriodPlan = async (days: number) => {
      if(confirm(`오늘부터 ${days}일치 식단을 자동으로 생성하시겠습니까?`)) {
          await autoPlanPeriod(dateStr, days);
          setIsPeriodModalOpen(false);
          alert('식단 생성이 완료되었습니다!');
      }
  };

  // 장보기 분석 실행
  const handleAnalyzeShopping = () => {
      const me = members.find(m => m.relationship === 'ME');
      const cycle = me?.shoppingCycle || 3;
      
      const needs = analyzeShoppingNeeds(dateStr, cycle);
      setAnalysisResult(needs);
      setAnalysisDays(cycle);
      
      // 🌟 기본적으로 모든 재료 선택 상태로 시작
      const allNames = new Set(needs.map(item => item.name));
      setSelectedShoppingItems(allNames);
      
      setIsShoppingAnalysisOpen(true);
  };

  // 🌟 [추가] 체크박스 토글 함수
  const toggleShoppingItem = (name: string) => {
      const newSet = new Set(selectedShoppingItems);
      if (newSet.has(name)) newSet.delete(name);
      else newSet.add(name);
      setSelectedShoppingItems(newSet);
  };

  // 🌟 [수정] 선택된 항목만 저장
  const handleSaveShoppingList = async () => {
      // 선택된 항목만 필터링
      const itemsToSave = analysisResult
          .filter(item => selectedShoppingItems.has(item.name))
          .map(item => `${item.name} ${item.amount}${item.unit} (${item.dateNeeded} 필요)`);
      
      if (itemsToSave.length === 0) return alert("선택된 재료가 없습니다.");

      await addShoppingList(itemsToSave);
      setIsShoppingAnalysisOpen(false);
      
      if(confirm(`${itemsToSave.length}개 재료를 장바구니에 담았습니다.\n장보기 목록으로 이동할까요?`)) {
          navigate('/shopping');
      }
  };

  const handleAddRecipe = (recipe: any) => {
    addToMealPlan(dateStr, targetType, recipe);
    setIsAddModalOpen(false);
  };

  const toggleMember = (mealType: any, recipeId: string, memberId: string) => {
    updateMealMembers(dateStr, mealType, recipeId, memberId);
  };

  let totalCalories = 0;
  ['BREAKFAST', 'LUNCH', 'DINNER'].forEach(type => {
    const meals = todayPlan?.meals[type as 'BREAKFAST'] || [];
    meals.forEach(item => {
        const recipeCal = item.recipe.nutrition?.calories || item.recipe.calories || 500;
        const eatersCount = item.memberIds.length; 
        totalCalories += (recipeCal * eatersCount);
    });
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* 날짜 선택 */}
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
        <div className="flex justify-between items-center mb-4 gap-2">
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 flex-1">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500"><Flame size={20} fill="currentColor" /></div>
                <div><p className="text-[10px] text-gray-400 font-bold">오늘 총 섭취</p><span className="text-xl font-black text-gray-800">{totalCalories.toLocaleString()}</span><span className="text-xs text-gray-500 ml-1">kcal</span></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
                <button onClick={handleRecommendDay} className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 text-[#FF6B6B] hover:bg-orange-50 transition-colors flex items-center gap-1 text-xs font-bold justify-center">
                    <Wand2 size={14} /> 1일 추천
                </button>
                <button onClick={() => setIsPeriodModalOpen(true)} className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 text-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-bold justify-center">
                    <Calendar size={14} /> 기간 추천
                </button>
                <button onClick={handleResetDay} className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-bold justify-center">
                    <RefreshCw size={14} /> 초기화
                </button>
                <button onClick={handleAnalyzeShopping} className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 text-green-600 hover:bg-green-50 transition-colors flex items-center gap-1 text-xs font-bold justify-center">
                    <ShoppingCart size={14} /> 장보기
                </button>
            </div>
        </div>

        {['BREAKFAST', 'LUNCH', 'DINNER'].map((type) => {
          const meals = todayPlan?.meals[type as 'BREAKFAST'] || [];
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
                    const unitCal = item.recipe.nutrition?.calories || item.recipe.calories || 500;
                    const totalItemCal = unitCal * item.memberIds.length;

                    return (
                        <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border ${warnings.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'} relative`}>
                        <div className="flex gap-3 mb-3 cursor-pointer" onClick={() => openMealModal(item.recipe)}>
                            <img src={item.recipe.image} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Img'; }} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm">{item.recipe.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500">{unitCal}kcal × {item.memberIds.length}명 = </span>
                                    <span className="text-xs font-bold text-[#FF6B6B]">{totalItemCal}kcal</span>
                                </div>
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

      {isPeriodModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
              <div className="bg-white w-full max-w-xs rounded-2xl p-6 animate-slide-up">
                  <h3 className="font-bold text-lg mb-4 text-center">📅 식단 기간 자동 추천</h3>
                  <div className="grid grid-cols-1 gap-3">
                      <button onClick={() => handlePeriodPlan(3)} className="bg-orange-50 border border-orange-200 text-orange-600 py-3 rounded-xl font-bold">3일치 추천 받기</button>
                      <button onClick={() => handlePeriodPlan(7)} className="bg-blue-50 border border-blue-200 text-blue-600 py-3 rounded-xl font-bold">일주일치 추천 받기</button>
                      <button onClick={() => setIsPeriodModalOpen(false)} className="mt-2 text-gray-400 text-sm underline">취소</button>
                  </div>
              </div>
          </div>
      )}

      {/* 🌟 [수정] 장보기 분석 모달 (선택 기능 추가) */}
      {isShoppingAnalysisOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 h-[75vh] flex flex-col animate-slide-up">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="font-bold text-lg">🛒 장보기 분석 ({analysisDays}일)</h3>
                      <button onClick={() => setIsShoppingAnalysisOpen(false)}><X className="text-gray-400"/></button>
                  </div>
                  
                  {/* 전체 선택 토글 */}
                  <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-sm text-gray-500">구매할 재료를 선택하세요</span>
                      <button onClick={() => setSelectedShoppingItems(selectedShoppingItems.size === analysisResult.length ? new Set() : new Set(analysisResult.map(i => i.name)))} className="text-xs font-bold text-blue-500">
                          {selectedShoppingItems.size === analysisResult.length ? '전체 해제' : '전체 선택'}
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {analysisResult.length === 0 ? (
                          <div className="text-center py-10 text-gray-400">냉장고가 빵빵해요! 살 게 없네요 🎉</div>
                      ) : (
                          analysisResult.map((item, i) => {
                              const isChecked = selectedShoppingItems.has(item.name);
                              return (
                                <div key={i} onClick={() => toggleShoppingItem(item.name)} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${isChecked ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}>
                                    <div className="flex items-center gap-3">
                                        {isChecked ? <CheckSquare className="text-[#FF6B6B]" size={20}/> : <Square className="text-gray-300" size={20}/>}
                                        <div>
                                            <div className={`font-bold ${isChecked ? 'text-gray-800' : 'text-gray-400'}`}>{item.name} {item.amount}{item.unit}</div>
                                            <div className="text-xs text-red-500 font-bold">{item.dateNeeded} 사용</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${item.dday <= 1 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>D-{item.dday}</div>
                                </div>
                              );
                          })
                      )}
                  </div>
                  {analysisResult.length > 0 && (
                      <button onClick={handleSaveShoppingList} className="w-full bg-[#FF6B6B] text-white py-3 rounded-xl font-bold mt-4 shrink-0 shadow-md flex items-center justify-center gap-2">
                          <ShoppingCart size={18}/> {selectedShoppingItems.size}개 장바구니 담기
                      </button>
                  )}
              </div>
          </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 h-[80vh] flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-4 shrink-0"><h3 className="font-bold text-lg text-gray-800">{targetType === 'BREAKFAST' ? '아침' : targetType === 'LUNCH' ? '점심' : '저녁'} 메뉴 수동 추가</h3><button onClick={() => setIsAddModalOpen(false)}><X className="text-gray-400"/></button></div>
            <div className="relative mb-4 shrink-0"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="레시피 검색" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#FF6B6B]" /><Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4"/></div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <p className="text-xs text-[#FF6B6B] font-bold mb-2">✨ AI 맞춤 추천 (알러지/기피재료 고려)</p>
              {recommendedRecipes.map(recipe => (
                <div key={recipe.id} onClick={() => handleAddRecipe(recipe)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#FF6B6B] cursor-pointer transition-colors">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0"><img src={recipe.image} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Img'; }} className="w-full h-full object-cover"/></div>
                  <div className="flex-1"><h4 className="font-bold text-sm text-gray-800">{recipe.name}</h4><p className="text-xs text-gray-400 mt-0.5">{recipe.cookingTime}분 • {recipe.nutrition?.calories || 500}kcal</p></div>
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
