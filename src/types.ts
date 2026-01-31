// 사용자 권한
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// 기본 사용자 정보 (로그인 연동)
export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  avatar: string;
}

// [수정됨] 가족 구성원 (상세 정보 포함)
export interface Member {
  id: string;
  name: string;
  gender: 'M' | 'F';
  birthDate: string; // YYYY-MM-DD
  avatarColor: string;
  relationship: 'ME' | 'FAMILY';

  // 신체 정보
  height?: number; // cm
  weight?: number; // kg
  
  // 건강 및 식습관
  hasNoAllergy: boolean;
  allergies: string[]; // 알러지 태그 리스트
  hasNoDisease: boolean;
  diseases: string[]; // 질병 태그 리스트 (당뇨, 고혈압 등)
  dislikes: string[]; // 기피 재료 이름 리스트 (DB에 있는 재료명)
  
  // 식사 스케줄 (요일별 식사 여부)
defaultMeals: DefaultMealSettings;

  proteinFocus: boolean; 
  quickOnly: boolean; 
  likes: string[];
  targetCalories: number;
  };

  // 기타 선호도 (추후 확장용)
  proteinFocus: boolean; 
  quickOnly: boolean; 
  likes: string[];
  targetCalories: number;
}

// 재료 카테고리
export type IngredientCategory = 'VEGETABLE' | 'MEAT' | 'SEAFOOD' | 'FRUIT' | 'DAIRY' | 'SAUCE' | 'GRAIN' | 'PROCESSED' | 'ETC';

// 내 냉장고 재료
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

// 미리 정의된 재료 DB (검색용)
export interface PredefinedIngredient {
  name: string;
  category: IngredientCategory;
  icon: string;
  defaultStorage: 'FRIDGE' | 'FREEZER' | 'ROOM';
  defaultExpiryDays: number;
  defaultUnit: string;
  baseGram?: number;
  suggestedUnits?: string[];
  // 호환성 유지용 필드
  expiry?: number;
  unit?: string;
}

// 레시피 정보
export interface Recipe {
  id: string;
  name: string;
  type: any; // e.g. 국, 반찬
  category: any; // e.g. 한식, 양식
  tags: string[];
  allergens: string[];
  ingredients: { name: string; amount: string }[];
  steps: string[];
  nutrition: { calories: number; carbs: number; protein: number; fat: number };
  cookingTime: number;
  difficulty: string;
  image: string;
  rating: number;
  reviews: any[];
  relatedProducts: any[];
  
  // UI용 계산 필드 (선택적)
  matchRate?: number; 
  calories?: number; // 호환성용
}

// 식단 아이템
export interface MealPlanItem {
  recipe: Recipe;
  memberIds: string[]; // 식사하는 멤버 ID 리스트
  isCompleted?: boolean;
}

// 일별 식단 계획
export interface DailyMealPlan {
  date: string; // YYYY-MM-DD
  meals: {
    BREAKFAST: MealPlanItem[];
    LUNCH: MealPlanItem[];
    DINNER: MealPlanItem[];
  };
}

// 쇼핑몰 상품
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

// 장바구니 아이템
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

// 커뮤니티 게시글
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

// 식사 스케줄 설정 타입
export interface DefaultMealSettings {
[key: string]: { breakfast: boolean; lunch: boolean; dinner: boolean };
  // Key는 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN' 사용
}

// 리뷰 및 연관 상품 (레시피 하위)
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
