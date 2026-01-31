import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { CATEGORIES } from '../constants'; // constants.ts에 있는 카테고리 활용
import { useData } from '../App'; // DataContext 사용

const FridgePage = () => {
  const { fridge, deleteIngredient } = useData(); // App.tsx에서 제공하는 데이터
  const [filterCat, setFilterCat] = useState('ALL');
  const [search, setSearch] = useState('');

  // 필터링 로직
  const filteredItems = fridge.filter(item => {
    const matchCat = filterCat === 'ALL' || item.category === filterCat;
    const matchSearch = item.name.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-5 pt-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">나의 냉장고 🧊</h2>
        <button className="bg-[#2E7D32] text-white p-2 rounded-full shadow-md hover:bg-[#1b5e20]">
          <Plus size={20} />
        </button>
      </div>

      {/* 검색창 */}
      <div className="relative mb-4">
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="보관된 재료 검색"
          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2E7D32]"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        <button 
          onClick={() => setFilterCat('ALL')}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${filterCat === 'ALL' ? 'bg-[#2E7D32] text-white' : 'bg-white text-gray-500 border'}`}
        >
          전체
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${filterCat === cat.id ? 'bg-[#2E7D32] text-white' : 'bg-white text-gray-500 border'}`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* 7. 냉장고 그리드 뷰 (3열) */}
      <div className="grid grid-cols-3 gap-3">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-transparent hover:border-[#2E7D32] flex flex-col items-center text-center relative group">
            <div className="text-3xl mb-2">{item.image || '📦'}</div>
            <div className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</div>
            <div className="text-xs text-[#2E7D32] font-bold mt-1">{item.quantity}{item.unit}</div>
            <div className="text-[10px] text-gray-400 mt-1">~{item.expiryDate?.slice(5)}</div>
            
            {/* 삭제 버튼 (호버 시 표시) */}
            <button 
              onClick={(e) => { e.stopPropagation(); deleteIngredient(item.id); }}
              className="absolute top-1 right-1 bg-gray-100 text-gray-400 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-20 text-gray-400 text-sm">보관된 재료가 없어요.</div>
      )}
    </div>
  );
};

export default FridgePage;
