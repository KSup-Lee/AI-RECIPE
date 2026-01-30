// 📁 파일 위치: src/RecipeImporter.tsx
import React, { useState } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase'; // 👈 만약 에러나면 경로를 ./firebase 대신 ./utils/firebase 등으로 맞춰주세요.

const RecipeImporter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState("대기 중...");
  const [isOpen, setIsOpen] = useState(true);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

  const startAutoImport = async () => {
    if (!confirm("🚨 경고: 데이터베이스에 레시피 대량 등록을 시작하시겠습니까?")) return;

    setIsLoading(true);
    let startIdx = 1;
    let endIdx = 1000;
    let totalSaved = 0;
    const API_KEY = "71f28d5941fd4d63a514";

    try {
      while (true) {
        setProgress(`${startIdx} ~ ${endIdx}번 데이터 요청 중...`);
        const response = await fetch(`http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/COOKRCP01/json/${startIdx}/${endIdx}`);
        const data = await response.json();

        if (!data.COOKRCP01 || !data.COOKRCP01.row) {
          addLog("✅ 작업 완료! 더 이상 데이터가 없습니다.");
          alert(`총 ${totalSaved}개의 레시피가 저장되었습니다!`);
          break;
        }

        const recipes = data.COOKRCP01.row;
        addLog(`📦 ${recipes.length}개 도착. 저장 시작...`);

        let batch = writeBatch(db);
        let batchCount = 0;

        for (const raw of recipes) {
            // 재료 파싱
            const ingredientString = raw.RCP_PARTS_DTLS || "";
            const ingredients = ingredientString.split(/,|\n/).map((s: string) => {
                const parts = s.trim().split(' ');
                const name = parts[0];
                const amount = parts.slice(1).join(' ') || '적당량';
                return { name, amount };
            }).filter((i: any) => i.name.length > 0);

            // 조리법 파싱
            const steps = [];
            for (let i = 1; i <= 20; i++) {
                const stepKey = `MANUAL${String(i).padStart(2, '0')}`;
                // eslint-disable-next-line
                const stepDesc = raw[stepKey];
                if (stepDesc) steps.push(stepDesc.replace(/^\d+\.\s*/, ''));
            }

            // 카테고리
            let type = 'MAIN';
            if (raw.RCP_PAT2 === '반찬') type = 'SIDE';
            else if (raw.RCP_PAT2 === '국&찌개') type = 'SOUP';
            else if (raw.RCP_PAT2 === '밥') type = 'RICE';
            else if (raw.RCP_PAT2 === '후식') type = 'DESSERT';

            // DB 저장
            const recipeRef = doc(collection(db, "recipes"));
            batch.set(recipeRef, {
                name: raw.RCP_NM,
                image: raw.ATT_FILE_NO_MK || '',
                description: `${raw.RCP_PAT2} - ${raw.RCP_WAY2}`,
                category: 'KOREAN',
                type: type,
                tags: [raw.RCP_WAY2, raw.HASH_TAG].filter(Boolean),
                cookingTime: 30,
                difficulty: 'MEDIUM',
                ingredients: ingredients,
                steps: steps,
                nutrition: {
                    calories: Math.round(Number(raw.INFO_ENG)) || 0,
                    carbs: Math.round(Number(raw.INFO_CAR)) || 0,
                    protein: Math.round(Number(raw.INFO_PRO)) || 0,
                    fat: Math.round(Number(raw.INFO_FAT)) || 0,
                },
                rating: 0,
                reviews: [],
                createdAt: new Date().toISOString(),
                authorId: 'admin',
                authorName: '식품안전나라',
                originalId: raw.RCP_SEQ
            });

            batchCount++;
            if (batchCount === 500) {
                await batch.commit();
                batch = writeBatch(db);
                batchCount = 0;
            }
        }

        if (batchCount > 0) await batch.commit();

        totalSaved += recipes.length;
        addLog(`✨ 누적 ${totalSaved}개 저장 완료!`);
        startIdx += 1000;
        endIdx += 1000;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (e: any) {
      console.error(e);
      addLog(`❌ 에러: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return <button onClick={()=>setIsOpen(true)} className="fixed bottom-24 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg z-50 text-xl font-bold">🛠️</button>;

  return (
    <div className="fixed bottom-24 right-4 p-4 bg-white border-4 border-red-500 rounded-xl shadow-2xl z-50 w-80 flex flex-col max-h-[400px]">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-red-600">🛠️ 관리자: 레시피 가져오기</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400">✕</button>
        </div>
        <div className="text-center mb-2">
            <div className="text-lg font-bold text-blue-600">{progress}</div>
        </div>
        <div className="bg-gray-100 p-2 rounded-lg flex-1 overflow-y-auto mb-2 text-xs h-32 font-mono">
            {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <button 
            onClick={startAutoImport} 
            disabled={isLoading}
            className={`w-full font-bold py-2 rounded-lg text-white text-sm ${isLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
        >
            {isLoading ? "데이터 가져오는 중..." : "시작하기 (한 번만 클릭)"}
        </button>
    </div>
  );
};

export default RecipeImporter;
