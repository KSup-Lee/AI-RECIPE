import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudSun, Calendar, ChevronRight, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [recommendedRecipe, setRecommendedRecipe] = useState<any>(null);

  // 날짜 계산 (오늘 날짜)
  const today = new Date();
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];
  const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  useEffect(() => {
    const fetchData = async () => {
      // 1. 커뮤니티 인기글
      const q = query(collection(db, 'community_posts'), orderBy('likes', 'desc'), limit(3));
      const postSnap = await getDocs(q);
      setPosts(postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 2. AI 추천 (DB에서 랜덤 1개)
      const recipeSnap = await getDocs(collection(db, 'recipes'));
      if (!recipeSnap.empty) {
        const recipes = recipeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const random = recipes[Math.floor(Math.random() * recipes.length)];
        setRecommendedRecipe(random);
      }
    };
    fetchData();
  }, []);

  const MOOD_IMAGES = [
    { id: 1, src: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80', title: '건강한 아침' },
    { id: 2, src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', title: '든든한 점심' },
    { id: 3, src: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80', title: '가벼운 저녁' },
  ];

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-24">
      {/* 무드보드 */}
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-64 bg-gray-200">
        {MOOD_IMAGES.map((img) => (
          <div key={img.id} className="snap-center shrink-0 w-full relative">
            <img src={img.src} className="w-full h-full object-cover" alt={img.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <h2 className="text-white text-2xl font-bold mb-4">{img.title}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 -mt-6 relative z-10">
        {/* 오늘 뭐 먹지? AI 추천 */}
        <div className="bg-white rounded-2xl p-5 shadow-lg mb-6 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1 font-bold">
                <CloudSun size={14} className="text-orange-400" /> 맑음 • <Calendar size={14} className="text-blue-400" /> {dateString} {dayName}요일
              </p>
              <h3 className="text-xl font-bold text-gray-800">
                <span className="text-[#FF6B6B]">{user?.name || '사용자'}</span>님을 위한<br/>오늘의 추천 메뉴 🍽️
              </h3>
            </div>
            <button onClick={() => navigate('/recipes')} className="bg-orange-50 p-2 rounded-full text-[#FF6B6B]">
              <ChevronRight size={20} />
            </button>
          </div>
          
          {recommendedRecipe ? (
            <div onClick={() => navigate(`/recipes?q=${recommendedRecipe.name}`)} className="flex gap-4 items-center cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors border border-gray-100">
              <img src={recommendedRecipe.image} className="w-20 h-20 rounded-xl object-cover shrink-0" alt="추천" />
              <div>
                <div className="flex gap-1 mb-1">
                   <span className="text-[10px] font-bold text-white bg-[#FF6B6B] px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles size={10}/> AI Pick</span>
                </div>
                <h4 className="font-bold text-lg text-gray-800 line-clamp-1">{recommendedRecipe.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-1">{recommendedRecipe.description}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">추천 레시피를 불러오는 중...</div>
          )}
        </div>

        {/* 커뮤니티 인기글 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg flex items-center gap-1">🔥 지금 뜨는 이야기</h3>
            <button onClick={() => navigate('/community')} className="text-xs text-gray-400">더보기</button>
          </div>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} onClick={() => navigate('/community')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer flex gap-4">
                 {post.image && <img src={post.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />}
                 <div className="flex-1">
                    <p className="text-sm text-gray-800 font-bold line-clamp-1 mb-1">{post.title || post.content}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{post.content}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Heart size={12} className="text-red-400"/> {post.likes || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12}/> 0</span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
