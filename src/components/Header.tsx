import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Bell } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');

  // 탭 메뉴 리스트
  const MENU_ITEMS = [
    { label: '홈', path: '/' },
    { label: '식단', path: '/mealplan' },
    { label: '레시피', path: '/recipes' },
    { label: '냉장고', path: '/fridge' },
    { label: '장보기', path: '/shopping' },
    { label: '커뮤니티', path: '/community' },
  ];

  useEffect(() => {
    if (location.pathname === '/recipes') {
      setKeyword(searchParams.get('q') || '');
    } else {
      setKeyword('');
    }
  }, [location, searchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    if (location.pathname !== '/recipes') navigate('/recipes');
    navigate(`/recipes?q=${val}`);
  };

  return (
    <div className="sticky top-0 bg-white z-50 border-b border-gray-100">
      {/* 1. 로고 & 검색 & 아이콘 */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <h1 onClick={() => navigate('/')} className="text-xl font-black text-[#2E7D32] tracking-tighter cursor-pointer shrink-0">
          MealZip
        </h1>
        
        <div className="relative flex-1">
          <input 
            type="text" 
            value={keyword}
            onChange={handleSearch}
            placeholder="요리, 재료 검색"
            className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#2E7D32]"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        </div>

        <div className="flex gap-1">
           <button onClick={() => navigate('/shopping')} className="p-2 text-gray-400 hover:text-[#2E7D32]"><ShoppingCart className="w-6 h-6" /></button>
        </div>
      </div>

      {/* 2. 가로 스크롤 메뉴 (Req 1) */}
      <div className="flex px-4 overflow-x-auto no-scrollbar gap-6 pb-2">
        {MENU_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`whitespace-nowrap pb-1 text-sm font-bold transition-all ${
                isActive ? 'text-[#2E7D32] border-b-2 border-[#2E7D32]' : 'text-gray-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
