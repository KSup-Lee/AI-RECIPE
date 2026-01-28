
import { Ingredient, DailyMealPlan, Member, Product, Recipe, Post, PredefinedIngredient, IngredientCategory, Review, RelatedProduct } from "./types";

export const CATEGORIES: { id: IngredientCategory; label: string; icon: string }[] = [
  { id: 'VEGETABLE', label: '채소', icon: '🥬' },
  { id: 'FRUIT', label: '과일', icon: '🍎' },
  { id: 'MEAT', label: '정육', icon: '🥩' },
  { id: 'SEAFOOD', label: '수산', icon: '🐟' },
  { id: 'DAIRY', label: '유제품/알', icon: '🥛' },
  { id: 'GRAIN', label: '곡류/견과', icon: '🍚' },
  { id: 'SAUCE', label: '양념/오일', icon: '🧂' },
  { id: 'PROCESSED', label: '가공식품', icon: '🥫' },
  { id: 'ETC', label: '기타', icon: '📦' },
];

export const INGREDIENT_UNITS = ['개', 'g', 'kg', 'ml', 'L', '봉', '팩', '단', '모'];

export const ALLERGY_TAGS = ['달걀', '우유', '땅콩', '대두', '밀', '고등어', '게', '새우', '돼지고기', '복숭아', '토마토', '아황산류', '호두', '닭고기', '쇠고기', '오징어', '조개류'];
export const DISEASE_TAGS = ['당뇨', '고혈압', '고지혈증', '비만', '신장질환', '위장장애', '통풍'];

