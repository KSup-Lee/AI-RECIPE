import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ArrowUpDown, Star, X, ChevronDown, Heart, Check, Trash2, CheckSquare, Square } from 'lucide-react';
import { CATEGORIES, INGREDIENT_UNITS, PREDEFINED_INGREDIENTS } from '../constants';
import { useData } from '../App';

const CATEGORY_LABELS: Record<string, string> = {
  VEGETABLE: '채소', FRUIT: '과일', MEAT: '정육/계란', SEAFOOD: '수산/해물',
  GRAIN: '곡류/견과', DAIRY: '유제품', SAUCE: '양념/오일', PROCESSED: '가공/냉동', ETC: '기타'
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [frequentItems] = useState<string[]>(['계란', '우유', '양파', '두부']); 

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedAddItems, setSelectedAddItems] = useState<any[]>([]); 

  const [form, setForm] = useState({ name: '', quantity: 1, unit: '개', expiryDate: '', category: 'VEGETABLE' });
  const [modalSearch, setModalSearch] = useState(''); 
  const [modalCategory, setModalCategory] = useState('ALL');

  const [dateY, setDateY] = useState(new Date().getFullYear());
  const [dateM, setDateM] = useState(new Date().getMonth() + 1);
  const [dateD, setDateD] = useState(new Date().getDate());

  useEffect(() => {
    if (form.expiryDate) {
      const [y, m, d] = form.expiryDate.split('-').map(Number);
      if (y && m && d) { setDateY(y); setDateM(m); setDateD(d); }
    }
  }, [form.expiryDate]);

  useEffect(() => {
    const str = `${dateY}-${String(dateM).padStart(2, '0')}-${String(dateD).padStart(2, '0')}`;
    setForm(prev => ({ ...prev, expiryDate: str }));
  }, [dateY, dateM, dateD]);

  const processedItems = useMemo(() => {
    const mergedMap = new Map();
    fridge.forEach(item => {
        if (!showFavoritesOnly && item.quantity <= 0) return;
        if (showFavoritesOnly && !item.isFavorite) return;
        const key = `${item.name}-${item.expiryDate}`;
        if (mergedMap.has(key)) {
            const existing = mergedMap.get(key);
            existing.quantity += item.quantity;
            existing.ids.push(item.id);
        } else {
            mergedMap.set(key, { ...item, ids: [item.id] });
        }
    });

    let items = Array.from(mergedMap.values());

    if (search) {
        const chosungSearch = getChosung(search);
        items = items.filter(item => {
            const itemChosung = getChosung(item.name);
            return item.name.includes(search) || itemChosung.includes(chosungSearch);
        });
    }

    if (filterCat !== 'ALL') {
        items = items.filter(item => item.category === filterCat);
    }

    return items.sort((a, b) => {
        if (sortType === 'EXPIRY') return (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999');
        return a.name.localeCompare(b.name);
    });
  }, [fridge, filterCat, search, sortType, showFavoritesOnly]);

  const groupedItems = useMemo(() => {
      if (filterCat !== 'ALL') return null;
      const groups: Record<string, any[]> = {};
      processedItems.forEach(item => {
          if (!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [processedItems, filterCat]);

  const filteredPredefined = useMemo(() => {
    let result = PREDEFINED_INGREDIENTS;
    if (modalCategory !== 'ALL') result = result.filter(item => item.category === modalCategory);
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
    setSelectedAddItems([]);
    setForm({ name: '', quantity: 1, unit: '개', expiryDate: today.toISOString().split('T')[0], category: 'VEGETABLE' });
    setModalSearch(''); setModalCategory('ALL'); setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    if (isEditMode) {
        item.ids.forEach((id: string) => toggleDeleteSelection(id));
        return;
    }
    setEditingItem({ ...item, id: item.ids[0] }); 
    setForm({ ...item, id: item.ids[0] }); 
    setSelectedAddItems([]);
    setIsModalOpen(true);
  };

  const toggleDeleteSelection = (id: string) => {
      const newSet = new Set(selectedDeleteIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedDeleteIds(newSet);
  };

  const handleBatchDelete = () => {
      if (confirm(`선택한 재료를 냉장고에서 비우시겠습니까?`)) {
          selectedDeleteIds.forEach(id => {
              const target = fridge.find(f => f.id === id);
              if (target?.isFavorite) updateIngredient(id, { quantity: 0 });
              else deleteIngredient(id);
          });
          setIsEditMode(false);
          setSelectedDeleteIds(new Set());
      }
  };

  const toggleAddItem = (item: any) => {
    const isSelected = selectedAddItems.some(i => i.name === item.name);
    let newSelection = [];
    if (isSelected) newSelection = selectedAddItems.filter(i => i.name !== item.name);
    else newSelection = [...selectedAddItems, item];
    setSelectedAddItems(newSelection);

    if (newSelection.length === 1) {
        const target = newSelection[0];
        const today = new Date();
        const expiry = new Date(today.setDate(today.getDate() + (target.defaultExpiryDays || 7)));
        setForm({ ...form, name: target.name, category: target.category, unit: target.defaultUnit || '개', expiryDate: expiry.toISOString().split('T')[0] });
    } else {
        setForm(prev => ({ ...prev, name: '' }));
    }
  };

  const handleSave = () => {
    if (editingItem) {
        const oldIds = fridge.filter(f => f.name === editingItem.name && f.expiryDate === editingItem.expiryDate && f.id !== editingItem.id).map(f => f.id);
        oldIds.forEach(id => deleteIngredient(id));
        const predefinedInfo = PREDEFINED_INGREDIENTS.find(p => p.name === form.name);
        const icon = predefinedInfo?.icon || '📦';
        updateIngredient(editingItem.id, { ...form, image: icon });
        setIsModalOpen(false);
        return;
    }

    if (selectedAddItems.length > 1) {
        if (!confirm(`${selectedAddItems.length}개의 재료를 일괄 등록하시겠습니까?\n(기본 수량 1개)`)) return;
        selectedAddItems.forEach(item => {
            const today = new Date();
            const expiry = new Date(today.setDate(today.getDate() + (item.defaultExpiryDays || 7)));
            addIngredient({
                id: Date.now().toString() + Math.random(),
                name: item.name, category: item.category, quantity: 1, unit: item.defaultUnit || '개',
                expiryDate: expiry.toISOString().split('T')[0], image: item.icon || '📦', storage: item.defaultStorage || 'FRIDGE', isFavorite: false
            } as any);
        });
        setIsModalOpen(false);
        return;
    }

    if (!form.name) return alert('재료를 선택하거나 이름을 입력해주세요');
    const predefinedInfo = PREDEFINED_INGREDIENTS.find(p => p.name === form.name);
    const icon = predefinedInfo?.icon || '📦';
    addIngredient({ ...form, id: Date.now().toString(), image: icon, storage: predefinedInfo?.defaultStorage || 'FRIDGE', isFavorite: false } as any);
    setIsModalOpen(false);
  };

  const toggleFridgeFavorite = (item: any) => {
      item.ids.forEach((id: string) => {
          updateIngredient(id, { isFavorite: !item.isFavorite });
      });
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // 재료 카드 렌더링
  const renderItemCard = (item: any) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0,0,0,0);
      const diffTime = expiry.getTime() - today.getTime();
      const dday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const isExpired = dday < 0;
      const isUrgent = dday >= 0 && dday <= 3;
      const formattedDate = item.expiryDate.replace(/-/g, '.'); // 2024.03.01 형식

      return (
        <div 
            key={item.id}
            onClick={() => handleOpenEdit(item)} 
            // 🌟 4. [디자인] 높이를 고정하지 않고 최소 높이(min-h)로 설정하여 글자가 길어지면 늘어나게 함
            className={`bg-white p-2.5 rounded-xl border flex flex-col items-center justify-between cursor-pointer active:scale-[0.98] transition-all text-center relative min-h-[10rem] ${item.isFavorite ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'} ${isEditMode && selectedDeleteIds.has(item.id) ? 'ring-2 ring-[#FF6B6B] bg-red-50' : ''}`}
        >
          {isEditMode && (
              <div className="absolute top-2 left-2 z-10 bg-white rounded-md">
                  {item.ids.some((id: string) => selectedDeleteIds.has(id)) ? <CheckSquare className="text-[#FF6B6B] fill-white" size={20}/> : <Square className="text-gray-300" size={20}/>}
              </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); toggleFridgeFavorite(item); }} className="absolute top-2 right-2 text-gray-300 hover:text-[#FF6B6B] z-10">
             <Heart size={16} className={item.isFavorite ? "fill-[#FF6B6B] text-[#FF6B6B]" : ""} />
          </button>

          <div className="text-4xl mb-1 mt-4">{item.image || '📦'}</div>
          
          <div className="w-full flex flex-col items-center">
             {/* 🌟 1. [디자인] 이름: 줄바꿈 허용 (line-clamp-2 사용) */}
             <div className="font-bold text-sm text-gray-800 px-1 mb-1 leading-tight line-clamp-2 h-9 flex items-center justify-center break-keep">
                 {item.name}
             </div>
             
             <div className={`text-xs font-bold mb-2 ${item.quantity === 0 ? 'text-gray-400' : 'text-[#FF6B6B]'}`}>
                {item.quantity > 0 ? item.quantity : '품절'}
                <span className="text-[10px] text-gray-400 font-normal ml-0.5">{item.unit}</span>
             </div>
             
             {/* 🌟 2 & 3. [디자인] 소비기한: 날짜 위, D-day 아래 (2줄 표기) */}
             {item.quantity > 0 && (
                 <div className="w-full bg-gray-50 rounded-lg py-1.5 px-1 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[10px] text-gray-400 font-medium tracking-tighter">{formattedDate}</span>
                    <span className={`text-[11px] font-extrabold ${isExpired ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-gray-600'}`}>
                        {isExpired ? `만료(+${Math.abs(dday)})` : dday === 0 ? '오늘까지' : `D-${dday}`}
                    </span>
                 </div>
             )}
          </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-5 pt-6 pb-24">
      <div className="mb-4 flex justify-between items-end">
         <h2 className="text-xl font-bold text-gray-800">나의 냉장고 <span className="text-[#FF6B6B]">{fridge.filter(i=>i.quantity>0).length}</span></h2>
         <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${showFavoritesOnly ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white text-gray-500 border-gray-200'}`}>
            <Heart size={12} className={showFavoritesOnly ? "fill-white" : ""}/> 찜한 재료만
         </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
           {isEditMode ? (
               <button onClick={() => { setIsEditMode(false); setSelectedDeleteIds(new Set()); }} className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm shrink-0">완료</button>
           ) : (
               <button onClick={() => setIsEditMode(true)} className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 font-bold shrink-0">편집</button>
           )}
           <button onClick={() => setSortType(sortType === 'EXPIRY' ? 'NAME' : 'EXPIRY')} className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 font-bold flex items-center gap-1 shrink-0"><ArrowUpDown size={14} /> {sortType === 'EXPIRY' ? '유통기한순' : '가나다순'}</button>
           <button onClick={handleOpenAdd} className="bg-[#FF6B6B] text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 shrink-0 ml-auto"><Plus size={16} /> 재료 추가</button>
      </div>

      <div className="bg-white p-1 rounded-xl border border-gray-100 mb-4 flex overflow-x-auto no-scrollbar sticky top-[60px] z-20 shadow-sm">
        <button onClick={() => setFilterCat('ALL')} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filterCat === 'ALL' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>전체</button>
        {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filterCat === cat.id ? 'bg-[#FF6B6B] text-white' : 'text-gray-500'}`}>{cat.label}</button>
        ))}
      </div>

      <div className="space-y-6">
        {groupedItems ? (
            Object.entries(groupedItems).map(([catId, items]) => (
                <div key={catId}>
                    <div className="flex items-center gap-2 mb-3 px-1 mt-2 border-b border-dashed border-gray-200 pb-2">
                        <span className="text-lg">{CATEGORIES.find(c=>c.id===catId)?.icon}</span>
                        <h3 className="font-bold text-gray-700 text-sm">{CATEGORY_LABELS[catId]}</h3>
                        <span className="text-xs text-gray-400 count-badge bg-gray-100 px-1.5 rounded-md">{items.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {items.map(renderItemCard)}
                    </div>
                </div>
            ))
        ) : (
            <div className="grid grid-cols-3 gap-2">
                {processedItems.map(renderItemCard)}
            </div>
        )}
        
        {processedItems.length === 0 && <div className="text-center py-20 text-gray-300 text-sm">냉장고가 비었어요 텅~ 🌬️</div>}
      </div>

      {isEditMode && selectedDeleteIds.size > 0 && (
          <div className="fixed bottom-24 left-0 right-0 px-5 z-40 animate-slide-up">
              <button onClick={handleBatchDelete} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                  <Trash2 size={18}/> {selectedDeleteIds.size}개 비우기
              </button>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up h-[85vh] flex flex-col">
             <div className="flex justify-between items-center mb-4 shrink-0">
               <h3 className="text-lg font-bold">{editingItem ? '재료 수정' : selectedAddItems.length > 1 ? '일괄 등록' : '새 재료 추가'}</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400"/></button>
             </div>
             <div className="flex-1 overflow-y-auto pr-1">
                {!editingItem && (
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-6">
                    <label className="text-sm font-bold text-[#FF6B6B] block mb-3 flex items-center gap-1"><Search size={14}/> 어떤 재료를 넣을까요?</label>
                    <input value={modalSearch} onChange={e => setModalSearch(e.target.value)} placeholder="재료명 검색 (예: 계란)" className="w-full border p-3 rounded-xl bg-white text-sm mb-3 focus:border-[#FF6B6B] outline-none shadow-sm" />
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                      <button onClick={() => setModalCategory('ALL')} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border ${modalCategory === 'ALL' ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white text-gray-500 border-gray-200'}`}>전체</button>
                      {CATEGORIES.map(c => <button key={c.id} onClick={() => setModalCategory(c.id)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border ${modalCategory === c.id ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-white text-gray-500 border-gray-200'}`}>{c.label}</button>)}
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {filteredPredefined.map(p => {
                        const isSelected = selectedAddItems.some(i => i.name === p.name);
                        return (
                            <button key={p.name} onClick={() => toggleAddItem(p)} className={`flex flex-col items-center justify-center border rounded-xl p-2 transition-all relative ${isSelected ? 'bg-orange-100 border-[#FF6B6B] ring-1 ring-[#FF6B6B]' : 'bg-white border-orange-100 hover:border-orange-300'}`}>
                                {isSelected && <div className="absolute top-1 right-1 bg-[#FF6B6B] rounded-full w-3 h-3 flex items-center justify-center"><Check size={8} className="text-white"/></div>}
                                <span className="text-2xl mb-1">{p.icon}</span>
                                <span className="text-[10px] text-gray-700 font-bold truncate w-full text-center">{p.name}</span>
                            </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedAddItems.length > 1 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-4">✨</div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">{selectedAddItems.length}개 재료 선택됨</h4>
                        <p className="text-sm text-gray-500">기본 수량 1개 및 추천 유통기한으로<br/>일괄 등록됩니다.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                    {(form.name || editingItem) && <div className="text-center pb-2 border-b border-gray-100"><span className="text-2xl font-black text-gray-800">{form.name}</span></div>}
                    <div className="flex gap-3">
                        <div className="flex-1"><label className="text-xs font-bold text-gray-400 mb-1.5 block">수량</label><input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full border p-3 rounded-xl bg-gray-50 font-bold text-lg text-center focus:bg-white focus:border-[#FF6B6B] outline-none"/></div>
                        <div className="w-28"><label className="text-xs font-bold text-gray-400 mb-1.5 block">단위</label><div className="relative"><select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50 h-[54px] appearance-none font-bold text-gray-700 text-center focus:bg-white focus:border-[#FF6B6B] outline-none">{INGREDIENT_UNITS.map(u => <option key={u}>{u}</option>)}</select><ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div></div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-1.5 block">유통기한</label>
                        <div className="flex gap-2">
                        <div className="relative flex-1"><select value={dateY} onChange={e => setDateY(Number(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 appearance-none font-bold text-center focus:bg-white focus:border-[#FF6B6B] outline-none">{years.map(y => <option key={y} value={y}>{y}년</option>)}</select></div>
                        <div className="relative w-20"><select value={dateM} onChange={e => setDateM(Number(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 appearance-none font-bold text-center focus:bg-white focus:border-[#FF6B6B] outline-none">{months.map(m => <option key={m} value={m}>{m}월</option>)}</select></div>
                        <div className="relative w-20"><select value={dateD} onChange={e => setDateD(Number(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 appearance-none font-bold text-center focus:bg-white focus:border-[#FF6B6B] outline-none">{days.map(d => <option key={d} value={d}>{d}일</option>)}</select></div>
                        </div>
                    </div>
                    </div>
                )}
             </div>
             <button onClick={handleSave} className="w-full bg-[#FF6B6B] text-white py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-orange-200 hover:bg-[#FF5252] transition-colors shrink-0 text-lg">
                 {editingItem ? '수정 완료' : selectedAddItems.length > 1 ? `${selectedAddItems.length}개 일괄 등록` : '냉장고에 넣기'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FridgePage;
