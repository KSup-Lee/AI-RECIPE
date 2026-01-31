import React, { useState } from 'react';
import { User, Settings, Heart, FileText, ShoppingBag, HelpCircle, ChevronRight, Users, X } from 'lucide-react';
import { useAuth, useData } from '../App';
import { ALLERGY_TAGS } from '../constants';

const MyPage = () => {
  const { user, logout } = useAuth();
  const { members, addMember, deleteMember } = useData();
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', birthDate: '', allergies: [] as string[], dislikes: '' });

  const handleAddMember = () => {
    if (!form.name) return;
    addMember({
      id: Date.now().toString(),
      name: form.name,
      birthDate: form.birthDate,
      gender: 'M',
      allergies: form.allergies,
      dislikes: form.dislikes.split(','),
      avatarColor: 'bg-blue-200',
      relationship: 'FAMILY',
      hasNoAllergy: form.allergies.length === 0,
      hasNoDisease: true, diseases: [], proteinFocus: false, quickOnly: false, likes: [], targetCalories: 2000
    });
    setShowModal(false);
    setForm({ name: '', birthDate: '', allergies: [], dislikes: '' });
  };

  const toggleAllergy = (tag: string) => {
    setForm(prev => ({
      ...prev,
      allergies: prev.allergies.includes(tag) ? prev.allergies.filter(t => t !== tag) : [...prev.allergies, tag]
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      <div className="bg-white p-6 pt-10 mb-2">
        <div className="flex items-center gap-4 mb-6">
          <img src={user?.avatar} className="w-16 h-16 rounded-full bg-gray-200" />
          <div>
            <h2 className="text-xl font-bold">{user?.name}님</h2>
            <p className="text-sm text-gray-500">{user?.username}</p>
          </div>
          <button onClick={logout} className="ml-auto text-xs border px-3 py-1 rounded-full text-gray-500">로그아웃</button>
        </div>

        {/* 구성원 관리 */}
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold flex items-center gap-2 text-gray-800"><Users size={16}/> 우리 가족 구성원</h3>
            <button onClick={() => setShowModal(true)} className="text-xs bg-[#FF6B6B] text-white px-2 py-1 rounded font-bold">+ 추가</button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {members.map(member => (
              <div key={member.id} className="flex flex-col items-center gap-1 min-w-[60px] relative group">
                <div className={`w-12 h-12 rounded-full ${member.avatarColor} flex items-center justify-center text-lg shadow-sm border-2 border-white`}>
                  {member.name[0]}
                </div>
                <span className="text-xs text-gray-600 font-bold">{member.name}</span>
                <button onClick={() => deleteMember(member.id)} className="absolute -top-1 -right-1 bg-red-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm">×</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <div className="bg-white">
        {[
          { icon: Heart, label: '찜한 레시피' },
          { icon: FileText, label: '내 글 보기' },
          { icon: ShoppingBag, label: '구매 내역' },
          { icon: HelpCircle, label: '고객센터' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3 text-gray-700">
              <item.icon size={20} className="text-gray-400" />
              <span className="font-medium">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
      </div>

      {/* 구성원 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 h-[80vh] overflow-y-auto">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">가족 구성원 추가</h3><button onClick={() => setShowModal(false)}><X/></button></div>
              
              <div className="space-y-4">
                <div>
                   <label className="block text-xs text-gray-400 mb-1">이름</label>
                   <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" placeholder="이름 입력"/>
                </div>
                <div>
                   <label className="block text-xs text-gray-400 mb-1">생년월일</label>
                   <input type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} className="w-full border p-2 rounded"/>
                </div>
                <div>
                   <label className="block text-xs text-gray-400 mb-1">알러지 (선택)</label>
                   <div className="flex flex-wrap gap-2">
                     {ALLERGY_TAGS.map(tag => (
                       <button key={tag} onClick={() => toggleAllergy(tag)} className={`px-2 py-1 rounded text-xs border ${form.allergies.includes(tag) ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white'}`}>
                         {tag}
                       </button>
                     ))}
                   </div>
                </div>
                <div>
                   <label className="block text-xs text-gray-400 mb-1">싫어하는 재료 (쉼표로 구분)</label>
                   <input value={form.dislikes} onChange={e => setForm({...form, dislikes: e.target.value})} className="w-full border p-2 rounded" placeholder="예: 오이, 당근"/>
                </div>
                <button onClick={handleAddMember} className="w-full bg-[#FF6B6B] text-white py-3 rounded-xl font-bold mt-4">추가하기</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
