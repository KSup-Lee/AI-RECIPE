import React, { useState, useMemo } from 'react';
import { Heart, FileText, ShoppingBag, HelpCircle, ChevronRight, Users, X, Check, Search, AlertCircle, Edit2 } from 'lucide-react';
import { useAuth, useData } from '../App';
import { ALLERGY_TAGS, DISEASE_TAGS, PREDEFINED_INGREDIENTS } from '../constants';
import { Member, DefaultMealSettings } from '../types';

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
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  const initialSchedule = { breakfast: true, lunch: true, dinner: true };
  const initialWeeklySchedule: DefaultMealSettings = {
      MON: {...initialSchedule}, TUE: {...initialSchedule}, WED: {...initialSchedule}, 
      THU: {...initialSchedule}, FRI: {...initialSchedule}, SAT: {...initialSchedule}, SUN: {...initialSchedule}
  };

  const [form, setForm] = useState({
    name: '',
    dateY: 2020, dateM: 1, dateD: 1,
    gender: 'M',
    height: '', weight: '',
    diseases: [] as string[],
    allergies: [] as string[],
    dislikes: [] as string[],
    defaultMeals: initialWeeklySchedule,
    shoppingCycle: '3' // 기본 3일
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

  const openModal = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      const [y, m, d] = member.birthDate.split('-').map(Number);
      const mergedMeals = { ...initialWeeklySchedule, ...(member.defaultMeals || {}) };
      setForm({
        name: member.name,
        dateY: y || 2020, dateM: m || 1, dateD: d || 1,
        gender: member.gender,
        height: String(member.height || ''), weight: String(member.weight || ''),
        diseases: member.diseases || [],
        allergies: member.allergies || [],
        dislikes: member.dislikes || [],
        defaultMeals: mergedMeals,
        shoppingCycle: String(member.shoppingCycle || '3')
      });
    } else {
      setEditingMember(null);
      setForm({ name: '', dateY: 2020, dateM: 1, dateD: 1, gender: 'M', height: '', weight: '', diseases: [], allergies: [], dislikes: [], defaultMeals: initialWeeklySchedule, shoppingCycle: '3' });
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
      avatarColor: editingMember ? editingMember.avatarColor : 'bg-blue-200',
      relationship: 'FAMILY',
      defaultMeals: form.defaultMeals,
      proteinFocus: false, quickOnly: false, likes: [], targetCalories: 2000,
      shoppingCycle: Number(form.shoppingCycle)
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

  const toggleDayMeal = (day: string, type: 'breakfast'|'lunch'|'dinner') => {
      setForm(prev => ({
          ...prev,
          defaultMeals: {
              ...prev.defaultMeals,
              [day]: { ...prev.defaultMeals[day], [type]: !prev.defaultMeals[day][type] }
          }
      }));
  };

  const batchSet = (days: string[], status: boolean) => {
      setForm(prev => {
          const newMeals = { ...prev.defaultMeals };
          days.forEach(d => { newMeals[d] = { breakfast: status, lunch: status, dinner: status }; });
          return { ...prev, defaultMeals: newMeals };
      });
  };

  const DAYS = [
      { key: 'MON', label: '월' }, { key: 'TUE', label: '화' }, { key: 'WED', label: '수' }, { key: 'THU', label: '목' }, { key: 'FRI', label: '금' },
      { key: 'SAT', label: '토' }, { key: 'SUN', label: '일' }
  ];

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
              <div key={member.id} className="flex flex-col items-center gap-1 min-w-[64px] relative group cursor-pointer" onClick={() => openModal(member)}>
                <div className={`w-14 h-14 rounded-full ${member.avatarColor} flex items-center justify-center text-xl shadow-sm border-2 border-white relative`}>
                  {member.name[0]}
                  <div onClick={(e) => { e.stopPropagation(); if(confirm('삭제하시겠습니까?')) deleteMember(member.id); }} className="absolute -top-1 -right-1 bg-white text-gray-400 rounded-full w-5 h-5 flex items-center justify-center shadow-md border border-gray-100 hover:bg-red-500 hover:text-white transition-colors z-10">
                    <X size={10} strokeWidth={3} />
                  </div>
                </div>
                <span className="text-xs text-gray-700 font-bold mt-1">{member.name}</span>
              </div>
            ))}
            {members.length === 0 && <span className="text-xs text-gray-400 py-3">가족을 등록해주세요</span>}
          </div>
        </div>
      </div>

      <div className="bg-white">
        {[{ icon: Heart, label: '찜한 레시피' }, { icon: FileText, label: '내 글 보기' }, { icon: ShoppingBag, label: '구매 내역' }, { icon: HelpCircle, label: '고객센터' }].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3 text-gray-700"><item.icon size={20} className="text-gray-400" /><span className="font-medium">{item.label}</span></div><ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 h-[85vh] overflow-y-auto flex flex-col animate-slide-up">
              <div className="flex justify-between mb-4 shrink-0">
                <h3 className="font-bold text-lg">{editingMember ? '가족 정보 수정' : '가족 상세 정보 입력'}</h3>
                <button onClick={() => setShowModal(false)}><X/></button>
              </div>
              <div className="space-y-6 flex-1">
                <section>
                    <label className="text-xs font-bold text-[#FF6B6B] mb-2 block">기본 정보</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-lg text-sm w-full" placeholder="이름"/>
                        <div className="flex bg-gray-100 rounded-lg p-1 w-full">
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
                    {/* 🌟 [UI 수정] Grid로 변경하여 너비 문제 해결 */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1 border p-2 rounded-lg bg-white overflow-hidden">
                            <input type="number" placeholder="키" value={form.height} onChange={e=>setForm({...form, height: e.target.value})} className="w-full text-sm outline-none min-w-0"/>
                            <span className="text-xs text-gray-400 shrink-0">cm</span>
                        </div>
                        <div className="flex items-center gap-1 border p-2 rounded-lg bg-white overflow-hidden">
                            <input type="number" placeholder="몸무게" value={form.weight} onChange={e=>setForm({...form, weight: e.target.value})} className="w-full text-sm outline-none min-w-0"/>
                            <span className="text-xs text-gray-400 shrink-0">kg</span>
                        </div>
                    </div>
                </section>
                
                {/* 쇼핑 주기 설정 */}
                <section>
                    <label className="text-xs font-bold text-[#FF6B6B] mb-2 block">장보기 설정</label>
                    <div className="flex items-center justify-between border p-3 rounded-xl">
                        <span className="text-sm font-bold text-gray-600">장보기 주기</span>
                        <div className="flex items-center gap-2">
                            <input type="number" value={form.shoppingCycle} onChange={e => setForm({...form, shoppingCycle: e.target.value})} className="w-12 text-center border-b border-gray-300 outline-none font-bold text-[#FF6B6B]"/>
                            <span className="text-sm text-gray-400">일 마다</span>
                        </div>
                    </div>
                </section>

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
                <section>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-[#FF6B6B]">식사 스케줄 (요일별)</label>
                        <div className="flex gap-1">
                            <button onClick={() => batchSet(['MON','TUE','WED','THU','FRI'], true)} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">평일선택</button>
                            <button onClick={() => batchSet(['SAT','SUN'], true)} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">주말선택</button>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                        <div className="grid grid-cols-4 gap-1 text-center mb-2">
                            <span className="text-[10px] font-bold text-gray-400">요일</span>
                            <span className="text-[10px] font-bold text-gray-600">아침</span>
                            <span className="text-[10px] font-bold text-gray-600">점심</span>
                            <span className="text-[10px] font-bold text-gray-600">저녁</span>
                        </div>
                        {DAYS.map(day => (
                            <div key={day.key} className="grid grid-cols-4 gap-1 items-center mb-1.5 last:mb-0">
                                <span className={`text-xs font-bold ${day.key === 'SAT' ? 'text-blue-500' : day.key === 'SUN' ? 'text-red-500' : 'text-gray-500'} text-center`}>{day.label}</span>
                                <div onClick={() => toggleDayMeal(day.key, 'breakfast')} className={`h-8 rounded-lg flex items-center justify-center cursor-pointer border ${form.defaultMeals[day.key]?.breakfast ? 'bg-white border-[#FF6B6B] text-[#FF6B6B]' : 'bg-gray-200 border-transparent text-gray-400'}`}><Check size={14}/></div>
                                <div onClick={() => toggleDayMeal(day.key, 'lunch')} className={`h-8 rounded-lg flex items-center justify-center cursor-pointer border ${form.defaultMeals[day.key]?.lunch ? 'bg-white border-[#FF6B6B] text-[#FF6B6B]' : 'bg-gray-200 border-transparent text-gray-400'}`}><Check size={14}/></div>
                                <div onClick={() => toggleDayMeal(day.key, 'dinner')} className={`h-8 rounded-lg flex items-center justify-center cursor-pointer border ${form.defaultMeals[day.key]?.dinner ? 'bg-white border-[#FF6B6B] text-[#FF6B6B]' : 'bg-gray-200 border-transparent text-gray-400'}`}><Check size={14}/></div>
                            </div>
                        ))}
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
