import React, { useState } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, INGREDIENT_UNITS } from '../constants';
import { useData } from '../App';

// 초성 검색 유틸리티 (간단 버전)
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
  const [sortType, setSortType] = useState('EXPIRY'); // EXPIRY, NAME
  const [search, setSearch] = useState('');
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // 수정할 아이템
  const [form, setForm] = useState({ name: '', quantity: 1, unit: '개', expiryDate: '', category: 'VEGETABLE' });

  // 검색 로직 (초성 포함)
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-5 pt-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">나의 냉장고</h2>
        <div className="flex gap-2">
           <button onClick={() => setSortType(sortType === 'EXPIRY' ? 'NAME' : 'EXPIRY')} className="bg-white p-2 rounded-full border border-gray-200 text-gray-500">
             <SlidersHorizontal size={20} />
           </button>
           <button onClick={handleOpenAdd} className="bg-[#FF6B6B] text-white p-2 rounded-full shadow-md">
             <Plus size={20} />
           </button>
        </div>
      </div>

      {/* 4. 초성 검색 지원 */}
      <div className="relative mb-4">
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="재료 검색 (초성 'ㅇㅍ' 가능)"
          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF6B6B]"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        <button onClick={() => setFilterCat('ALL')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${filterCat === 'ALL' ? 'bg-[#FF6B6B] text-white' : 'bg-white text-gray-500 border'}`}>전체</button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${filterCat === cat.id ? 'bg-[#FF6B6B] text-white' : 'bg-white text-gray-500 border'}`}>{cat.icon} {cat.label}</button>
        ))}
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => handleOpenEdit(item)} // 2. 수정 모달 열기
            className="bg-white p-3 rounded-2xl shadow-sm border border-transparent hover:border-[#FF6B6B] flex flex-col items-center text-center relative group cursor-pointer"
          >
            <div className="text-3xl mb-2">{item.image || '📦'}</div>
            <div className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</div>
            <div className="text-xs text-[#FF6B6B] font-bold mt-1">{item.quantity}{item.unit}</div>
            
            {/* 유통기한 D-day 표시 */}
            <div className="text-[10px] text-gray-400 mt-1">
              {item.expiryDate ? `~${item.expiryDate.slice(5)}` : '날짜미정'}
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); deleteIngredient(item.id); }}
              className="absolute top-1 right-1 bg-gray-100 text-gray-400 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 재료 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up">
             <h3 className="text-lg font-bold mb-4">{editingItem ? '재료 수정' : '새 재료 추가'}</h3>
             <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">이름</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="예: 양파"/>
                </div>
                <div className="flex gap-2">
                   <div className="flex-1">
                      <label className="text-xs text-gray-400 block mb-1">수량</label>
                      <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full border p-2 rounded-lg"/>
                   </div>
                   <div className="w-24">
                      <label className="text-xs text-gray-400 block mb-1">단위</label>
                      <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border p-2 rounded-lg">
                        {INGREDIENT_UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                   </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">유통기한</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full border p-2 rounded-lg"/>
                </div>
                <div>
                   <label className="text-xs text-gray-400 block mb-1">카테고리</label>
                   <div className="flex gap-2 overflow-x-auto pb-1">
                     {CATEGORIES.map(c => (
                       <button key={c.id} onClick={() => setForm({...form, category: c.id})} className={`shrink-0 px-3 py-1 rounded-full text-xs border ${form.category === c.id ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white'}`}>
                         {c.label}
                       </button>
                     ))}
                   </div>
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
