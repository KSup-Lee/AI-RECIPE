import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');

  // 레시피 페이지에 있을 때만 URL의 검색어(q=...)를 입력창에 표시
  useEffect(() => {
    if (location.pathname === '/recipes') {
      setKeyword(searchParams.get('q') || '');
    } else {
      setKeyword(''); // 다른 페이지 가면 검색창 비우기
    }
  }, [location, searchParams]);

  // 검색어 입력 시 작동
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    
    // 검색어를 입력하면 무조건 레시피 페이지로 이동시키며 검색어 전달
    navigate(`/recipes?q=${val}`);
  };

  return (
    <div className="sticky top-0 bg-[#FFFDF9] z-50 px-5 pt-6 pb-2 border-b border-gray-100/50">
      <div className="flex items-center justify-between gap-3 mb-1">
        
        {/* 1. 로고 (클릭 시 홈으로) */}
        <button onClick={() => navigate('/')} className="shrink-0">
          <h1 className="text-xl font-black text-[#FF6B6B] tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
            MealZip
          </h1>
        </button>

        {/* 2. 검색창 (어디서든 검색 가능!) */}
        <div className="relative flex-1">
          <input 
            type="text" 
            value={keyword}
            onChange={handleSearch}
            placeholder="요리나 재료 검색"
            className="w-full bg-white border-2 border-[#FFE0B2] rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#FF6B6B] shadow-sm transition-all"
          />
          <Search className="absolute left-3 top-2.5 text-[#FFB74D] w-4 h-4" />
        </div>

        {/* 3. 장바구니 */}
        <button onClick={() => navigate('/shopping')} className="p-1 text-gray-400 hover:text-[#FF6B6B] transition-colors shrink-0">
          <ShoppingCart className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Header;
