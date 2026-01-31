import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Heart, MessageCircle } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const CommunityPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleWrite = async () => {
    if (!newContent.trim()) return;
    await addDoc(collection(db, 'community_posts'), {
      content: newContent,
      author: '익명', // 나중에 유저 닉네임으로 변경 가능
      likes: 0,
      createdAt: new Date()
    });
    setNewContent('');
    setIsWriting(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] px-5 pt-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-[#FF6B6B]">🗣️ 커뮤니티</h1>
        <button onClick={() => setIsWriting(!isWriting)} className="bg-[#FF6B6B] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
          <Edit3 className="w-4 h-4" /> 글쓰기
        </button>
      </div>

      {isWriting && (
        <div className="bg-white p-4 rounded-2xl shadow-md mb-6 border border-[#FFE0B2]">
          <textarea 
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="오늘 무슨 요리를 하셨나요? 이야기를 들려주세요!"
            className="w-full h-24 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#FF6B6B] mb-2"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsWriting(false)} className="text-gray-400 text-sm px-3 py-1">취소</button>
            <button onClick={handleWrite} className="bg-[#FF6B6B] text-white px-4 py-1.5 rounded-lg text-sm font-bold">등록</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex justify-between items-center text-gray-400 text-sm">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 0</span>
              </div>
              <button onClick={() => deleteDoc(doc(db, 'community_posts', post.id))} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="text-center text-gray-400 py-20">첫 번째 글을 남겨보세요!</div>}
      </div>
    </div>
  );
};

export default CommunityPage;
