const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // 다운받은 키 파일

// 1. 파이어베이스 관리자 모드로 접속
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 2. 공공데이터 설정
const API_KEY = "71f28d5941fd4d63a514"; // 사용자님 키
const SERVICE_ID = "COOKRCP01";
const BATCH_SIZE = 500; // 한 번에 처리할 양 (DB 제한)

// 3. 데이터 변환 및 저장 함수
async function uploadData() {
  let startIdx = 1;
  let endIdx = 1000;
  let totalCount = 0;

  console.log("🚀 레시피 대량 등록을 시작합니다...");

  while (true) {
    console.log(`\n📥 데이터 다운로드 중... (${startIdx} ~ ${endIdx})`);
    
    try {
      const url = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/${startIdx}/${endIdx}`;
      const response = await fetch(url);
      const json = await response.json();

      // 데이터가 없거나 에러면 종료
      if (!json[SERVICE_ID] || !json[SERVICE_ID].row) {
        console.log("✅ 더 이상 가져올 데이터가 없습니다. 종료합니다.");
        break;
      }

      const recipes = json[SERVICE_ID].row;
      const batch = db.batch(); // 한 번에 저장하기 위한 꾸러미

      recipes.forEach((raw) => {
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

        // (3) 카테고리
        let type = 'MAIN';
        if (raw.RCP_PAT2 === '반찬') type = 'SIDE';
        else if (raw.RCP_PAT2 === '국&찌개') type = 'SOUP';
        else if (raw.RCP_PAT2 === '밥') type = 'RICE';
        else if (raw.RCP_PAT2 === '후식') type = 'DESSERT';

        // (4) 저장할 데이터 만들기
        const docRef = db.collection("recipes").doc(); // 새 문서 생성
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
      });

      // (5) DB에 전송 (Commit)
      await batch.commit();
      totalCount += recipes.length;
      console.log(`✨ ${recipes.length}개 저장 완료! (누적: ${totalCount}개)`);

      // 다음 1000개를 위해 숫자 증가
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
