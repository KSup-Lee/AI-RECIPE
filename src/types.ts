
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  avatar: string;
}

export interface Member {
  id: string;
  name: string;
  gender: 'M' | 'F';
  birthDate: string; // YYYY-MM-DD
  avatarColor: string;
  relationship: 'ME' | 'FAMILY'; // To distinguish primary user

  // Basic Profile
  height?: number; // cm
  weight?: number; // kg
  bodyType?: 'Slim' | 'Average' | 'Muscular' | 'Chubby';

  // Health
  hasNoAllergy: boolean;
  allergies: string[];
  hasNoDisease: boolean;
  diseases: string[];

  // Preferences
  proteinFocus: boolean; // High protein preference
  quickOnly: boolean; // Prefers < 20 mins
  likes: string[];
  dislikes: string[];
  targetCalories: number;
}

export type IngredientCategory = 'VEGETABLE' | 'MEAT' | 'SEAFOOD' | 'FRUIT' | 'DAIRY' | 'SAUCE' | 'GRAIN' | 'PROCESSED' | 'ETC';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  expiryDate: string; // ISO date
  storage: 'FRIDGE' | 'FREEZER' | 'ROOM';
  image: string; // URL or Emoji
}

export interface PredefinedIngredient {
  name: string;
  category: IngredientCategory;
  icon: string; // Emoji or Image URL
  defaultStorage: 'FRIDGE' | 'FREEZER' | 'ROOM';
  defaultExpiryDays: number; // Days to add to current date
}

export interface Nutrition {
  calories: number;
  carbs: number;  // g
  protein: number; // g
  fat: number;     // g
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  image?: string;
  rating: number;
  content: string;
  date: string;
}

export interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  tags: string[]; // Main ingredients or themes
  allergens: string[];
  category: 'KOREAN' | 'WESTERN' | 'JAPANESE' | 'CHINESE' | 'FUSION';
  type: 'RICE' | 'SOUP' | 'MAIN' | 'SIDE' | 'DESSERT' | 'NOODLE';
  ingredients: { name: string; amount: string }[];
  steps: string[];
  isBookmarked?: boolean;

  // Added fields
  nutrition: Nutrition;
  cookingTime: number; // minutes
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  matchRate?: number; // Calculated field
  rating: number;     // Average star rating
  reviews: Review[];
  relatedProducts: RelatedProduct[];
}

export interface MealPlanItem {
  recipe: Recipe;
  memberIds: string[]; // Changed from peopleCount to track WHO is eating
  isCompleted?: boolean;
}

export interface DailyMealPlan {
  date: string; // ISO date YYYY-MM-DD
  meals: {
    BREAKFAST: MealPlanItem[];
    LUNCH: MealPlanItem[];
    DINNER: MealPlanItem[];
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discountRate?: number;
  rating: number;
  image: string;
  tags: string[]; // BEST, HOT
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
  userId: string;
  userName: string;
  userAvatar: string;
  image: string;
  content: string;
  likes: number;
  date: string;
}

export interface DefaultMealSettings {
  weekday: {
    BREAKFAST: string[];
    LUNCH: string[];
    DINNER: string[];
  };
  weekend: {
    BREAKFAST: string[];
    LUNCH: string[];
    DINNER: string[];
  };
}

export interface PredefinedIngredient {
  name: string;
  category: IngredientCategory;
  icon: string;
  defaultStorage: 'FRIDGE' | 'FREEZER' | 'ROOM';
  defaultExpiryDays: number;
  // [추가] 단위 변환용 데이터
  defaultUnit: string;        // 기본 단위 (예: '개', 'g')
  baseGram: number;           // 1단위당 무게 (예: 감자 1개 = 150g, 고기 1g = 1g)
  suggestedUnits: string[];   // 선택 가능한 단위 목록
}