export const PREDEFINED_INGREDIENTS: PredefinedIngredient[] = [
  // Vegetables
  { name: '양파', category: 'VEGETABLE', icon: '🧅', defaultStorage: 'ROOM', defaultExpiryDays: 14 },
  { name: '대파', category: 'VEGETABLE', icon: '🎋', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '마늘', category: 'VEGETABLE', icon: '🧄', defaultStorage: 'FRIDGE', defaultExpiryDays: 30 },
  { name: '당근', category: 'VEGETABLE', icon: '🥕', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '감자', category: 'VEGETABLE', icon: '🥔', defaultStorage: 'ROOM', defaultExpiryDays: 30 },
  { name: '고구마', category: 'VEGETABLE', icon: '🍠', defaultStorage: 'ROOM', defaultExpiryDays: 30 },
  { name: '오이', category: 'VEGETABLE', icon: '🥒', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '애호박', category: 'VEGETABLE', icon: '🥒', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '시금치', category: 'VEGETABLE', icon: '🌿', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '상추', category: 'VEGETABLE', icon: '🥬', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '배추', category: 'VEGETABLE', icon: '🥬', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '무', category: 'VEGETABLE', icon: '🥣', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '버섯', category: 'VEGETABLE', icon: '🍄', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '브로콜리', category: 'VEGETABLE', icon: '🥦', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '피망', category: 'VEGETABLE', icon: '🫑', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '콩나물', category: 'VEGETABLE', icon: '🌱', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },

  // Fruits
  { name: '사과', category: 'FRUIT', icon: '🍎', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '배', category: 'FRUIT', icon: '🍐', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '바나나', category: 'FRUIT', icon: '🍌', defaultStorage: 'ROOM', defaultExpiryDays: 5 },
  { name: '포도', category: 'FRUIT', icon: '🍇', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '딸기', category: 'FRUIT', icon: '🍓', defaultStorage: 'FRIDGE', defaultExpiryDays: 4 },
  { name: '토마토', category: 'FRUIT', icon: '🍅', defaultStorage: 'ROOM', defaultExpiryDays: 7 },
  { name: '레몬', category: 'FRUIT', icon: '🍋', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },

  // Meat
  { name: '소고기', category: 'MEAT', icon: '🥩', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '돼지고기', category: 'MEAT', icon: '🥓', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '닭고기', category: 'MEAT', icon: '🍗', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '다짐육', category: 'MEAT', icon: '🥩', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '베이컨', category: 'MEAT', icon: '🥓', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '소시지', category: 'MEAT', icon: '🌭', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },

  // Seafood
  { name: '생선', category: 'SEAFOOD', icon: '🐟', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '오징어', category: 'SEAFOOD', icon: '🦑', defaultStorage: 'FREEZER', defaultExpiryDays: 90 },
  { name: '새우', category: 'SEAFOOD', icon: '🦐', defaultStorage: 'FREEZER', defaultExpiryDays: 90 },
  { name: '멸치', category: 'SEAFOOD', icon: '🐟', defaultStorage: 'FREEZER', defaultExpiryDays: 365 },
  { name: '미역', category: 'SEAFOOD', icon: '🌿', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '김', category: 'SEAFOOD', icon: '⬛', defaultStorage: 'FREEZER', defaultExpiryDays: 180 },

  // Dairy/Eggs
  { name: '계란', category: 'DAIRY', icon: '🥚', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '우유', category: 'DAIRY', icon: '🥛', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '치즈', category: 'DAIRY', icon: '🧀', defaultStorage: 'FRIDGE', defaultExpiryDays: 30 },
  { name: '버터', category: 'DAIRY', icon: '🧈', defaultStorage: 'FRIDGE', defaultExpiryDays: 90 },
  { name: '요거트', category: 'DAIRY', icon: '🥛', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },

  // Grain
  { name: '쌀', category: 'GRAIN', icon: '🍚', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '현미', category: 'GRAIN', icon: '🌾', defaultStorage: 'ROOM', defaultExpiryDays: 180 },
  { name: '빵', category: 'GRAIN', icon: '🍞', defaultStorage: 'ROOM', defaultExpiryDays: 3 },
  { name: '면', category: 'GRAIN', icon: '🍜', defaultStorage: 'ROOM', defaultExpiryDays: 365 },

  // Sauce
  { name: '간장', category: 'SAUCE', icon: '🏺', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '고추장', category: 'SAUCE', icon: '🌶️', defaultStorage: 'FRIDGE', defaultExpiryDays: 365 },
  { name: '된장', category: 'SAUCE', icon: '🥘', defaultStorage: 'FRIDGE', defaultExpiryDays: 365 },
  { name: '소금', category: 'SAUCE', icon: '🧂', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '설탕', category: 'SAUCE', icon: '🍬', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '식용유', category: 'SAUCE', icon: '🌻', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '참기름', category: 'SAUCE', icon: '🏺', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '마요네즈', category: 'SAUCE', icon: '🥣', defaultStorage: 'FRIDGE', defaultExpiryDays: 180 },
  { name: '케찹', category: 'SAUCE', icon: '🍅', defaultStorage: 'FRIDGE', defaultExpiryDays: 180 },

  // Processed
  { name: '두부', category: 'PROCESSED', icon: '🧊', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '김치', category: 'PROCESSED', icon: '🥬', defaultStorage: 'FRIDGE', defaultExpiryDays: 90 },
  { name: '참치캔', category: 'PROCESSED', icon: '🥫', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '라면', category: 'PROCESSED', icon: '🍜', defaultStorage: 'ROOM', defaultExpiryDays: 180 },
  { name: '만두', category: 'PROCESSED', icon: '🥟', defaultStorage: 'FREEZER', defaultExpiryDays: 180 },
];

export const INGREDIENT_DB: { [key: string]: Partial<Ingredient> } = {};

