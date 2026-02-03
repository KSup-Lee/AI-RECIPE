// 사용자 권한
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// 기본 사용자 정보
export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  avatar: string;
}

// 요일별 식사 설정 타입
export interface DefaultMealSettings {
  [key: string]: { breakfast: boolean; lunch: boolean; dinner: boolean };
}

// 가족 구성원
export interface Member {
  id: string;
  name: string;
  gender: 'M' | 'F';
  birthDate: string;
  avatarColor: string;
  relationship: 'ME' | 'FAMILY';
  height?: number;
  weight?: number;
  hasNoAllergy: boolean;
  allergies: string[];
  hasNoDisease: boolean;
  diseases: string[];
  dislikes: string[];
  defaultMeals?: DefaultMealSettings;
  shoppingCycle?: number; 
  proteinFocus: boolean; 
  quickOnly: boolean; 
  likes: string[];
  targetCalories: number;
}

export type IngredientCategory = 'VEGETABLE' | 'MEAT' | 'SEAFOOD' | 'FRUIT' | 'DAIRY' | 'SAUCE' | 'GRAIN' | 'PROCESSED' | 'ETC';

// [냉장고 재료]
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

// [사전 정의된 재료 DB]
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

// 🌟 [핵심 변경] 레시피 구조 확장 (유튜브 연동 및 정밀 분석용)
export interface RecipeIngredient {
  name: string;       // 표시용 이름 (예: 양파 1/2개)
  normalizedName?: string; // 검색/매칭용 이름 (예: 양파) - 냉장고 연동 핵심
  amount: string;     // 표시용 양 (예: 1/2개)
  quantity?: number;  // 계산용 수량 (예: 0.5) - 장보기 합산용
  unit?: string;      // 계산용 단위 (예: 개)
}

export interface RecipeStep {
  text: string;       // 조리법 텍스트
  timer?: number;     // 타이머가 필요한 경우 (초 단위) - 영상 연동 시 유용
  imageUrl?: string;  // 단계별 이미지 (영상 캡처 등)
}

export interface Recipe {
  id: string; 
  name: string; 
  type: any; // 국, 반찬 등
  category: any; // 한식, 양식 등
  tags: string[]; 
  allergens: string[]; 
  
  // 🌟 구조화된 재료 목록
  ingredients: RecipeIngredient[]; 
  
  // 🌟 구조화된 조리 순서
  steps: string[]; // 기존 호환성을 위해 string[] 유지하되, 나중에 RecipeStep[]으로 확장 가능
  
  nutrition: { 
    calories: number; 
    carbs: number; 
    protein: number; 
    fat: number 
  }; 
  
  cookingTime: number; 
  difficulty: string; 
  image: string; 
  
  // 🌟 유튜브 연동 필드 추가
  videoUrl?: string; // 유튜브 영상 링크
  originalSource?: string; // 출처 (예: '백종원 PAIK JONG WON')
  
  rating: number; 
  reviews: any[]; 
  relatedProducts: any[]; 
  matchRate?: number; 
  calories?: number;
}

export interface MealPlanItem { recipe: Recipe; memberIds: string[]; isCompleted?: boolean; }
export interface DailyMealPlan { date: string; meals: { BREAKFAST: MealPlanItem[]; LUNCH: MealPlanItem[]; DINNER: MealPlanItem[]; }; }
export interface Product { id: string; name: string; price: number; discountRate?: number; rating: number; image: string; tags: string[]; link: string; category: string; }
export interface CartItem { id: string; product: Product; quantity: number; }
export interface Post { id: string; userId?: string; userName?: string; userAvatar?: string; image?: string; content: string; likes: number; date?: string; title?: string; author?: string; uid?: string; createdAt?: any; }
export interface Review { id: string; userId: string; userName: string; rating: number; comment: string; date: string; }
export interface RelatedProduct { name: string; price: number; image: string; link: string; }
