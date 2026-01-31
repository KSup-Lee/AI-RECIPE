import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ShoppingPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [input, setInput] = useState('');

  // 실시간 데이터 연동
  useEffect(() => {
    const q = query(collection(db, 'shopping_list'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const addItem = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, 'shopping_list'), {
      text: input,
      completed: false,
      createdAt: new Date()
    });
    setInput('');
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'shopping_list', id), { completed: !currentStatus });
  };

  const deleteItem = async (id: string) => {
    if (confirm('삭제하시겠습니까?')) await deleteDoc(doc(db, 'shopping_list', id));
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] px-5 pt-6 pb-24">
      <h1 className="text-2xl font-black text-[#FF6B6B] mb-6">🛒 장보기 목록</h1>

      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="살 물건을 입력하세요 (예: 우유)"
          className="flex-1 border-2 border-[#FFE0B2] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B6B]"
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
        />
        <button onClick={addItem} className="bg-[#FF6B6B] text-white p-3 rounded-xl hover:bg-[#FF5252]">
          <Plus />
        </button>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border ${item.completed ? 'bg-gray-100 border-gray-200' : 'bg-white border-[#FFE0B2]'}`}>
            <button onClick={() => toggleComplete(item.id, item.completed)} className="flex items-center gap-3 flex-1">
              {item.completed ? <CheckSquare className="text-gray-400" /> : <Square className="text-[#FF6B6B]" />}
              <span className={`text-lg ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.text}</span>
            </button>
            <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-gray-400 py-10">장바구니가 비어있어요!</div>}
      </div>
    </div>
  );
};

export default ShoppingPage;
