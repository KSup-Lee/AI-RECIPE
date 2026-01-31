import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Trash2, ShoppingBag } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const ShoppingPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'shopping_list'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const addItem = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, 'shopping_list'), { text: input, completed: false, createdAt: new Date() });
    setInput('');
  };

  const toggle = async (id: string, val: boolean) => await updateDoc(doc(db, 'shopping_list', id), { completed: !val });
  const del = async (id: string) => await deleteDoc(doc(db, 'shopping_list', id));

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-5 pt-6 pb-24">
      <h2 className="text-xl font-bold mb-4">장보기 메모 🛒</h2>
      
      <div className="flex gap-2 mb-6">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="살 것을 입력하세요"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#2E7D32]"
          onKeyPress={e => e.key === 'Enter' && addItem()}
        />
        <button onClick={addItem} className="bg-[#2E7D32] text-white p-3 rounded-xl"><Plus /></button>
      </div>

      <div className="space-y-3 mb-10">
        {items.map(item => (
          <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border ${item.completed ? 'bg-gray-100' : 'bg-white'}`}>
            <button onClick={() => toggle(item.id, item.completed)} className="flex items-center gap-3 flex-1">
              {item.completed ? <CheckSquare className="text-gray-400"/> : <Square className="text-[#2E7D32]"/>}
              <span className={item.completed ? 'text-gray-400 line-through' : ''}>{item.text}</span>
            </button>
            <button onClick={() => del(item.id)} className="text-gray-300"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>

      {/* 10. 쿠팡 파트너스 수익화 영역 (예시) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="text-blue-500" size={20} />
          <h3 className="font-bold text-gray-800">최저가로 구매하기</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">지금 담은 재료들, 로켓배송으로 내일 아침에 받아보세요!</p>
        <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
          쿠팡에서 최저가 검색하기 &gt;
        </button>
        <p className="text-[10px] text-gray-300 text-center mt-2">이 포스팅은 쿠팡 파트너스 활동의 일환으로,<br/>이에 따른 일정액의 수수료를 제공받습니다.</p>
      </div>
    </div>
  );
};

export default ShoppingPage;
