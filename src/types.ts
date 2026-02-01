// ... (User, UserRole 등 상단 동일)

export interface DefaultMealSettings {
  [key: string]: { breakfast: boolean; lunch: boolean; dinner: boolean };
}

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

  // 🌟 [추가] 장보기 주기 (일 단위)
  shoppingCycle?: number; 

  proteinFocus: boolean; 
  quickOnly: boolean; 
  likes: string[];
  targetCalories: number;
}

// ... (나머지 하단 동일: Ingredient, Recipe, MealPlanItem 등)
export type IngredientCategory = 'VEGETABLE' | 'MEAT' | 'SEAFOOD' | 'FRUIT' | 'DAIRY' | 'SAUCE' | 'GRAIN' | 'PROCESSED' | 'ETC';
export interface Ingredient { id: string; name: string; category: IngredientCategory; quantity: number; unit: string; expiryDate: string; storage: 'FRIDGE' | 'FREEZER' | 'ROOM'; image: string; isFavorite?: boolean; }
export interface PredefinedIngredient { name: string; category: IngredientCategory; icon: string; defaultStorage: 'FRIDGE' | 'FREEZER' | 'ROOM'; defaultExpiryDays: number; defaultUnit: string; baseGram?: number; suggestedUnits?: string[]; expiry?: number; unit?: string; }
export interface Recipe { id: string; name: string; type: any; category: any; tags: string[]; allergens: string[]; ingredients: { name: string; amount: string }[]; steps: string[]; nutrition: { calories: number; carbs: number; protein: number; fat: number }; cookingTime: number; difficulty: string; image: string; rating: number; reviews: any[]; relatedProducts: any[]; matchRate?: number; calories?: number; }
export interface MealPlanItem { recipe: Recipe; memberIds: string[]; isCompleted?: boolean; }
export interface DailyMealPlan { date: string; meals: { BREAKFAST: MealPlanItem[]; LUNCH: MealPlanItem[]; DINNER: MealPlanItem[]; }; }
export interface Product { id: string; name: string; price: number; discountRate?: number; rating: number; image: string; tags: string[]; link: string; category: string; }
export interface CartItem { id: string; product: Product; quantity: number; }
export interface Post { id: string; userId?: string; userName?: string; userAvatar?: string; image?: string; content: string; likes: number; date?: string; title?: string; author?: string; uid?: string; createdAt?: any; }
export interface Review { id: string; userId: string; userName: string; rating: number; comment: string; date: string; }
export interface RelatedProduct { name: string; price: number; image: string; link: string; }
