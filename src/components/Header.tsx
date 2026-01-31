import React from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 검색창을 클릭하면 '레시피 페이지'로 이동하게 설정
  const handleSearchClick = () => {
    if (location.pathname !== '/recipes') {
      navigate('/recipes');
    }
  };

  return (
    <div className="sticky top-0 bg-[#FFFDF9] z-50 px-5 pt-6 pb-2">
      {/* 1. 로고 & 장바구니 */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-black text-[#FF6B6B] tracking-tighter flex items-center gap-2" style={{ fontFamily: 'sans-serif' }}>
          MealZip <span className="text-sm font-normal text-gray-400">오늘 뭐 먹지?</span>
        </h1>
        <button onClick={() => navigate('/shopping')} className="p-2 text-gray-400 hover:text-[#FF6B6B] transition-colors">
          <ShoppingCart className="w-6 h-6" />
        </button>
      </div>

      {/* 2. 검색창 (누르면 레시피 탭으로 이동) */}
      <div className="relative mb-2" onClick={handleSearchClick}>
        <div className="w-full bg-white border-2 border-[#FFE0B2] rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-400 shadow-sm cursor-text">
          요리 이름이나 재료를 검색해보세요
        </div>
        <Search className="absolute left-4 top-3.5 text-[#FFB74D] w-5 h-5" />
      </div>
    </div>
  );
};

export default Header;
