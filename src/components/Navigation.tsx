import React from 'react';
import { Home, Refrigerator, Utensils, User, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();

  const handleNav = (tab: string, path: string) => {
    onTabChange(tab);
    navigate(path);
  };

  const getIconColor = (tabName: string) => {
    // 활성화되면 진한 코랄색, 아니면 연한 회색
    return activeTab === tabName ? "text-[#FF6B6B]" : "text-gray-300";
  };

  const getTextColor = (tabName: string) => {
    return activeTab === tabName ? "text-[#FF6B6B] font-bold" : "text-gray-400";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-center z-40 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <button onClick={() => handleNav('HOME', '/')} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
        <Home className={`w-6 h-6 ${getIconColor('HOME')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('HOME')}`}>홈</span>
      </button>

      <button onClick={() => handleNav('FRIDGE', '/fridge')} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
        <Refrigerator className={`w-6 h-6 ${getIconColor('FRIDGE')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('FRIDGE')}`}>냉장고</span>
      </button>

      {/* 중앙 메인 버튼 (귀여운 냄비 모양) */}
      <div className="relative -top-5">
        <button 
          onClick={() => handleNav('RECIPE', '/recipes')}
          className="bg-[#FF6B6B] p-4 rounded-full shadow-lg text-white transform transition-transform hover:scale-105 active:scale-95 border-4 border-white"
        >
          <Utensils className="w-6 h-6" />
        </button>
      </div>

      <button onClick={() => handleNav('COMMUNITY', '/community')} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
        <Heart className={`w-6 h-6 ${getIconColor('COMMUNITY')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('COMMUNITY')}`}>찜</span>
      </button>

      <button onClick={() => handleNav('MYPAGE', '/mypage')} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
        <User className={`w-6 h-6 ${getIconColor('MYPAGE')}`} strokeWidth={2.5} />
        <span className={`text-[10px] ${getTextColor('MYPAGE')}`}>마이</span>
      </button>
    </nav>
  );
};

export default Navigation;
