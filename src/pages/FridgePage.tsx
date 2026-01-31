import React, { useState } from 'react';
import { Plus, Search, SlidersHorizontal, ArrowUpDown, Star } from 'lucide-react';
import { CATEGORIES, INGREDIENT_UNITS } from '../constants';
import { useData } from '../App';

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

// 카테고리별 추천 단위 매핑
const UNIT_BY_CATEGORY: Record<string, string> = {
  'MEAT': 'g', 'SEAFOOD': '마리', 'VEGETABLE': '개', 'FRUIT': '개', 'DAIRY': 'ml', 'GRAIN': 'kg'
};

const FridgePage = () => {
  const { fridge, deleteIngredient, addIngredient, updateIngredient } = useData();
  const [filterCat, setFilterCat] = useState('ALL');
  const [sortType, setSortType] = useState('EXPIRY'); 
  const [search, setSearch] = useState('');
  
  // 자주 사는 재료 관리
  const [frequentItems, setFrequentItems] = useState<string[]>(['계란', '우유', '양파']); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', quantity: 1, unit: '개', expiryDate: '', category: 'VEGETABLE' });

  // 검색 및 정렬
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

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ name: '', quantity: 1, unit: '개', expiryDate: '', category: 'VEGETABLE' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return alert('이름을 입력해주세요');
    if (editingItem) {
      updateIngredient(editingItem.id, form);
    } else {
      addIngredient({ ...form, id: Date.now().toString(), image: '📦', storage: 'FRIDGE' } as any);
    }
    setIsModalOpen(false);
  };

  // 카테고리 변경 시 단위 자동 변경
  const handleCategoryChange = (catId: string) => {
    setForm(prev => ({ ...prev, category: catId, unit: UNIT_BY_CATEGORY[catId] || '개' }));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-5 pt-6 pb-24">
      
      {/* 1. 자주 사는 재료 (상단 고정) */}
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
          <button className="px-3 py-1.5 rounded-lg text-xs border border-dashed border-gray-300 text-gray-400">+ 추가</button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">냉장고 목록 ({filteredItems.length})</h2>
        <div className="flex gap-2">
           {/* 정렬 버튼 분리 */}
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
              placeholder="재료 검색 (초성 가능)"
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

      {/* 리스트 뷰 (복구됨) */}
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
                     <span className="text-[#FF6B6B] font-bold">{item.category}</span>
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

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up">
             <h3 className="text-lg font-bold mb-4">{editingItem ? '재료 수정' : '새 재료 추가'}</h3>
             <div className="space-y-4 mb-6">
                <div>
                   <label className="text-xs font-bold text-gray-400 mb-1 block">카테고리 {editingItem && '(수정불가)'}</label>
                   <div className="flex gap-2 overflow-x-auto pb-1">
                     {CATEGORIES.map(c => (
                       <button 
                         key={c.id} 
                         disabled={!!editingItem} // 수정 시 비활성화
                         onClick={() => handleCategoryChange(c.id)} 
                         className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.category === c.id ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white text-gray-500'} ${editingItem ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         {c.label}
                       </button>
                     ))}
                   </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1 block">이름</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50" placeholder="예: 양파"/>
                </div>
                <div className="flex gap-2">
                   <div className="flex-1">
                      <label className="text-xs font-bold text-gray-400 mb-1 block">수량</label>
                      <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full border p-3 rounded-xl bg-gray-50"/>
                   </div>
                   <div className="w-24">
                      <label className="text-xs font-bold text-gray-400 mb-1 block">단위</label>
                      <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50 h-[46px]">
                        {INGREDIENT_UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                   </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1 block">유통기한</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50"/>
                </div>
             </div>
             <div className="flex gap-2">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-500">취소</button>
               <button onClick={handleSave} className="flex-1 bg-[#FF6B6B] text-white py-3 rounded-xl font-bold">저장</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FridgePage;
