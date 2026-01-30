import React, { useState } from 'react';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase'; // 경로는 본인 설정에 맞게!

const RecipeCleaner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState("대기 중...");

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

  const startCleanup = async () => {
    if (!confirm("🚨 중복된 레시피를 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)")) return;

    setIsLoading(true);
    setStatus("데이터 분석 중...");
    addLog("🔍 전체 레시피를 불러오는 중입니다...");

    try {
      // 1. 모든 레시피 가져오기
      const snapshot = await getDocs(collection(db, "recipes"));
      const recipes = snapshot.docs;
      addLog(`📦 총 ${recipes.length}개의 레시피가 발견되었습니다.`);

      if (recipes.length === 0) {
        alert("삭제할 레시피가 없습니다.");
        setIsLoading(false);
        return;
      }

      // 2. 중복 찾기 (이름 기준)
      const uniqueNames = new Set();
      const duplicates: any[] = [];
      const keepIds: string[] = [];

      recipes.forEach((doc) => {
        const data = doc.data();
        const identifier = data.originalId || data.name; // 고유 ID가 없으면 이름으로 식별

        if (uniqueNames.has(identifier)) {
          // 이미 등록된 이름이면 -> 삭제 목록에 추가
          duplicates.push(doc);
        } else {
          // 처음 보는 이름이면 -> 유지 목록에 등록
          uniqueNames.add(identifier);
          keepIds.push(doc.id);
        }
      });

      addLog(`✨ 분석 완료!`);
      addLog(`✅ 유지할 레시피: ${keepIds.length}개`);
      addLog(`🗑️ 삭제할 중복 레시피: ${duplicates.length}개`);

      if (duplicates.length === 0) {
        alert("중복된 레시피가 없습니다! 데이터가 깨끗합니다. ✨");
        setIsLoading(false);
        return;
      }

      if (!confirm(`${duplicates.length}개의 중복 항목을 삭제하시겠습니까?`)) {
        setIsLoading(false);
        return;
      }

      // 3. 중복 삭제 실행 (배치 처리)
      setStatus("삭제 중...");
      let batch = writeBatch(db);
      let batchCount = 0;
      let deletedCount = 0;

      for (const docToDelete of duplicates) {
        batch.delete(doc(db, "recipes", docToDelete.id));
        batchCount++;
        deletedCount++;

        // 500개 찰 때마다 삭제 실행
        if (batchCount === 500) {
          await batch.commit();
          addLog(`🔥 ${deletedCount}개 삭제 완료...`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      // 남은 것 삭제
      if (batchCount > 0) {
        await batch.commit();
      }

      addLog(`🎉 청소 끝! 총 ${deletedCount}개의 중복 레시피를 삭제했습니다.`);
      alert("중복 제거가 완료되었습니다!");

    } catch (e: any) {
      console.error(e);
      addLog(`❌ 에러 발생: ${e.message}`);
      alert("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setStatus("완료");
    }
  };

  return (
    <div className="fixed bottom-24 right-4 p-4 bg-white border-4 border-orange-500 rounded-xl shadow-2xl z-50 w-80 flex flex-col max-h-[400px]">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-orange-600">🧹 레시피 중복 청소기</h3>
            <button onClick={() => window.location.reload()} className="text-gray-400">✕</button>
        </div>
        <div className="text-center mb-2">
            <div className="text-lg font-bold text-gray-700">{status}</div>
        </div>
        <div className="bg-gray-100 p-2 rounded-lg flex-1 overflow-y-auto mb-2 text-xs h-32 font-mono">
            {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <button 
            onClick={startCleanup} 
            disabled={isLoading}
            className={`w-full font-bold py-2 rounded-lg text-white text-sm ${isLoading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
            {isLoading ? "청소하는 중..." : "중복 제거 시작하기"}
        </button>
    </div>
  );
};

export default RecipeCleaner;
