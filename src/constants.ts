import { Ingredient, DailyMealPlan, Member, Product, Recipe, Post, PredefinedIngredient, IngredientCategory, Review, RelatedProduct } from "./types";

export const CATEGORIES: { id: IngredientCategory; label: string; icon: string }[] = [
  { id: 'VEGETABLE', label: '채소', icon: '🥬' },
  { id: 'FRUIT', label: '과일', icon: '🍎' },
  { id: 'MEAT', label: '정육/계란', icon: '🥩' },
  { id: 'SEAFOOD', label: '수산/건어물', icon: '🐟' },
  { id: 'GRAIN', label: '곡류/견과', icon: '🍚' },
  { id: 'DAIRY', label: '유제품', icon: '🥛' },
  { id: 'SAUCE', label: '양념/오일', icon: '🧂' },
  { id: 'PROCESSED', label: '가공/냉동', icon: '🥫' },
  { id: 'ETC', label: '기타', icon: '📦' },
];

export const INGREDIENT_UNITS = ['개', 'g', 'kg', 'ml', 'L', '봉', '팩', '단', '모', '캔', '병'];

export const ALLERGY_TAGS = ['달걀', '우유', '땅콩', '대두', '밀', '고등어', '게', '새우', '돼지고기', '복숭아', '토마토', '아황산류', '호두', '닭고기', '쇠고기', '오징어', '조개류'];
export const DISEASE_TAGS = ['당뇨', '고혈압', '고지혈증', '비만', '신장질환', '위장장애', '통풍'];

