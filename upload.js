import admin from "firebase-admin";
import { createRequire } from "module";
import path from "path";
import fetch from "node-fetch"; // 혹시 fetch 에러가 나면 이 줄은 지우셔도 됩니다 (Node 18+부터는 내장됨)

// ES Module에서 JSON 파일을 불러오기 위한 설정
const require = createRequire(import.meta.url);

// 1. 키 파일 경로 설정 (현재 폴더에서 확실하게 찾기)
const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
const serviceAccount = require(serviceAccountPath);

console.log(`🔑 인증 키 로딩 성공: ${serviceAccount.project_id}`);

// 2. 파이어베이스 접속
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 3. 공공데이터 설정
const API_KEY = "71f28d5941fd4d63a514"; 
const SERVICE_ID = "COOKRCP01";

// 4. 데이터 업로드 함수
async function uploadData() {
  let startIdx = 1;
  let endIdx = 1000;
  let totalCount = 0;

  console.log("🚀 레시피 대량 등록을 시작합니다...");

  while (true) {
    console.log(`\n📥 데이터 다운로드 중... (${startIdx} ~ ${endIdx})`);
    
    try {
      // API 호출
      const url = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/${startIdx}/${endIdx}`;
      const response = await fetch(url);
      const json = await response.json();

      // 데이터가 없거나 에러면 종료
      if (!json[SERVICE_ID] || !json[SERVICE_ID].row) {
        console.log("✅ 더 이상 가져올 데이터가 없습니다. 종료합니다.");
        break;
      }

      const recipes = json[SERVICE_ID].row;
      
      // 한 번에 500개씩 저장 (Firestore 배치 제한)
      const BATCH_LIMIT = 500;
      let batch = db.batch();
      let batchCount = 0;

      for (const raw of recipes) {
        // (1) 재료 정리
        const ingredientString = raw.RCP_PARTS_DTLS || "";
        const ingredients = ingredientString.split(/,|\n/).map((s) => {
            const parts = s.trim().split(' ');
            const name = parts[0]; 
            const amount = parts.slice(1).join(' ') || '적당량';
            return { name, amount };
        }).filter((i) => i.name.length > 0);

        // (2) 조리 순서 정리
        const steps = [];
        for (let i = 1; i <= 20; i++) {
            const stepKey = `MANUAL${String(i).padStart(2, '0')}`;
            const stepDesc = raw[stepKey];
            if (stepDesc) steps.push(stepDesc.replace(/^\d+\.\s*/, '')); 
        }

        // (3) 카테고리 매핑
        let type = 'MAIN';
        if (raw.RCP_PAT2 === '반찬') type = 'SIDE';
        else if (raw.RCP_PAT2 === '국&찌개') type = 'SOUP';
        else if (raw.RCP_PAT2 === '밥') type = 'RICE';
        else if (raw.RCP_PAT2 === '후식') type = 'DESSERT';

        // (4) 저장할 데이터 객체 생성
        const docRef = db.collection("recipes").doc(); // 새 문서 ID 자동 생성
        batch.set(docRef, {
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

        // 500개가 차면 전송하고 배치를 비움
        if (batchCount === BATCH_LIMIT) {
            await batch.commit();
            console.log(`  - 500개 저장 완료...`);
            batch = db.batch();
            batchCount = 0;
        }
      }

      // 남은 데이터 저장
      if (batchCount > 0) {
        await batch.commit();
      }

      totalCount += recipes.length;
      console.log(`✨ 누적 ${totalCount}개 저장 완료!`);

      // 다음 페이지로 이동
      startIdx += 1000;
      endIdx += 1000;

    } catch (error) {
      console.error("❌ 에러 발생:", error);
      break;
    }
  }
}

// 실행
uploadData();
