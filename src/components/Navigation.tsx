import React, { useEffect, useState } from 'react';
import { Home, Refrigerator, Utensils, User, ShoppingCart } from 'lucide-react'; // ShoppingCart 아이콘 추가
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('HOME');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveTab('HOME');
    else if (path === '/fridge') setActiveTab('FRIDGE');
    else if (path.includes('/recipes')) setActiveTab('RECIPE');
    else if (path === '/shopping') setActiveTab('SHOPPING'); // 장보기 탭 연결
    else if (path === '/mypage') setActiveTab('MYPAGE');
  }, [location]);

  const handleNav = (path: string) => navigate(path);

  const getIconColor = (tabName: string) => activeTab === tabName ? "text-[#FF6B6B]" : "text-gray-300";
  const getTextColor = (tabName: string) => activeTab === tabName ? "text-[#FF6B6B] font-bold" : "text-gray-400";

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-center z-40 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <button onClick={() => handleNav('/')} className="flex flex-col items-center gap-1">
        <Home className={`w-6 h-6 ${getIconColor('HOME')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('HOME')}`}>홈</span>
      </button>

      <button onClick={() => handleNav('/fridge')} className="flex flex-col items-center gap-1">
        <Refrigerator className={`w-6 h-6 ${getIconColor('FRIDGE')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('FRIDGE')}`}>냉장고</span>
      </button>

      <div className="relative -top-5">
        <button onClick={() => handleNav('/recipes')} className="bg-[#FF6B6B] p-4 rounded-full shadow-lg text-white border-4 border-white hover:scale-105 transition-transform">
          <Utensils className="w-6 h-6" />
        </button>
      </div>

      {/* 👇 찜(Heart) 대신 장보기(ShoppingCart)로 변경 */}
      <button onClick={() => handleNav('/shopping')} className="flex flex-col items-center gap-1">
        <ShoppingCart className={`w-6 h-6 ${getIconColor('SHOPPING')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('SHOPPING')}`}>장보기</span>
      </button>

      <button onClick={() => handleNav('/mypage')} className="flex flex-col items-center gap-1">
        <User className={`w-6 h-6 ${getIconColor('MYPAGE')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('MYPAGE')}`}>마이</span>
      </button>
    </nav>
  );
};

export default Navigation;