export const DUMMY_MEMBERS: Member[] = [
  { 
    id: 'm1', 
    name: '아빠', 
    relationship: 'ME',
    gender: 'M', 
    birthDate: '1980-05-15', 
    height: 178,
    weight: 75,
    bodyType: 'Average',
    hasNoAllergy: false,
    allergies: ['땅콩'], 
    hasNoDisease: false,
    diseases: ['고혈압'],
    proteinFocus: true,
    quickOnly: false,
    targetCalories: 2200, 
    likes: ['돼지고기', '묵은지'], 
    dislikes: ['오이'], 
    avatarColor: 'bg-blue-500' 
  },
  { 
    id: 'm2', 
    name: '엄마', 
    relationship: 'FAMILY',
    gender: 'F', 
    birthDate: '1982-08-20', 
    height: 165,
    weight: 55,
    bodyType: 'Slim',
    hasNoAllergy: true,
    allergies: [],
    hasNoDisease: true,
    diseases: [],
    proteinFocus: false,
    quickOnly: false,
    targetCalories: 1800, 
    likes: ['연어', '샐러드'], 
    dislikes: ['기름진 고기'], 
    avatarColor: 'bg-pink-500' 
  },
  { 
    id: 'm3', 
    name: '준이', 
    relationship: 'FAMILY',
    gender: 'M', 
    birthDate: '2015-03-10', 
    height: 130,
    weight: 30,
    bodyType: 'Average',
    hasNoAllergy: false,
    allergies: ['계란'],
    hasNoDisease: true,
    diseases: [],
    proteinFocus: true,
    quickOnly: true,
    targetCalories: 1600, 
    likes: ['소세지', '치즈'], 
    dislikes: ['당근', '시금치'], 
    avatarColor: 'bg-green-500' 
  }
];

