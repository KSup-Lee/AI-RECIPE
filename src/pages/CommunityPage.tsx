import React, { useState, useEffect } from 'react';
import { Edit3, Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [form, setForm] = useState({ content: '', image: '', title: '' });

  useEffect(() => {
    // 좋아요 순 정렬 (인기글 상단)
    const q = query(collection(db, 'community_posts'), orderBy('likes', 'desc'));
    return onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const handleWrite = async () => {
    if (!form.content) return;
    await addDoc(collection(db, 'community_posts'), {
      ...form, author: user?.name || '익명', uid: user?.id, likes: 0, createdAt: new Date()
    });
    setForm({ content: '', image: '', title: '' });
    setIsWriting(false);
  };

  const handleLike = async (post: any) => {
    await updateDoc(doc(db, 'community_posts', post.id), { likes: (post.likes || 0) + 1 });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-5 pt-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">커뮤니티</h2>
        <button onClick={() => setIsWriting(true)} className="bg-[#FF6B6B] text-white px-4 py-2 rounded-full font-bold text-sm shadow-md flex items-center gap-2">
          <Edit3 size={16} /> 글쓰기
        </button>
      </div>

      {isWriting && (
        <div className="bg-white p-4 rounded-2xl shadow-md mb-6 animate-slide-up">
           <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="제목" className="w-full border-b p-2 mb-2 outline-none font-bold"/>
           <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="어떤 요리를 하셨나요?" className="w-full h-24 p-2 resize-none outline-none text-sm"/>
           <input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="이미지 URL (선택)" className="w-full bg-gray-50 p-2 rounded text-xs mb-3"/>
           <div className="flex gap-2">
             <button onClick={() => setIsWriting(false)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm">취소</button>
             <button onClick={handleWrite} className="flex-1 bg-[#FF6B6B] text-white py-2 rounded-lg text-sm font-bold">등록</button>
           </div>
        </div>
      )}

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {/* 블로그형 큰 이미지 */}
            {post.image && (
              <div className="h-48 bg-gray-100">
                <img src={post.image} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{post.title || '제목 없음'}</h3>
                 {user?.id === post.uid && <button onClick={() => deleteDoc(doc(db, 'community_posts', post.id))}><MoreHorizontal size={16} className="text-gray-400"/></button>}
               </div>
               <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{post.content}</p>
               
               <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{post.author}</span>
                  <div className="flex gap-4 text-gray-400 text-sm">
                    <button onClick={() => handleLike(post)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <Heart size={16} className={post.likes > 0 ? "fill-red-500 text-red-500" : ""}/> {post.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500">
                      <MessageCircle size={16}/> 0
                    </button>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
