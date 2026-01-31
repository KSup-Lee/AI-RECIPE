import React, { useState, useMemo } from 'react';
import { User, Settings, Heart, FileText, ShoppingBag, HelpCircle, ChevronRight, Users, X, Check, Search, AlertCircle, Edit2 } from 'lucide-react';
import { useAuth, useData } from '../App';
import { ALLERGY_TAGS, DISEASE_TAGS, PREDEFINED_INGREDIENTS } from '../constants';
import { Member } from '../types';

const getChosung = (str: string) => {
  const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  let result = "";
  for(let i=0; i<str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if(code > -1 && code < 11172) result += cho[Math.floor(code/588)];
    else result += str.charAt(i);
  }
  return result;
};

const MyPage = () => {
  const { user, logout } = useAuth();
  const { members, addMember, updateMember, deleteMember } = useData();
  
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null); // 수정할 멤버
  
  // 폼 상태
  const [form, setForm] = useState({
    name: '',
    dateY: 2020, dateM: 1, dateD: 1,
    gender: 'M',
    height: '', weight: '',
    diseases: [] as string[],
    allergies: [] as string[],
    dislikes: [] as string[],
    defaultMeals: {
        weekday: { breakfast: true, lunch: true, dinner: true },
        weekend: { breakfast: true, lunch: true, dinner: true }
    }
  });

  const [dislikeSearch, setDislikeSearch] = useState('');

  const filteredIngredients = useMemo(() => {
    if (!dislikeSearch) return [];
    const chosung = getChosung(dislikeSearch);
    return PREDEFINED_INGREDIENTS.filter(item => {
        const itemChosung = getChosung(item.name);
        return item.name.includes(dislikeSearch) || itemChosung.includes(chosung);
    }).slice(0, 10);
  }, [dislikeSearch]);

  // 모달 열기 (추가/수정 분기)
  const openModal = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      const [y, m, d] = member.birthDate.split('-').map(Number);
      setForm({
        name: member.name,
        dateY: y, dateM: m, dateD: d,
        gender: member.gender,
        height: String(member.height || ''), weight: String(member.weight || ''),
        diseases: member.diseases || [],
        allergies: member.allergies || [],
        dislikes: member.dislikes || [],
        defaultMeals: member.defaultMeals || { weekday: { breakfast: true, lunch: true, dinner: true }, weekend: { breakfast: true, lunch: true, dinner: true } }
      });
    } else {
      setEditingMember(null);
      setForm({ name: '', dateY: 2020, dateM: 1, dateD: 1, gender: 'M', height: '', weight: '', diseases: [], allergies: [], dislikes: [], defaultMeals: { weekday: { breakfast: true, lunch: true, dinner: true }, weekend: { breakfast: true, lunch: true, dinner: true } } });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name) return alert('이름을 입력해주세요.');
    const birthDate = `${form.dateY}-${String(form.dateM).padStart(2,'0')}-${String(form.dateD).padStart(2,'0')}`;
    
    const memberData: any = {
      name: form.name,
      birthDate,
      gender: form.gender as 'M'|'F',
      height: Number(form.height),
      weight: Number(form.weight),
      hasNoAllergy: form.allergies.length === 0,
      allergies: form.allergies,
      hasNoDisease: form.diseases.length === 0,
      diseases: form.diseases,
      dislikes: form.dislikes,
      avatarColor: editingMember ? editingMember.avatarColor : 'bg-blue-200', // 기존 색 유지
      relationship: 'FAMILY',
      defaultMeals: form.defaultMeals,
      proteinFocus: false, quickOnly: false, likes: [], targetCalories: 2000
    };

    if (editingMember) {
      updateMember(editingMember.id, memberData);
    } else {
      addMember({ ...memberData, id: Date.now().toString() });
    }
    setShowModal(false);
  };

  const toggleTag = (type: 'allergy'|'disease', tag: string) => {
    if (type === 'allergy') {
        setForm(prev => ({ ...prev, allergies: prev.allergies.includes(tag) ? prev.allergies.filter(t=>t!==tag) : [...prev.allergies, tag] }));
    } else {
        setForm(prev => ({ ...prev, diseases: prev.diseases.includes(tag) ? prev.diseases.filter(t=>t!==tag) : [...prev.diseases, tag] }));
    }
  };

  const addDislike = (name: string) => {
    if (!form.dislikes.includes(name)) setForm(prev => ({ ...prev, dislikes: [...prev.dislikes, name] }));
    setDislikeSearch('');
  };

  const removeDislike = (name: string) => {
    setForm(prev => ({ ...prev, dislikes: prev.dislikes.filter(d => d !== name) }));
  };

  const toggleSchedule = (isWeekend: boolean, type: 'breakfast'|'lunch'|'dinner') => {
      const key = isWeekend ? 'weekend' : 'weekday';
      setForm(prev => ({
          ...prev,
          defaultMeals: {
              ...prev.defaultMeals,
              [key]: { ...prev.defaultMeals[key], [type]: !prev.defaultMeals[key][type] }
          }
      }));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      <div className="bg-white p-6 pt-10 mb-2">
        <div className="flex items-center gap-4 mb-6">
          <img src={user?.avatar} className="w-16 h-16 rounded-full bg-gray-200" />
          <div><h2 className="text-xl font-bold">{user?.name}님</h2><p className="text-sm text-gray-500">{user?.username}</p></div>
          <button onClick={logout} className="ml-auto text-xs border px-3 py-1 rounded-full text-gray-500">로그아웃</button>
        </div>

        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2 text-gray-800"><Users size={16}/> 우리 가족 구성원</h3>
            <button onClick={() => openModal()} className="text-xs bg-[#FF6B6B] text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">+ 추가</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {members.map(member => (
              <div key={member.id} className="flex flex-col items-center gap-1 min-w-[64px] relative group">
                {/* 1. 편집 가능하게 수정 (클릭 시 모달) */}
                <div onClick={() => openModal(member)} className={`w-14 h-14 rounded-full ${member.avatarColor} flex items-center justify-center text-xl shadow-sm border-2 border-white cursor-pointer relative`}>
                  {member.name[0]}
                  {/* 삭제 버튼 디자인 개선 */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('삭제하시겠습니까?')) deleteMember(member.id); }} 
                    className="absolute -top-1 -right-1 bg-gray-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md border border-white hover:bg-red-500 z-10"
                  >
                    <X size={12}/>
                  </button>
                </div>
                <span className="text-xs text-gray-700 font-bold">{member.name}</span>
              </div>
            ))}
            {members.length === 0 && <span className="text-xs text-gray-400 py-3">가족을 등록해주세요</span>}
          </div>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <div className="bg-white">
        {[{ icon: Heart, label: '찜한 레시피' }, { icon: FileText, label: '내 글 보기' }, { icon: ShoppingBag, label: '구매 내역' }, { icon: HelpCircle, label: '고객센터' }].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3 text-gray-700"><item.icon size={20} className="text-gray-400" /><span className="font-medium">{item.label}</span></div><ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 h-[85vh] overflow-y-auto flex flex-col animate-slide-up">
              <div className="flex justify-between mb-4 shrink-0">
                <h3 className="font-bold text-lg">{editingMember ? '가족 정보 수정' : '가족 상세 정보 입력'}</h3>
                <button onClick={() => setShowModal(false)}><X/></button>
              </div>
              <div className="space-y-6 flex-1">
                {/* 1. 기본 정보 */}
                <section>
                    <label className="text-xs font-bold text-[#FF6B6B] mb-2 block">기본 정보</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-lg text-sm" placeholder="이름"/>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {['M','F'].map(g => (
                                <button key={g} onClick={() => setForm({...form, gender: g as any})} className={`flex-1 rounded text-xs font-bold ${form.gender === g ? 'bg-white shadow text-[#FF6B6B]' : 'text-gray-400'}`}>{g==='M'?'남성':'여성'}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                        <select value={form.dateY} onChange={e=>setForm({...form, dateY:Number(e.target.value)})} className="flex-1 border p-2 rounded-lg text-sm bg-white">{Array.from({length:100},(_,i)=>2026-i).map(y=><option key={y} value={y}>{y}년</option>)}</select>
                        <select value={form.dateM} onChange={e=>setForm({...form, dateM:Number(e.target.value)})} className="w-20 border p-2 rounded-lg text-sm bg-white">{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}월</option>)}</select>
                        <select value={form.dateD} onChange={e=>setForm({...form, dateD:Number(e.target.value)})} className="w-20 border p-2 rounded-lg text-sm bg-white">{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}일</option>)}</select>
                    </div>
                    <div className="flex gap-2">
                        <input type="number" placeholder="키(cm)" value={form.height} onChange={e=>setForm({...form, height: e.target.value})} className="flex-1 border p-2 rounded-lg text-sm"/>
                        <input type="number" placeholder="몸무게(kg)" value={form.weight} onChange={e=>setForm({...form, weight: e.target.value})} className="flex-1 border p-2 rounded-lg text-sm"/>
                    </div>
                </section>
                {/* 2. 건강/식습관 */}
                <section>
                    <label className="text-xs font-bold text-[#FF6B6B] mb-2 block">건강 및 식습관</label>
                    <div className="mb-3">
                        <span className="text-xs text-gray-500 mb-2 block">보유 질환 (선택)</span>
                        <div className="flex flex-wrap gap-1.5">
                            {DISEASE_TAGS.map(t => <button key={t} onClick={()=>toggleTag('disease',t)} className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${form.diseases.includes(t)?'bg-red-500 text-white shadow':'bg-gray-100 text-gray-500'}`}>{t}</button>)}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 mb-2 block">알레르기 (선택)</span>
                        <div className="flex flex-wrap gap-1.5">
                            {ALLERGY_TAGS.map(t => <button key={t} onClick={()=>toggleTag('allergy',t)} className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${form.allergies.includes(t)?'bg-orange-500 text-white shadow':'bg-gray-100 text-gray-500'}`}>{t}</button>)}
                        </div>
                    </div>
                </section>
                {/* 3. 싫어하는 재료 */}
                <section>
                    <label className="text-xs font-bold text-[#FF6B6B] mb-2 block flex items-center gap-1"><AlertCircle size={12}/> 싫어하는 재료</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {form.dislikes.map(d => (
                            <span key={d} className="bg-gray-800 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">{d} <button onClick={() => removeDislike(d)}><X size={10}/></button></span>
                        ))}
                    </div>
                    <div className="relative">
                        <input value={dislikeSearch} onChange={e => setDislikeSearch(e.target.value)} className="w-full border p-2 rounded-lg text-sm pl-8 focus:border-[#FF6B6B] outline-none" placeholder="재료 검색 (예: 오이)"/>
                        <Search className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4"/>
                        {dislikeSearch && filteredIngredients.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                                {filteredIngredients.map(item => (
                                    <button key={item.name} onClick={() => addDislike(item.name)} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center gap-2"><span>{item.icon}</span> {item.name}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                {/* 4. 식사 스케줄 */}
                <section>
                    <label className="text-xs font-bold text-[#FF6B6B] mb-2 block">기본 식사 스케줄</label>
                    <div className="bg-gray-50 p-3 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-600">평일 (월~금)</span>
                            <div className="flex gap-1">
                                {['breakfast','lunch','dinner'].map((t:any) => (
                                    <button key={t} onClick={()=>toggleSchedule(false, t)} className={`px-2 py-1 text-xs rounded border font-bold ${form.defaultMeals.weekday[t as 'breakfast'] ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400'}`}>
                                        {t==='breakfast'?'아침':t==='lunch'?'점심':'저녁'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-400">주말 (토,일)</span>
                            <div className="flex gap-1">
                                {['breakfast','lunch','dinner'].map((t:any) => (
                                    <button key={t} onClick={()=>toggleSchedule(true, t)} className={`px-2 py-1 text-xs rounded border font-bold ${form.defaultMeals.weekend[t as 'breakfast'] ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400'}`}>
                                        {t==='breakfast'?'아침':t==='lunch'?'점심':'저녁'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
              </div>
              <button onClick={handleSave} className="w-full bg-[#FF6B6B] text-white py-3 rounded-xl font-bold mt-4 shrink-0 shadow-md">저장하기</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