const DUMMY_REVIEWS: Review[] = [
  { id: 'rev1', userId: 'u5', userName: '주부9단', userAvatar: 'https://ui-avatars.com/api/?name=Ju&background=FFD700', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300', rating: 5, content: '아이들이 너무 좋아해요! 간편하게 만들 수 있어서 자주 해먹습니다.', date: '2024.05.21' },
  { id: 'rev2', userId: 'u6', userName: '자취생', userAvatar: 'https://ui-avatars.com/api/?name=Ja&background=87CEEB', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=300', rating: 4, content: '냉장고 재료 처리하기 딱 좋네요.', date: '2024.05.20' },
  { id: 'rev3', userId: 'u7', userName: '요리초보', userAvatar: 'https://ui-avatars.com/api/?name=Yo&background=FFB6C1', rating: 5, content: '레시피가 상세해서 따라하기 쉬웠어요.', date: '2024.05.19' },
];

const DUMMY_RELATED_PRODUCTS: RelatedProduct[] = [
  { id: 'rp1', name: '유기농 깐양파 500g', price: 3500, image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa829?q=80&w=200', link: '#' },
  { id: 'rp2', name: '무항생제 1등급 계란', price: 8900, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=200', link: '#' },
  { id: 'rp3', name: '국산 콩나물 300g', price: 1500, image: 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=200', link: '#' },
];

const createRecipe = (
  id: string, name: string, type: any, category: any, 
  cal: number, carb: number, prot: number, fat: number,
  time: number, diff: 'EASY' | 'MEDIUM' | 'HARD',
  ings: string[], steps: string[], img: string,
  extraTags: string[] = [] 
): Recipe => ({
  id, name, image: img, 
  type, category,
  tags: [...ings.slice(0, 3), ...extraTags], 
  allergens: [],
  ingredients: ings.map(n => ({ name: n, amount: '적당량' })),
  steps,
  nutrition: { calories: cal, carbs: carb, protein: prot, fat: fat },
  cookingTime: time,
  difficulty: diff,
  rating: 4.5 + Math.random() * 0.5,
  reviews: DUMMY_REVIEWS,
  relatedProducts: DUMMY_RELATED_PRODUCTS
});

export const DUMMY_RECIPES: Recipe[] = [
  // Rice
  createRecipe('r1', '현미밥', 'RICE', 'KOREAN', 320, 70, 6, 1, 30, 'EASY', ['현미', '쌀', '물'], ['현미와 쌀을 씻습니다', '물을 맞추어 밥을 짓습니다'], 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?q=80&w=600', ['다이어트']),
  createRecipe('r15', '카레라이스', 'RICE', 'FUSION', 650, 80, 15, 20, 30, 'EASY', ['카레가루', '감자', '양파', '당근', '돼지고기'], ['재료를 볶습니다', '물과 카레를 넣고 끓여 밥 위에 얹습니다'], 'https://images.unsplash.com/photo-1541781777631-fa9531908431?q=80&w=600'),
  createRecipe('r17', '비빔밥', 'RICE', 'KOREAN', 600, 70, 20, 15, 20, 'MEDIUM', ['밥', '나물모듬', '고추장', '계란'], ['밥 위에 나물과 계란을 올립니다', '고추장에 비벼 먹습니다'], 'https://images.unsplash.com/photo-1553163147-621957516d38?q=80&w=600', ['건강']),
  createRecipe('r21', '콩나물밥', 'RICE', 'KOREAN', 400, 70, 10, 5, 30, 'EASY', ['쌀', '콩나물', '간장양념'], ['콩나물을 얹어 밥을 짓습니다', '양념장에 비벼 먹습니다'], 'https://images.unsplash.com/photo-1627209707174-8b0105312351?q=80&w=600', ['다이어트']),
  createRecipe('r30', '짜장밥', 'RICE', 'CHINESE', 600, 85, 20, 25, 25, 'MEDIUM', ['춘장', '양파', '감자', '돼지고기'], ['춘장을 볶습니다', '야채와 고기를 볶아 춘장과 섞습니다', '밥 위에 얹습니다'], 'https://images.unsplash.com/photo-1563897539633-7374c276c212?q=80&w=600'),
  
  // Soup
  createRecipe('r2', '쇠고기 미역국', 'SOUP', 'KOREAN', 180, 5, 15, 10, 40, 'MEDIUM', ['건미역', '소고기', '국간장', '마늘'], ['미역을 불립니다', '고기를 볶다가 물과 미역을 넣고 끓입니다', '간장으로 간을 합니다'], 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=600', ['국물요리']),
  createRecipe('r8', '된장찌개', 'SOUP', 'KOREAN', 150, 10, 12, 5, 25, 'MEDIUM', ['된장', '두부', '애호박', '감자'], ['육수에 된장을 풉니다', '야채와 두부를 넣고 끓입니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600', ['건강']),
  createRecipe('r9', '김치찌개', 'SOUP', 'KOREAN', 350, 15, 20, 25, 30, 'MEDIUM', ['김치', '돼지고기', '두부', '파'], ['김치와 고기를 볶습니다', '물을 붓고 푹 끓입니다', '두부를 넣습니다'], 'https://images.unsplash.com/photo-1552611052-50e7063fcd45?q=80&w=600'),
  createRecipe('r14', '어묵국', 'SOUP', 'KOREAN', 120, 10, 8, 5, 15, 'EASY', ['어묵', '무', '다시마', '파'], ['육수를 냅니다', '어묵을 넣고 끓입니다'], 'https://images.unsplash.com/photo-1627209707174-8b0105312351?q=80&w=600'),
  createRecipe('r18', '순두부찌개', 'SOUP', 'KOREAN', 280, 10, 20, 18, 20, 'MEDIUM', ['순두부', '바지락', '계란', '고추기름'], ['야채를 볶아 고추기름을 냅니다', '물과 순두부를 넣고 끓입니다'], 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600'),
  createRecipe('r22', '소고기 뭇국', 'SOUP', 'KOREAN', 150, 5, 20, 8, 40, 'MEDIUM', ['소고기', '무', '파', '마늘'], ['고기와 무를 볶습니다', '물을 붓고 푹 끓입니다'], 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=600', ['국물요리']),
  createRecipe('r27', '크림 스프', 'SOUP', 'WESTERN', 200, 15, 5, 12, 10, 'EASY', ['크림스프분말', '우유', '크루통'], ['분말을 물과 우유에 풉니다', '끓입니다'], 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600'),
  createRecipe('r42', '만두국', 'SOUP', 'KOREAN', 400, 50, 15, 10, 20, 'EASY', ['만두', '사골육수', '계란', '파'], ['육수를 끓입니다', '만두를 넣고 익힙니다'], 'https://images.unsplash.com/photo-1542385151-efd90007e2a7?q=80&w=600'),
  createRecipe('r43', '동태찌개', 'SOUP', 'KOREAN', 250, 10, 25, 5, 30, 'HARD', ['동태', '무', '두부', '쑥갓'], ['재료를 손질합니다', '양념을 풀어 끓입니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600', ['국물요리']),
  createRecipe('r44', '꽃게탕', 'SOUP', 'KOREAN', 280, 15, 20, 5, 40, 'HARD', ['꽃게', '된장', '무', '호박'], ['꽃게를 손질합니다', '된장 육수에 끓입니다'], 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=600', ['국물요리']),
  createRecipe('r45', '오징어국', 'SOUP', 'KOREAN', 150, 10, 15, 3, 20, 'MEDIUM', ['오징어', '무', '파', '고춧가루'], ['오징어와 무를 끓입니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600', ['국물요리']),

  // Main Dish
  createRecipe('r3', '제육볶음', 'MAIN', 'KOREAN', 550, 20, 35, 30, 25, 'MEDIUM', ['돼지고기', '고추장', '양파', '대파'], ['고기를 양념에 재웁니다', '센 불에 빠르게 볶아냅니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600', ['야식']),
  createRecipe('r6', '잡채', 'MAIN', 'KOREAN', 400, 60, 8, 12, 50, 'HARD', ['당면', '시금치', '당근', '양파', '버섯', '돼지고기'], ['당면을 삶습니다', '각 재료를 볶습니다', '간장 양념에 버무립니다'], 'https://images.unsplash.com/photo-1626084025846-527e0258163f?q=80&w=600'),
  createRecipe('r7', '오징어 볶음', 'MAIN', 'KOREAN', 380, 15, 30, 10, 20, 'MEDIUM', ['오징어', '양배추', '고춧가루', '설탕'], ['오징어를 손질합니다', '양념장과 야채를 넣고 볶습니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600', ['야식']),
  createRecipe('r12', '돈육 메추리알 장조림', 'MAIN', 'KOREAN', 300, 10, 25, 15, 45, 'MEDIUM', ['돼지고기 안심', '메추리알', '간장', '설탕'], ['고기를 삶습니다', '간장 소스에 고기와 메추리알을 조립니다'], 'https://images.unsplash.com/photo-1626084025846-527e0258163f?q=80&w=600', ['도시락']),
  createRecipe('r13', '떡볶이', 'MAIN', 'KOREAN', 600, 100, 10, 10, 20, 'EASY', ['떡', '어묵', '고추장', '설탕', '파'], ['육수에 고추장을 풉니다', '떡과 어묵을 넣고 졸입니다'], 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=600', ['야식']),
  createRecipe('r19', '갈치구이', 'MAIN', 'KOREAN', 200, 0, 25, 10, 20, 'MEDIUM', ['갈치', '소금', '식용유'], ['갈치에 소금을 뿌립니다', '팬에 굽습니다'], 'https://images.unsplash.com/photo-1534939561126-855f8621818e?q=80&w=600', ['건강']),
  createRecipe('r23', '닭갈비', 'MAIN', 'KOREAN', 500, 30, 35, 20, 30, 'MEDIUM', ['닭고기', '고구마', '양배추', '떡'], ['양념에 재운 닭을 야채와 볶습니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600', ['야식']),
  createRecipe('r26', '토마토 스파게티', 'MAIN', 'WESTERN', 550, 80, 20, 15, 20, 'EASY', ['스파게티면', '토마토소스', '베이컨', '양파'], ['면을 삶습니다', '소스와 함께 볶습니다'], 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600'),
  createRecipe('r28', '함박스테이크', 'MAIN', 'WESTERN', 600, 20, 40, 35, 40, 'HARD', ['다진소고기', '다진돼지고기', '양파', '빵가루'], ['고기를 반죽해 굽습니다', '소스를 뿌립니다'], 'https://images.unsplash.com/photo-1529042410759-befb1204b468?q=80&w=600', ['도시락']),
  createRecipe('r29', '마파두부', 'MAIN', 'CHINESE', 450, 20, 25, 30, 20, 'MEDIUM', ['두부', '다진돼지고기', '두반장', '파'], ['고기를 볶다가 소스와 물을 넣습니다', '두부를 넣고 졸입니다'], 'https://images.unsplash.com/photo-1536304993881-ff000997fb50?q=80&w=600', ['야식']),
  createRecipe('r41', '수제비', 'MAIN', 'KOREAN', 450, 80, 15, 5, 40, 'MEDIUM', ['밀가루', '감자', '호박', '멸치육수'], ['반죽을 합니다', '육수에 떼어 넣습니다'], 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=600'),
  createRecipe('r46', '보쌈', 'MAIN', 'KOREAN', 600, 5, 40, 45, 60, 'HARD', ['돼지고기 수육용', '마늘', '양파', '된장'], ['고기를 향신채와 삶습니다'], 'https://images.unsplash.com/photo-1544025162-d76690b60f61?q=80&w=600', ['야식']),
  createRecipe('r47', '찜닭', 'MAIN', 'KOREAN', 550, 40, 35, 20, 50, 'HARD', ['닭', '당면', '간장', '고추'], ['닭을 손질합니다', '간장 소스에 조립니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600', ['야식']),
  createRecipe('r48', '삼치구이', 'MAIN', 'KOREAN', 250, 0, 30, 15, 20, 'EASY', ['삼치', '소금'], ['삼치를 굽습니다'], 'https://images.unsplash.com/photo-1534939561126-855f8621818e?q=80&w=600'),
  createRecipe('r49', '조기구이', 'MAIN', 'KOREAN', 150, 0, 20, 8, 20, 'EASY', ['조기', '식용유'], ['조기를 굽습니다'], 'https://images.unsplash.com/photo-1534939561126-855f8621818e?q=80&w=600'),
  createRecipe('r50', '훈제오리 볶음', 'MAIN', 'KOREAN', 400, 5, 20, 35, 10, 'EASY', ['훈제오리', '양파', '부추'], ['오리를 볶다가 야채를 넣습니다'], 'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?q=80&w=600'),

  // Side Dish / Noodle
  createRecipe('r4', '계란말이', 'SIDE', 'KOREAN', 250, 2, 12, 18, 15, 'EASY', ['계란', '당근', '파', '소금'], ['계란을 풉니다', '야채를 다져 넣습니다', '팬에 말아가며 익힙니다'], 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600', ['도시락']),
  createRecipe('r5', '시금치 나물', 'SIDE', 'KOREAN', 60, 5, 3, 2, 15, 'EASY', ['시금치', '참기름', '깨', '소금'], ['시금치를 데칩니다', '찬물에 헹궈 물기를 짭니다', '양념에 무칩니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['다이어트', '건강']),
  createRecipe('r10', '숙주나물', 'SIDE', 'KOREAN', 40, 3, 2, 1, 10, 'EASY', ['숙주', '참기름', '소금'], ['숙주를 데칩니다', '소금과 참기름으로 간합니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['다이어트']),
  createRecipe('r11', '깍두기', 'SIDE', 'KOREAN', 30, 5, 1, 0, 60, 'MEDIUM', ['무', '고춧가루', '새우젓', '파'], ['무를 깍둑 썹니다', '절인 후 양념에 버무립니다'], 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?q=80&w=600'),
  createRecipe('r16', '잔치국수', 'NOODLE', 'KOREAN', 500, 80, 15, 5, 20, 'MEDIUM', ['소면', '멸치육수', '애호박', '김가루'], ['육수를 끓입니다', '면을 삶아 육수를 붓고 고명을 올립니다'], 'https://images.unsplash.com/photo-1626084025846-527e0258163f?q=80&w=600'),
  createRecipe('r20', '브로콜리 숙회', 'SIDE', 'WESTERN', 50, 5, 3, 0, 10, 'EASY', ['브로콜리', '초고추장'], ['브로콜리를 데칩니다', '초장을 곁들입니다'], 'https://images.unsplash.com/photo-1615485499978-0242449a6061?q=80&w=600', ['다이어트', '건강']),
  createRecipe('r24', '감자채 볶음', 'SIDE', 'KOREAN', 120, 20, 2, 5, 15, 'EASY', ['감자', '양파', '당근', '소금'], ['감자를 채 썰어 볶습니다', '소금으로 간합니다'], 'https://images.unsplash.com/photo-1618449845529-688998efd33d?q=80&w=600'),
  createRecipe('r25', '김 구이', 'SIDE', 'KOREAN', 20, 1, 1, 1, 5, 'EASY', ['김', '참기름', '소금'], ['김에 기름을 바르고 굽습니다'], 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=600', ['다이어트']),
  createRecipe('r31', '오이무침', 'SIDE', 'KOREAN', 40, 8, 1, 0, 10, 'EASY', ['오이', '양파', '고춧가루', '식초'], ['오이를 썹니다', '양념에 무칩니다'], 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600', ['다이어트']),
  createRecipe('r32', '멸치볶음', 'SIDE', 'KOREAN', 150, 10, 15, 8, 15, 'EASY', ['잔멸치', '견과류', '올리고당', '간장'], ['멸치를 볶습니다', '양념에 버무립니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['도시락']),
  createRecipe('r33', '진미채볶음', 'SIDE', 'KOREAN', 200, 25, 15, 5, 15, 'MEDIUM', ['진미채', '고추장', '마요네즈'], ['진미채를 불립니다', '양념장에 볶습니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['도시락']),
  createRecipe('r34', '감자조림', 'SIDE', 'KOREAN', 180, 30, 4, 2, 25, 'MEDIUM', ['감자', '간장', '설탕', '참기름'], ['감자를 깍뚝 썹니다', '양념장에 조립니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['도시락']),
  createRecipe('r35', '두부조림', 'SIDE', 'KOREAN', 160, 10, 15, 8, 20, 'EASY', ['두부', '간장', '고춧가루', '파'], ['두부를 굽습니다', '양념장을 끼얹어 조립니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['건강', '도시락']),
  createRecipe('r36', '콩자반', 'SIDE', 'KOREAN', 100, 15, 8, 2, 40, 'MEDIUM', ['검은콩', '간장', '설탕'], ['콩을 불립니다', '양념장에 푹 삶습니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['건강']),
  createRecipe('r37', '우엉조림', 'SIDE', 'KOREAN', 90, 18, 2, 1, 30, 'MEDIUM', ['우엉', '간장', '물엿'], ['우엉을 채 썹니다', '간장 양념에 볶고 조립니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['건강']),
  createRecipe('r38', '도토리묵 무침', 'SIDE', 'KOREAN', 80, 15, 1, 2, 10, 'EASY', ['도토리묵', '상추', '김가루', '간장양념'], ['묵을 썹니다', '야채와 함께 버무립니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['다이어트']),
  createRecipe('r39', '호박전', 'SIDE', 'KOREAN', 150, 15, 3, 10, 20, 'EASY', ['애호박', '부침가루', '계란'], ['호박을 썹니다', '옷을 입혀 굽습니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600'),
  createRecipe('r40', '김치전', 'SIDE', 'KOREAN', 250, 30, 5, 12, 15, 'EASY', ['김치', '부침가루', '물'], ['김치를 썹니다', '반죽하여 굽습니다'], 'https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?q=80&w=600', ['야식']),
];

export const DUMMY_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: '김치', category: 'PROCESSED', quantity: 1, unit: '포기', expiryDate: '2024-06-01', storage: 'FRIDGE', image: '🥬' },
  { id: 'i2', name: '계란', category: 'DAIRY', quantity: 10, unit: '개', expiryDate: '2024-04-30', storage: 'FRIDGE', image: '🥚' },
  { id: 'i3', name: '돼지고기', category: 'MEAT', quantity: 600, unit: 'g', expiryDate: '2024-04-20', storage: 'FREEZER', image: '🥓' },
  { id: 'i4', name: '양파', category: 'VEGETABLE', quantity: 3, unit: '개', expiryDate: '2024-05-15', storage: 'ROOM', image: '🧅' },
  { id: 'i5', name: '두부', category: 'PROCESSED', quantity: 1, unit: '모', expiryDate: '2024-04-25', storage: 'FRIDGE', image: '🧊' },
  { id: 'i6', name: '대파', category: 'VEGETABLE', quantity: 1, unit: '단', expiryDate: '2024-05-01', storage: 'FRIDGE', image: '🎋' },
];

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '무항생제 특란 30구',
    price: 8500,
    discountRate: 10,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516482738497-146786c6eb8a?q=80&w=300&auto=format&fit=crop',
    tags: ['베스트', '세일'],
    link: '#',
    category: '신선식품'
  },
  {
    id: 'p2',
    name: '한돈 삼겹살 500g',
    price: 15000,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1602494359851-dd2671552430?q=80&w=300&auto=format&fit=crop',
    tags: ['핫딜'],
    link: '#',
    category: '정육'
  },
  {
    id: 'p3',
    name: '친환경 시금치 1단',
    price: 3500,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300&auto=format&fit=crop',
    tags: [],
    link: '#',
    category: '신선식품'
  }
];

export const TODAY_MEAL: DailyMealPlan = {
  date: new Date().toISOString().split('T')[0],
  meals: {
    BREAKFAST: [
        { recipe: DUMMY_RECIPES[1], memberIds: ['m1', 'm2', 'm3'] }, // Rice
        { recipe: DUMMY_RECIPES[3], memberIds: ['m1', 'm2', 'm3'] }, // Soup
    ],
    LUNCH: [
      { recipe: DUMMY_RECIPES[0], memberIds: ['m1', 'm2', 'm3'] }, // Rice
      { recipe: DUMMY_RECIPES[8], memberIds: ['m1', 'm2', 'm3'] }, // Soup
      { recipe: DUMMY_RECIPES[2], memberIds: ['m1', 'm2', 'm3'] }, // Main
      { recipe: DUMMY_RECIPES[3], memberIds: ['m1', 'm2', 'm3'] }, // Side
    ],
    DINNER: [
        { recipe: DUMMY_RECIPES[14], memberIds: ['m1', 'm2', 'm3'] }, // Curry
        { recipe: DUMMY_RECIPES[4], memberIds: ['m1', 'm2', 'm3'] }, // Side
    ]
  }
};

export const DUMMY_POSTS: Post[] = [
  {
    id: 'post1',
    userId: 'u3',
    userName: '요리왕비룡',
    userAvatar: 'https://ui-avatars.com/api/?name=Dragon',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600',
    content: '주말에는 역시 냉털 비빔밥이죠! 🥗 아이들도 잘 먹어서 너무 좋아요.',
    likes: 42,
    date: '2024-05-20'
  },
  {
    id: 'post2',
    userId: 'u4',
    userName: '살림9단',
    userAvatar: 'https://ui-avatars.com/api/?name=Salim',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
    content: '오늘 저녁은 간단하게 샐러드로 해결~ 식단관리 3일차입니다 화이팅!',
    likes: 28,
    date: '2024-05-19'
  },
];
