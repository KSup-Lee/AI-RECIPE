// ==========================================
// 1. 사용자 및 멤버 관련 (Auth & MyPage)
// ==========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string; // 이메일
  role: UserRole;
  name: string;     // 구글 실명
  nickname?: string; // 앱 내 표시 닉네임 (New)
  avatar: string;
}

// 요일별 식사 여부 설정
export interface DefaultMealSettings {
  [key: string]: { 
    breakfast: boolean; 
    lunch: boolean; 
    dinner: boolean; 
  };
}

// 가족 구성원 상세 정보
export interface Member {
  id: string;
  name: string;
  gender: 'M' | 'F';
  birthDate: string;
  avatarColor: string;
  relationship: 'ME' | 'FAMILY';

  // 신체 정보
  height?: number;
  weight?: number;
  
  // 건강 및 식습관 필터
  hasNoAllergy: boolean;
  allergies: string[];
  hasNoDisease: boolean;
  diseases: string[];
  dislikes: string[]; // 싫어하는 재료
  
  // 식사 스케줄 및 장보기
  defaultMeals?: DefaultMealSettings;
  shoppingCycle?: number; // 장보기 주기 (New)

  // 영양 목표
  proteinFocus: boolean; 
  quickOnly: boolean; 
  likes: string[];
  targetCalories: number;
}

// ==========================================
// 2. 냉장고 및 재료 관련 (Fridge)
// ==========================================

export type IngredientCategory = 'VEGETABLE' | 'MEAT' | 'SEAFOOD' | 'FRUIT' | 'DAIRY' | 'SAUCE' | 'GRAIN' | 'PROCESSED' | 'ETC';

// 사용자가 냉장고에 추가한 재료
export interface Ingredient {
  id: string; 
  name: string; 
  category: IngredientCategory; 
  quantity: number; 
  unit: string; 
  expiryDate: string; 
  storage: 'FRIDGE' | 'FREEZER' | 'ROOM'; 
  image: string; 
  isFavorite?: boolean; 
}

// 앱에 미리 정의된 재료 데이터베이스 (자동완성용)
export interface PredefinedIngredient {
  name: string; 
  category: IngredientCategory; 
  icon: string; 
  defaultStorage: 'FRIDGE' | 'FREEZER' | 'ROOM'; 
  defaultExpiryDays: number; 
  defaultUnit: string; 
  baseGram?: number; 
  suggestedUnits?: string[]; 
  expiry?: number; 
  unit?: string;
}

// ==========================================
// 3. 레시피 관련 (Recipe - 구조 확장됨)
// ==========================================

// 레시피 내부 재료 구조 (정규화됨)
export interface RecipeIngredient {
  name: string;       // 화면 표시용 (예: 양파 1/2개)
  normalizedName?: string; // 검색 및 매칭용 (예: 양파)
  amount: string;     // 텍스트 분량 (예: 1/2개)
  quantity?: number;  // 계산용 수량 (예: 0.5)
  unit?: string;      // 계산용 단위 (예: 개)
}

// 레시피 조리 단계
export interface RecipeStep {
  text: string;
  timer?: number;
  imageUrl?: string;
}

// 레시피 메인 정보
export interface Recipe {
  id: string; 
  name: string; 
  type: any;        // 국, 반찬, 일품 등
  category: any;    // 한식, 양식 등
  tags: string[]; 
  allergens: string[]; 
  
  // 재료 및 조리법
  ingredients: RecipeIngredient[]; 
  steps: string[]; 
  
  // 영양 정보
  nutrition: { 
    calories: number; 
    carbs: number; 
    protein: number; 
    fat: number; 
  }; 
  
  // 메타 정보
  cookingTime: number; 
  difficulty: string; 
  image: string; 
  videoUrl?: string;      // 유튜브 링크 (New)
  originalSource?: string; // 출처 (New)
  
  rating: number; 
  reviews: any[]; 
  relatedProducts: any[]; 
  matchRate?: number;     // 냉장고 매칭률 (동적 계산)
  calories?: number;      // 호환성 유지용
}

// ==========================================
// 4. 식단 관련 (MealPlan)
// ==========================================

export interface MealPlanItem { 
  recipe: Recipe; 
  memberIds: string[]; 
  isCompleted?: boolean; 
}

export interface DailyMealPlan {
  date: string; 
  meals: { 
    BREAKFAST: MealPlanItem[]; 
    LUNCH: MealPlanItem[]; 
    DINNER: MealPlanItem[]; 
  };
}

// ==========================================
// 5. 쇼핑 및 커뮤니티 (Shopping & Community)
// ==========================================

export interface Product { 
  id: string; 
  name: string; 
  price: number; 
  discountRate?: number; 
  rating: number; 
  image: string; 
  tags: string[]; 
  link: string; 
  category: string; 
}

export interface CartItem { 
  id: string; 
  product: Product; 
  quantity: number; 
}

export interface Post { 
  id: string; 
  userId?: string; 
  userName?: string; 
  userAvatar?: string; 
  image?: string; 
  content: string; 
  likes: number; 
  date?: string; 
  title?: string; 
  author?: string; 
  uid?: string; 
  createdAt?: any; 
}

export interface Review { 
  id: string; 
  userId: string; 
  userName: string; 
  rating: number; 
  comment: string; 
  date: string; 
}

export interface RelatedProduct { 
  name: string; 
  price: number; 
  image: string; 
  link: string; 
}
