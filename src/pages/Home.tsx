import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudSun, Calendar, ChevronRight, MessageCircle, Heart } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { DUMMY_RECIPES } from '../constants'; // 더미 데이터 활용

const Home = () => {
  const navigate = useNavigate();
  const [userName] = useState('사용자');
  const [posts, setPosts] = useState<any[]>([]);

  // 커뮤니티 글 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(3));
        const snap = await getDocs(q);
        setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.log(e); }
    };
    fetchPosts();
  }, []);

  // 무드보드 이미지 (예시)
  const MOOD_IMAGES = [
    { id: 1, src: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80', title: '건강한 아침 식탁' },
    { id: 2, src: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', title: '활력 넘치는 점심' },
    { id: 3, src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', title: '가벼운 저녁 샐러드' },
  ];

  // 추천 로직 (간단 구현)
  const todayRecipe = DUMMY_RECIPES[0]; // 실제로는 AI 로직 적용

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-24">
      
      {/* 2, 3. 가로 스크롤 무드보드 */}
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-64 bg-gray-100">
        {MOOD_IMAGES.map((img) => (
          <div key={img.id} className="snap-center shrink-0 w-full relative">
            <img src={img.src} className="w-full h-full object-cover" alt={img.title} />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-20">
              <h2 className="text-white text-2xl font-bold">{img.title}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 -mt-6 relative z-10">
        
        {/* 4. 오늘 뭐 먹지? 추천 기능 */}
        <div className="bg-white rounded-2xl p-5 shadow-lg mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <CloudSun size={14} /> 맑음 • <Calendar size={14} /> 금요일
              </p>
              <h3 className="text-xl font-bold text-gray-800">
                <span className="text-[#2E7D32]">{userName}</span>님을 위한<br/>오늘의 추천 메뉴 🍽️
              </h3>
            </div>
            <button onClick={() => navigate('/recipes')} className="bg-[#f1f3f5] p-2 rounded-full">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
          
          <div onClick={() => navigate('/recipes')} className="flex gap-4 items-center cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
            <img src={todayRecipe.image} className="w-20 h-20 rounded-xl object-cover" alt="추천" />
            <div>
              <span className="text-xs font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded">AI 분석</span>
              <h4 className="font-bold text-lg mt-1">{todayRecipe.name}</h4>
              <p className="text-xs text-gray-500 line-clamp-1">{todayRecipe.description}</p>
            </div>
          </div>
        </div>

        {/* 5. 커뮤니티 미리보기 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">실시간 커뮤니티 🔥</h3>
            <button onClick={() => navigate('/community')} className="text-xs text-gray-400">더보기</button>
          </div>
          <div className="space-y-3">
            {posts.length > 0 ? posts.map(post => (
              <div key={post.id} onClick={() => navigate('/community')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer">
                <p className="text-sm text-gray-800 line-clamp-2 mb-2">{post.content}</p>
                <div className="flex gap-3 text-xs text-gray-400">
                   <span className="flex items-center gap-1"><Heart size={12}/> {post.likes || 0}</span>
                   <span className="flex items-center gap-1"><MessageCircle size={12}/> 0</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-gray-400 text-sm bg-white rounded-xl">아직 게시글이 없어요.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
