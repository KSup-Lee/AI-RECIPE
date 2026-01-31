import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, SlidersHorizontal, ArrowUpDown, Star, X, ChevronDown } from 'lucide-react';
import { CATEGORIES, INGREDIENT_UNITS, PREDEFINED_INGREDIENTS } from '../constants';
import { useData } from '../App';

// 한글 카테고리 매핑
const CATEGORY_LABELS: Record<string, string> = {
  VEGETABLE: '채소',
  FRUIT: '과일',
  MEAT: '정육/계란',
  SEAFOOD: '수산/해물',
  GRAIN: '곡류/견과',
  DAIRY: '유제품',
  SAUCE: '양념/오일',
  PROCESSED: '가공/냉동',
  ETC: '기타'
};

const getChosung = (str: string) => {
  const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  let result = "";
  for(let i=0; i<str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if(code > -1 && code < 11172) result += cho[Math.floor(code/588)];
    else result += str.charAt(i);
  }
  return result;
};

const FridgePage = () => {
  const { fridge, deleteIngredient, addIngredient, updateIngredient } = useData();
  const [filterCat, setFilterCat] = useState('ALL');
  const [sortType, setSortType] = useState('EXPIRY'); 
  const [search, setSearch] = useState('');
  
  const [frequentItems, setFrequentItems] = useState<string[]>(['계란', '우유', '양파', '두부']); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // 폼 상태
  const [form, setForm] = useState({ name: '', quantity: 1, unit: '개', expiryDate: '', category: 'VEGETABLE' });
  
  // 모달 상태
  const [modalSearch, setModalSearch] = useState(''); 
  const [modalCategory, setModalCategory] = useState('ALL'); // 모달 내 카테고리 필터

  // 날짜 선택용 상태 (년, 월, 일)
  const [dateY, setDateY] = useState(new Date().getFullYear());
  const [dateM, setDateM] = useState(new Date().getMonth() + 1);
  const [dateD, setDateD] = useState(new Date().getDate());

  // 폼의 expiryDate가 변경되면 년/월/일 상태도 동기화
  useEffect(() => {
    if (form.expiryDate) {
      const [y, m, d] = form.expiryDate.split('-').map(Number);
      if (y && m && d) {
        setDateY(y);
        setDateM(m);
        setDateD(d);
      }
    }
  }, [form.expiryDate]);

  // 년/월/일이 변경되면 form.expiryDate 업데이트
  useEffect(() => {
    const str = `${dateY}-${String(dateM).padStart(2, '0')}-${String(dateD).padStart(2, '0')}`;
    setForm(prev => ({ ...prev, expiryDate: str }));
  }, [dateY, dateM, dateD]);

  // 메인 리스트 필터링
  const filteredItems = fridge.filter(item => {
    const matchCat = filterCat === 'ALL' || item.category === filterCat;
    const chosungSearch = getChosung(search);
    const itemChosung = getChosung(item.name);
    const matchSearch = item.name.includes(search) || itemChosung.includes(chosungSearch);
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (sortType === 'EXPIRY') return (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999');
    return a.name.localeCompare(b.name);
  });

  // 모달 내 재료 그리드 필터링 (검색어 + 카테고리)
  const filteredPredefined = useMemo(() => {
    let result = PREDEFINED_INGREDIENTS;
    
    // 1. 카테고리 필터
    if (modalCategory !== 'ALL') {
      result = result.filter(item => item.category === modalCategory);
    }

    // 2. 검색어 필터
    if (modalSearch) {
      const chosung = getChosung(modalSearch);
      result = result.filter(item => {
          const itemChosung = getChosung(item.name);
          return item.name.includes(modalSearch) || itemChosung.includes(chosung);
      });
    }
    return result;
  }, [modalSearch, modalCategory]);

  const handleOpenAdd = () => {
    const today = new Date();
    setEditingItem(null);
    setForm({ 
      name: '', 
      quantity: 1, 
      unit: '개', 
      expiryDate: today.toISOString().split('T')[0], 
      category: 'VEGETABLE' 
    });
    setModalSearch('');
    setModalCategory('ALL');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({ ...item });
    setIsModalOpen(true);
  };

  // 재료 선택 시 자동 입력
  const selectPredefined = (item: any) => {
    const today = new Date();
    const expiry = new Date(today.setDate(today.getDate() + (item.defaultExpiryDays || item.expiry || 7)));
    const expiryStr = expiry.toISOString().split('T')[0];

    setForm({
      ...form,
      name: item.name,
      category: item.category,
      unit: item.defaultUnit || item.unit || '개',
      expiryDate: expiryStr
    });
    // 검색창 초기화하지 않고 선택된 것 유지
  };

  const handleSave = () => {
    if (!form.name) return alert('재료를 선택하거나 이름을 입력해주세요');
    
    const predefinedInfo = PREDEFINED_INGREDIENTS.find(p => p.name === form.name);
    const icon = predefinedInfo?.icon || '📦';

    if (editingItem) {
      updateIngredient(editingItem.id, { ...form, image: icon });
    } else {
      addIngredient({ 
        ...form, 
        id: Date.now().toString(), 
        image: icon, 
        storage: predefinedInfo?.defaultStorage || 'FRIDGE' 
      } as any);
    }
    setIsModalOpen(false);
  };

  // 날짜 생성 헬퍼
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-5 pt-6 pb-24">
      
      {/* 자주 사는 재료 */}
      <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 mb-3 text-gray-800 font-bold text-sm">
          <Star size={16} className="text-yellow-400 fill-yellow-400" /> 자주 사는 재료
        </div>
        <div className="flex flex-wrap gap-2">
          {frequentItems.map(name => {
            const inFridge = fridge.some(i => i.name === name);
            return (
              <div key={name} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${inFridge ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-500'}`}>
                {name} {inFridge ? '있음' : '부족'}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">냉장고 목록 ({filteredItems.length})</h2>
        <div className="flex gap-2">
           <button onClick={() => setSortType(sortType === 'EXPIRY' ? 'NAME' : 'EXPIRY')} className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 font-bold flex items-center gap-1">
             <ArrowUpDown size={14} /> {sortType === 'EXPIRY' ? '유통기한순' : '가나다순'}
           </button>
           <button onClick={handleOpenAdd} className="bg-[#FF6B6B] text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
             <Plus size={16} /> 재료 추가
           </button>
        </div>
      </div>

      {/* 검색 & 필터 */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 mb-4 sticky top-[70px] z-10 shadow-sm">
         <div className="relative mb-2">
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="내 냉장고 검색"
              className="w-full bg-gray-50 border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-[#FF6B6B]"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
         </div>
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setFilterCat('ALL')} className={`shrink-0 px-3 py-1 rounded-md text-xs font-bold ${filterCat === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>전체</button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`shrink-0 px-3 py-1 rounded-md text-xs font-bold ${filterCat === cat.id ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {cat.label}
              </button>
            ))}
         </div>
      </div>

      {/* 리스트 뷰 */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => handleOpenEdit(item)}
            className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-4">
               <div className="text-2xl w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">{item.image || '📦'}</div>
               <div>
                  <div className="font-bold text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-400 flex gap-2">
                     <span className="text-[#FF6B6B] font-bold">{CATEGORY_LABELS[item.category] || item.category}</span>
                     <span>|</span>
                     <span>{item.expiryDate ? `~${item.expiryDate}` : '날짜미정'}</span>
                  </div>
               </div>
            </div>
            <div className="text-right">
               <div className="font-bold text-lg text-[#FF6B6B]">{item.quantity}<span className="text-xs text-gray-500 ml-0.5">{item.unit}</span></div>
               <button 
                  onClick={(e) => { e.stopPropagation(); deleteIngredient(item.id); }}
                  className="text-xs text-gray-300 underline hover:text-red-500"
               >삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 재료 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up h-[85vh] flex flex-col">
             <div className="flex justify-between items-center mb-4 shrink-0">
               <h3 className="text-lg font-bold">{editingItem ? '재료 수정' : '새 재료 추가'}</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400"/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-1">
                
                {/* 1. 재료 선택 영역 (수정 시에는 숨김) */}
                {!editingItem && (
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-6">
                    <label className="text-sm font-bold text-[#FF6B6B] block mb-3 flex items-center gap-1">
                      <Search size={14}/> 어떤 재료를 넣을까요?
                    </label>
                    
                    <input 
                      value={modalSearch}
                      onChange={e => setModalSearch(e.target.value)}
                      placeholder="재료명 검색 (예: 계란, ㅇㅇ)"
                      className="w-full border p-3 rounded-xl bg-white text-sm mb-3 focus:border-[#FF6B6B] outline-none shadow-sm"
                    />

                    {/* 모달 내 카테고리 탭 (추가됨) */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                      <button onClick={() => setModalCategory('ALL')} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border ${modalCategory === 'ALL' ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white text-gray-500 border-gray-200'}`}>전체</button>
                      {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setModalCategory(c.id)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border ${modalCategory === c.id ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white text-gray-500 border-gray-200'}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* 재료 그리드 */}
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {filteredPredefined.map(p => (
                        <button 
                          key={p.name} 
                          onClick={() => selectPredefined(p)}
                          className={`flex flex-col items-center justify-center border rounded-xl p-2 transition-all ${form.name === p.name ? 'bg-white border-[#FF6B6B] ring-2 ring-[#FF6B6B] ring-opacity-50' : 'bg-white border-orange-100 hover:border-orange-300'}`}
                        >
                          <span className="text-2xl mb-1">{p.icon}</span>
                          <span className="text-[10px] text-gray-700 font-bold truncate w-full text-center">{p.name}</span>
                        </button>
                      ))}
                      {filteredPredefined.length === 0 && (
                        <div className="col-span-4 text-center text-xs text-gray-400 py-4">검색 결과가 없어요</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. 입력 폼 */}
                <div className="space-y-5">
                  {/* 이름/카테고리 입력창 제거됨 (요청사항 반영) */}
                  {/* 선택된 재료 표시 (수정 모드이거나 선택된 경우) */}
                  {(form.name || editingItem) && (
                    <div className="text-center pb-2 border-b border-gray-100">
                      <span className="text-2xl font-black text-gray-800">{form.name}</span>
                      <span className="text-xs text-gray-400 ml-2 block mt-1">{CATEGORY_LABELS[form.category]}</span>
                    </div>
                  )}
                  
                  {/* 수량 및 단위 */}
                  <div className="flex gap-3">
                     <div className="flex-1">
                        <label className="text-xs font-bold text-gray-400 mb-1.5 block">수량</label>
                        <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full border p-3 rounded-xl bg-gray-50 font-bold text-lg text-center focus:bg-white focus:border-[#FF6B6B] outline-none"/>
                     </div>
                     <div className="w-28">
                        <label className="text-xs font-bold text-gray-400 mb-1.5 block">단위</label>
                        <div className="relative">
                          <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50 h-[54px] appearance-none font-bold text-gray-700 text-center focus:bg-white focus:border-[#FF6B6B] outline-none">
                            {INGREDIENT_UNITS.map(u => <option key={u}>{u}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>
                     </div>
                  </div>
                  
                  {/* 날짜 선택 (커스텀 년/월/일) */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block">유통기한 (자동계산됨)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select value={dateY} onChange={e => setDateY(Number(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 appearance-none font-bold text-center focus:bg-white focus:border-[#FF6B6B] outline-none">
                          {years.map(y => <option key={y} value={y}>{y}년</option>)}
                        </select>
                      </div>
                      <div className="relative w-20">
                        <select value={dateM} onChange={e => setDateM(Number(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 appearance-none font-bold text-center focus:bg-white focus:border-[#FF6B6B] outline-none">
                          {months.map(m => <option key={m} value={m}>{m}월</option>)}
                        </select>
                      </div>
                      <div className="relative w-20">
                        <select value={dateD} onChange={e => setDateD(Number(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 appearance-none font-bold text-center focus:bg-white focus:border-[#FF6B6B] outline-none">
                          {days.map(d => <option key={d} value={d}>{d}일</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
             </div>
             
             <button onClick={handleSave} className="w-full bg-[#FF6B6B] text-white py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-orange-200 hover:bg-[#FF5252] transition-colors shrink-0 text-lg">
               {editingItem ? '수정 완료' : '냉장고에 넣기'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FridgePage;
