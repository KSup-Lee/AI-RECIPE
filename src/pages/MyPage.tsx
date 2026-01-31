import React, { useState } from 'react';
import { User, Settings, Heart, FileText, ShoppingBag, HelpCircle, ChevronRight, Users, Plus } from 'lucide-react';
import { useAuth, useData } from '../App';

const MyPage = () => {
  const { user, logout } = useAuth();
  const { members, addMember, deleteMember } = useData(); // App.tsx의 DataContext 사용
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = () => {
    if (newMemberName) {
      addMember({ 
        id: Date.now().toString(), name: newMemberName, 
        gender: 'M', birthDate: '2020-01-01', avatarColor: 'bg-blue-100', 
        relationship: 'FAMILY', hasNoAllergy: true, allergies: [], hasNoDisease: true, diseases: [], proteinFocus: false, quickOnly: false, likes: [], dislikes: [], targetCalories: 2000 
      });
      setNewMemberName('');
      setShowMemberForm(false);
    }
  };

  const MENU_LIST = [
    { icon: Heart, label: '찜한 레시피' },
    { icon: FileText, label: '내가 쓴 글' },
    { icon: ShoppingBag, label: '구매 내역' },
    { icon: HelpCircle, label: '고객센터' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* 상단 프로필 */}
      <div className="bg-white p-6 pt-10 mb-2">
        <div className="flex items-center gap-4 mb-6">
          <img src={user?.avatar} className="w-16 h-16 rounded-full bg-gray-200" alt="프로필" />
          <div>
            <h2 className="text-xl font-bold">{user?.name || '사용자'}님</h2>
            <p className="text-sm text-gray-500">{user?.username}</p>
          </div>
          <button onClick={logout} className="ml-auto text-xs border px-3 py-1 rounded-full text-gray-500">로그아웃</button>
        </div>

        {/* 11. 구성원 관리 복구 */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold flex items-center gap-2"><Users size={16}/> 우리 가족 구성원</h3>
            <button onClick={() => setShowMemberForm(!showMemberForm)} className="text-xs text-[#2E7D32] font-bold">+ 추가</button>
          </div>
          
          {showMemberForm && (
            <div className="flex gap-2 mb-3">
              <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="이름 입력" className="border p-1 text-sm rounded flex-1" />
              <button onClick={handleAddMember} className="bg-[#2E7D32] text-white px-3 rounded text-sm">확인</button>
            </div>
          )}

          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {members.map(member => (
              <div key={member.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className={`w-10 h-10 rounded-full ${member.avatarColor || 'bg-yellow-100'} flex items-center justify-center text-lg shadow-sm relative group`}>
                  {member.name[0]}
                  <button onClick={() => deleteMember(member.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100">×</button>
                </div>
                <span className="text-xs text-gray-600">{member.name}</span>
              </div>
            ))}
            {members.length === 0 && <span className="text-xs text-gray-400 py-2">가족을 등록해보세요</span>}
          </div>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <div className="bg-white">
        {MENU_LIST.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3 text-gray-700">
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
        <div className="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 text-gray-400">
            <div className="flex items-center gap-3">
              <Settings size={20} />
              <span className="font-medium">앱 설정</span>
            </div>
            <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};

export default MyPage;
