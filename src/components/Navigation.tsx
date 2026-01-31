import React from 'react';
import { Home, Calendar, Utensils, Refrigerator, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const NAV_ITEMS = [
    { id: 'MEAL', label: '식단', icon: Calendar, path: '/mealplan' },
    { id: 'RECIPE', label: '레시피', icon: Utensils, path: '/recipes' },
    { id: 'HOME', label: '홈', icon: Home, path: '/', isMain: true }, // 홈을 가운데로
    { id: 'FRIDGE', label: '냉장고', icon: Refrigerator, path: '/fridge' },
    { id: 'MY', label: '마이', icon: User, path: '/mypage' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-4 py-2 pb-6 flex justify-between items-end z-50">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        
        if (item.isMain) {
          return (
            <button key={item.id} onClick={() => navigate(item.path)} className="relative -top-5">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-transform active:scale-95 ${isActive ? 'bg-[#2E7D32] text-white' : 'bg-gray-100 text-gray-400'}`}>
                 <item.icon size={24} />
               </div>
            </button>
          );
        }

        return (
          <button 
            key={item.id} 
            onClick={() => navigate(item.path)} 
            className={`flex flex-col items-center gap-1 w-14 transition-colors ${isActive ? 'text-[#2E7D32]' : 'text-gray-300'}`}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