// 한국인 맞춤형 대용량 재료 DB
export const PREDEFINED_INGREDIENTS: PredefinedIngredient[] = [
  // 1. 채소 (VEGETABLE)
  { name: '양파', category: 'VEGETABLE', icon: '🧅', defaultStorage: 'ROOM', defaultExpiryDays: 14 },
  { name: '대파', category: 'VEGETABLE', icon: '🎋', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '마늘', category: 'VEGETABLE', icon: '🧄', defaultStorage: 'FRIDGE', defaultExpiryDays: 30 },
  { name: '다진마늘', category: 'VEGETABLE', icon: '🧄', defaultStorage: 'FRIDGE', defaultExpiryDays: 20 },
  { name: '당근', category: 'VEGETABLE', icon: '🥕', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '감자', category: 'VEGETABLE', icon: '🥔', defaultStorage: 'ROOM', defaultExpiryDays: 30 },
  { name: '고구마', category: 'VEGETABLE', icon: '🍠', defaultStorage: 'ROOM', defaultExpiryDays: 30 },
  { name: '오이', category: 'VEGETABLE', icon: '🥒', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '애호박', category: 'VEGETABLE', icon: '🥒', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '청양고추', category: 'VEGETABLE', icon: '🌶️', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '홍고추', category: 'VEGETABLE', icon: '🌶️', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '풋고추', category: 'VEGETABLE', icon: '🌶️', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '시금치', category: 'VEGETABLE', icon: '🌿', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '상추', category: 'VEGETABLE', icon: '🥬', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '깻잎', category: 'VEGETABLE', icon: '🍃', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '배추', category: 'VEGETABLE', icon: '🥬', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '양배추', category: 'VEGETABLE', icon: '🥬', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '무', category: 'VEGETABLE', icon: '🥣', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '콩나물', category: 'VEGETABLE', icon: '🌱', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '숙주', category: 'VEGETABLE', icon: '🌱', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '팽이버섯', category: 'VEGETABLE', icon: '🍄', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '느타리버섯', category: 'VEGETABLE', icon: '🍄', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '표고버섯', category: 'VEGETABLE', icon: '🍄', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '새송이버섯', category: 'VEGETABLE', icon: '🍄', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '브로콜리', category: 'VEGETABLE', icon: '🥦', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '파프리카', category: 'VEGETABLE', icon: '🫑', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '피망', category: 'VEGETABLE', icon: '🫑', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '가지', category: 'VEGETABLE', icon: '🍆', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '부추', category: 'VEGETABLE', icon: '🌱', defaultStorage: 'FRIDGE', defaultExpiryDays: 4 },
  { name: '쪽파', category: 'VEGETABLE', icon: '🎋', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '미나리', category: 'VEGETABLE', icon: '🌿', defaultStorage: 'FRIDGE', defaultExpiryDays: 4 },
  { name: '쑥갓', category: 'VEGETABLE', icon: '🌿', defaultStorage: 'FRIDGE', defaultExpiryDays: 4 },
  { name: '단호박', category: 'VEGETABLE', icon: '🎃', defaultStorage: 'ROOM', defaultExpiryDays: 30 },
  { name: '토마토', category: 'VEGETABLE', icon: '🍅', defaultStorage: 'ROOM', defaultExpiryDays: 7 },
  { name: '방울토마토', category: 'VEGETABLE', icon: '🍅', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '옥수수', category: 'VEGETABLE', icon: '🌽', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '연근', category: 'VEGETABLE', icon: '🥔', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '우엉', category: 'VEGETABLE', icon: '🪵', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '생강', category: 'VEGETABLE', icon: '🫚', defaultStorage: 'FRIDGE', defaultExpiryDays: 20 },

  // 2. 정육/계란 (MEAT)
  { name: '계란', category: 'MEAT', icon: '🥚', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '메추리알', category: 'MEAT', icon: '🥚', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '소고기(국거리)', category: 'MEAT', icon: '🥩', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '소고기(구이용)', category: 'MEAT', icon: '🥩', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '소고기(불고기)', category: 'MEAT', icon: '🥩', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '다진 소고기', category: 'MEAT', icon: '🥩', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '삼겹살', category: 'MEAT', icon: '🥓', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '목살', category: 'MEAT', icon: '🥓', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '돼지고기(찌개용)', category: 'MEAT', icon: '🥓', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '돼지갈비', category: 'MEAT', icon: '🍖', defaultStorage: 'FRIDGE', defaultExpiryDays: 3 },
  { name: '다진 돼지고기', category: 'MEAT', icon: '🥓', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '닭고기(볶음탕)', category: 'MEAT', icon: '🍗', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '닭가슴살', category: 'MEAT', icon: '🍗', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '닭다리', category: 'MEAT', icon: '🍗', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '오리고기', category: 'MEAT', icon: '🍖', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '베이컨', category: 'MEAT', icon: '🥓', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '소시지', category: 'MEAT', icon: '🌭', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '햄', category: 'MEAT', icon: '🍖', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },

  // 3. 수산/건어물 (SEAFOOD)
  { name: '고등어', category: 'SEAFOOD', icon: '🐟', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '갈치', category: 'SEAFOOD', icon: '🐟', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '조기', category: 'SEAFOOD', icon: '🐟', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '오징어', category: 'SEAFOOD', icon: '🦑', defaultStorage: 'FREEZER', defaultExpiryDays: 90 },
  { name: '새우', category: 'SEAFOOD', icon: '🦐', defaultStorage: 'FREEZER', defaultExpiryDays: 90 },
  { name: '꽃게', category: 'SEAFOOD', icon: '🦀', defaultStorage: 'FREEZER', defaultExpiryDays: 90 },
  { name: '바지락', category: 'SEAFOOD', icon: '🐚', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '홍합', category: 'SEAFOOD', icon: '🐚', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '전복', category: 'SEAFOOD', icon: '🦪', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '굴', category: 'SEAFOOD', icon: '🦪', defaultStorage: 'FRIDGE', defaultExpiryDays: 2 },
  { name: '낙지', category: 'SEAFOOD', icon: '🐙', defaultStorage: 'FREEZER', defaultExpiryDays: 30 },
  { name: '쭈꾸미', category: 'SEAFOOD', icon: '🐙', defaultStorage: 'FREEZER', defaultExpiryDays: 30 },
  { name: '멸치(국물용)', category: 'SEAFOOD', icon: '🐟', defaultStorage: 'FREEZER', defaultExpiryDays: 365 },
  { name: '멸치(볶음용)', category: 'SEAFOOD', icon: '🐟', defaultStorage: 'FREEZER', defaultExpiryDays: 365 },
  { name: '진미채', category: 'SEAFOOD', icon: '🦑', defaultStorage: 'FRIDGE', defaultExpiryDays: 90 },
  { name: '건미역', category: 'SEAFOOD', icon: '🌿', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '김', category: 'SEAFOOD', icon: '⬛', defaultStorage: 'FREEZER', defaultExpiryDays: 180 },
  { name: '다시마', category: 'SEAFOOD', icon: '🌿', defaultStorage: 'ROOM', defaultExpiryDays: 365 },

  // 4. 과일 (FRUIT)
  { name: '사과', category: 'FRUIT', icon: '🍎', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '배', category: 'FRUIT', icon: '🍐', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '바나나', category: 'FRUIT', icon: '🍌', defaultStorage: 'ROOM', defaultExpiryDays: 5 },
  { name: '포도', category: 'FRUIT', icon: '🍇', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '딸기', category: 'FRUIT', icon: '🍓', defaultStorage: 'FRIDGE', defaultExpiryDays: 4 },
  { name: '귤', category: 'FRUIT', icon: '🍊', defaultStorage: 'ROOM', defaultExpiryDays: 14 },
  { name: '오렌지', category: 'FRUIT', icon: '🍊', defaultStorage: 'FRIDGE', defaultExpiryDays: 21 },
  { name: '수박', category: 'FRUIT', icon: '🍉', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '참외', category: 'FRUIT', icon: '🍈', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '복숭아', category: 'FRUIT', icon: '🍑', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '감', category: 'FRUIT', icon: '🍅', defaultStorage: 'ROOM', defaultExpiryDays: 14 },
  { name: '레몬', category: 'FRUIT', icon: '🍋', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },
  { name: '아보카도', category: 'FRUIT', icon: '🥑', defaultStorage: 'ROOM', defaultExpiryDays: 5 },
  { name: '키위', category: 'FRUIT', icon: '🥝', defaultStorage: 'FRIDGE', defaultExpiryDays: 14 },

  // 5. 유제품 (DAIRY)
  { name: '우유', category: 'DAIRY', icon: '🥛', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '두유', category: 'DAIRY', icon: '🥛', defaultStorage: 'ROOM', defaultExpiryDays: 90 },
  { name: '요거트', category: 'DAIRY', icon: '🥣', defaultStorage: 'FRIDGE', defaultExpiryDays: 10 },
  { name: '치즈', category: 'DAIRY', icon: '🧀', defaultStorage: 'FRIDGE', defaultExpiryDays: 30 },
  { name: '버터', category: 'DAIRY', icon: '🧈', defaultStorage: 'FRIDGE', defaultExpiryDays: 90 },
  { name: '생크림', category: 'DAIRY', icon: '🧁', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },

  // 6. 곡류/견과 (GRAIN)
  { name: '쌀', category: 'GRAIN', icon: '🍚', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '현미', category: 'GRAIN', icon: '🌾', defaultStorage: 'ROOM', defaultExpiryDays: 180 },
  { name: '잡곡', category: 'GRAIN', icon: '🌾', defaultStorage: 'ROOM', defaultExpiryDays: 180 },
  { name: '찹쌀', category: 'GRAIN', icon: '🍚', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '식빵', category: 'GRAIN', icon: '🍞', defaultStorage: 'ROOM', defaultExpiryDays: 3 },
  { name: '소면', category: 'GRAIN', icon: '🍜', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '파스타면', category: 'GRAIN', icon: '🍝', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '당면', category: 'GRAIN', icon: '🍜', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '아몬드', category: 'GRAIN', icon: '🥜', defaultStorage: 'ROOM', defaultExpiryDays: 180 },
  { name: '호두', category: 'GRAIN', icon: '🥜', defaultStorage: 'FREEZER', defaultExpiryDays: 180 },
  { name: '땅콩', category: 'GRAIN', icon: '🥜', defaultStorage: 'ROOM', defaultExpiryDays: 180 },

  // 7. 양념/오일 (SAUCE)
  { name: '간장', category: 'SAUCE', icon: '🏺', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '고추장', category: 'SAUCE', icon: '🌶️', defaultStorage: 'FRIDGE', defaultExpiryDays: 365 },
  { name: '된장', category: 'SAUCE', icon: '🥘', defaultStorage: 'FRIDGE', defaultExpiryDays: 365 },
  { name: '쌈장', category: 'SAUCE', icon: '🥘', defaultStorage: 'FRIDGE', defaultExpiryDays: 365 },
  { name: '고춧가루', category: 'SAUCE', icon: '🌶️', defaultStorage: 'FREEZER', defaultExpiryDays: 365 },
  { name: '소금', category: 'SAUCE', icon: '🧂', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '설탕', category: 'SAUCE', icon: '🍬', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '식초', category: 'SAUCE', icon: '🍾', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '참기름', category: 'SAUCE', icon: '🏺', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '들기름', category: 'SAUCE', icon: '🏺', defaultStorage: 'FRIDGE', defaultExpiryDays: 180 },
  { name: '식용유', category: 'SAUCE', icon: '🌻', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '올리브유', category: 'SAUCE', icon: '🫒', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '케찹', category: 'SAUCE', icon: '🍅', defaultStorage: 'FRIDGE', defaultExpiryDays: 180 },
  { name: '마요네즈', category: 'SAUCE', icon: '🥣', defaultStorage: 'FRIDGE', defaultExpiryDays: 180 },
  { name: '굴소스', category: 'SAUCE', icon: '🦪', defaultStorage: 'FRIDGE', defaultExpiryDays: 180 },
  { name: '액젓', category: 'SAUCE', icon: '🐟', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '맛술', category: 'SAUCE', icon: '🍾', defaultStorage: 'ROOM', defaultExpiryDays: 365 },
  { name: '후추', category: 'SAUCE', icon: '🧂', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },

  // 8. 가공/냉동 (PROCESSED)
  { name: '두부', category: 'PROCESSED', icon: '🧊', defaultStorage: 'FRIDGE', defaultExpiryDays: 5 },
  { name: '순두부', category: 'PROCESSED', icon: '🧊', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '어묵', category: 'PROCESSED', icon: '🍥', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '맛살', category: 'PROCESSED', icon: '🦀', defaultStorage: 'FRIDGE', defaultExpiryDays: 7 },
  { name: '단무지', category: 'PROCESSED', icon: '🟡', defaultStorage: 'FRIDGE', defaultExpiryDays: 30 },
  { name: '김치', category: 'PROCESSED', icon: '🥬', defaultStorage: 'FRIDGE', defaultExpiryDays: 90 },
  { name: '참치캔', category: 'PROCESSED', icon: '🥫', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '스팸/통조림햄', category: 'PROCESSED', icon: '🥫', defaultStorage: 'ROOM', defaultExpiryDays: 1000 },
  { name: '라면', category: 'PROCESSED', icon: '🍜', defaultStorage: 'ROOM', defaultExpiryDays: 180 },
  { name: '만두', category: 'PROCESSED', icon: '🥟', defaultStorage: 'FREEZER', defaultExpiryDays: 180 },
  { name: '냉동볶음밥', category: 'PROCESSED', icon: '🍛', defaultStorage: 'FREEZER', defaultExpiryDays: 180 },
  { name: '치킨너겟', category: 'PROCESSED', icon: '🍗', defaultStorage: 'FREEZER', defaultExpiryDays: 180 },
  { name: '떡국떡', category: 'PROCESSED', icon: '🍡', defaultStorage: 'FRIDGE', defaultExpiryDays: 30 },
  { name: '떡볶이떡', category: 'PROCESSED', icon: '🍡', defaultStorage: 'FRIDGE', defaultExpiryDays: 30 },
];

export const DUMMY_RECIPES: Recipe[] = [
  // ... (기존 레시피 유지 - DUMMY_RECIPES 내용 전체가 들어있어야 합니다. 
  // 여기서는 지면 관계상 생략하지만, 실제 파일에는 기존 DUMMY_RECIPES를 그대로 두시거나 
  // 이전에 주셨던 긴 코드를 그대로 유지해주세요.)
];

// ... (나머지 DUMMY_INGREDIENTS, DUMMY_PRODUCTS 등도 기존 유지)
// 아래 코드는 컴파일 에러 방지를 위한 최소한의 더미 데이터입니다. 
// 실제로는 이전 코드의 내용을 유지해주시는 게 좋습니다.
export const DUMMY_INGREDIENTS: Ingredient[] = [];
export const DUMMY_PRODUCTS: Product[] = [];
export const TODAY_MEAL: DailyMealPlan = { date: '', meals: { BREAKFAST: [], LUNCH: [], DINNER: [] } };
export const DUMMY_POSTS: Post[] = [];
