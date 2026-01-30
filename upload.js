import admin from "firebase-admin";
import fetch from "node-fetch"; 

// 1. 인증 키 직접 입력 (줄바꿈 문자 자동 변환 적용)
const serviceAccount = {
  "type": "service_account",
  "project_id": "mealzip-eea8d",
  "private_key_id": "f3ef472c4b66602c47096a38f2a4fe385c79b653",
  // 👇 [중요] .replace(/\\n/g, '\n') 코드가 줄바꿈을 올바르게 고쳐줍니다.
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCbMmoqoyZTdHoO\n6txe0j9QZ/qrCJLHtfbBmGnlhzSFSWTFa/ds/g3x1bFYSipxWQDc6HIUeqNDGIGs\n0hGaWZEaszU0Jq2TaF2VjwR6b+rDr5VwAMtoJG6qBmsom7Du59SvxJOdtax9vaIv\nIXpjfcF4I28y2473dErpWFm423L6zKhQhVt1kHqlzv1mfGYThKXH0rwjXr2CuPaK\ngRoNGGSoZ3OTQJNoO0SDZGD0ZaoJ8AZYOGzqEpFT2DxQFa7BxB++K4JlWpb7citk\nWV3HHmmah/c/EVwOwtkYfIw0TesH7Ket8pHPjvKmrieoJa9IDtdtgVTgrr5aB9VU\n4cmEBc39AgMBAAECggEAP2OIGYIp1Uxtzkn/WHtngN/3coQ973RTJR+roSRoP0iK\n8Ff453udFnnBxd4FF+bSg2gtsE+m/3CzBnOG3RRYQB+SS4rAusSV9NBFc/ziVqsQ\nzn6EljTLPocAncV5rxrhtCkGYhQiL/mUlMuHwbtLmlZexNcIvemx7z026Fo5zFXI\nVJXvBzaWr8yY7dhhBQHNwPLVfmO++PtKN0cXGnsUwA2F+t3XFCca/+cS9O6Xm8Ek\nf7E1vjLA+gvd+4FLvg3wXDaBNcCRctceQYBmFd1hRjql1+EWszJg001CBvS8GpgY\nmyc/+DqEMZvax6AUFYHoz1IKOO1DU+Vrl2tI5bThwQKBgQDI2AZjC724As3tREKJ\nsvo/O+HYxEZzgGc14SMTJteLS4Z4HMKtxJtTm7ctdmhcSbcfX3UEQ2pCXz8HOGfc\nzN/3Yf+8zwGl94quVfpbru/IQhTxebosucKphMWq3LNaNdCPi+a1GvXV7jJmry+q\noEXjvDdRFtMS8j0pfGYEAt1xEwKBgQDF0UNpXksNjgJbUaY1dXonegg9B1Ovfdw0\nKoCf5yaJiJ7SEU9cXMtoChX90iKFMpiwfTkHLxGX0qiV4fn0PS0po977LfjG5w4J\n511Ann/Ql/2x5H1z/xIM8MSZ152YyLxGKRYpOD8r6BJby0H011EAYZ2f6mEjNTY/\nietRqPa2rwKBgF5GoQDfIwf8MQOd1gni/HqwNjxVLajL7iapbphv1B+rrQw2m9+L\neUnOvzZU7XnclFvip///USKkqOZPwNkxRjROSQgst15bizp4W1OsExwSgNg0xoJ2\nE/0UuOCSRpIizqqDBiGe7SSlcf0nYJ2cLBJRaDnlF+E92h3eKdjaK24HAoGAK+J3\nzQlhJxmpBi8/6z4rolRdPYTBmP4X+u6u6Ep0bzCC42F5tKjVazhJlqymgdwuqYCu\nRRy5D3BpfA7Mz9U+jq1PC3Qwa5fYsnPEaVCAVHtTicKB3ljo3TwQsXx29u0Zb4sv\n4mcbBJeQcxLNiA64ZphBSrfJYvEsHr5vGQed6/sCgYB0/DgiKH/krKH0E5Sk1VLh\nr3Qvgc6gi6izG58BWjfFTvuc+AWnwZ0fxZdlb3GNUgelLEqPGMn+FpAkPlFogS/K\nrReScEk6QJ07+5zXsE3X+9g0qheenBb+1q5pFVnplYct9DkoxRzvS5Z3cfk7w9Je\ni+uUllxBKw0IJ1btg3Uq+A==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@mealzip-eea8d.iam.gserviceaccount.com",
  "client_id": "104596175603360936512",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40mealzip-eea8d.iam.gserviceaccount.com"
};

console.log(`🔑 인증 키 로딩 완료: ${serviceAccount.project_id}`);

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
      const url = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/${startIdx}/${endIdx}`;
      const response = await fetch(url);
      const json = await response.json();

      if (!json[SERVICE_ID] || !json[SERVICE_ID].row) {
        console.log("✅ 더 이상 가져올 데이터가 없습니다. 종료합니다.");
        break;
      }

      const recipes = json[SERVICE_ID].row;
      const BATCH_LIMIT = 500;
      let batch = db.batch();
      let batchCount = 0;

      for (const raw of recipes) {
        const ingredientString = raw.RCP_PARTS_DTLS || "";
        const ingredients = ingredientString.split(/,|\n/).map((s) => {
            const parts = s.trim().split(' ');
            const name = parts[0]; 
            const amount = parts.slice(1).join(' ') || '적당량';
            return { name, amount };
        }).filter((i) => i.name.length > 0);

        const steps = [];
        for (let i = 1; i <= 20; i++) {
            const stepKey = `MANUAL${String(i).padStart(2, '0')}`;
            const stepDesc = raw[stepKey];
            if (stepDesc) steps.push(stepDesc.replace(/^\d+\.\s*/, '')); 
        }

        let type = 'MAIN';
        if (raw.RCP_PAT2 === '반찬') type = 'SIDE';
        else if (raw.RCP_PAT2 === '국&찌개') type = 'SOUP';
        else if (raw.RCP_PAT2 === '밥') type = 'RICE';
        else if (raw.RCP_PAT2 === '후식') type = 'DESSERT';

        const docRef = db.collection("recipes").doc();
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

        if (batchCount === BATCH_LIMIT) {
            await batch.commit();
            console.log(`  - 500개 저장 완료...`);
            batch = db.batch();
            batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      totalCount += recipes.length;
      console.log(`✨ 누적 ${totalCount}개 저장 완료!`);

      startIdx += 1000;
      endIdx += 1000;

    } catch (error) {
      console.error("❌ 에러 발생:", error);
      break;
    }
  }
}

uploadData();
