// --- 여기서부터 복사하세요 ---
const DataProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  const [recipes] = useState<Recipe[]>(DUMMY_RECIPES);
  const [fridge, setFridge] = useState<Ingredient[]>([]); 
  const [members, setMembers] = useState<Member[]>(DUMMY_MEMBERS);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>([TODAY_MEAL]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posts] = useState<Post[]>(DUMMY_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. 앱 켜지면 Supabase에서 냉장고 재료 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchFridge = async () => {
      const { data, error } = await supabase
        .from('fridge_ingredients')
        .select('*')
        .eq('user_id', user.id);
      
      if (data) setFridge(data as any);
      if (error) console.log('에러:', error);
    };
    fetchFridge();
  }, [user]);

  const [defaultSettings, setDefaultSettings] = useState<DefaultMealSettings>({
    weekday: {
      BREAKFAST: members.map(m => m.id),
      LUNCH: members.slice(0, 1).map(m => m.id), 
      DINNER: members.map(m => m.id),
    },
    weekend: {
      BREAKFAST: members.map(m => m.id),
      LUNCH: members.map(m => m.id),
      DINNER: members.map(m => m.id),
    }
  });
  
  const [mealModalData, setMealModalData] = useState<{ isOpen: boolean; recipe: Recipe | null }>({ isOpen: false, recipe: null });

  const addToCart = (product: any, quantity: number) => {
    setCart(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), product, quantity }]);
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  // 2. 재료 추가할 때 Supabase에도 저장하기
  const addIngredient = async (item: Ingredient) => {
    setFridge(prev => [...prev, item]); // 화면에 먼저 보여주기

    if (user) {
        await supabase.from('fridge_ingredients').insert([{
            user_id: user.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            storage: item.storage,
            expiry_date: item.expiryDate,
            image: item.image
        }]);
    }
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setFridge(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // 3. 재료 삭제할 때 Supabase에서도 지우기
  const deleteIngredient = async (id: string) => {
    setFridge(prev => prev.filter(item => item.id !== id));
    if (user) {
        await supabase.from('fridge_ingredients').delete().eq('id', id);
    }
  };

  const openMealModal = (recipe: Recipe) => { setMealModalData({ isOpen: true, recipe }); };
  const closeMealModal = () => { setMealModalData({ isOpen: false, recipe: null }); };

  const addToMealPlan = (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipe: Recipe, specificMembers?: string[]) => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const defaultMembers = isWeekend ? defaultSettings.weekend[type] : defaultSettings.weekday[type];
    const initialMembers = specificMembers || defaultMembers;

    setMealPlans(prev => {
        const existingPlanIndex = prev.findIndex(p => p.date === date);
        if (existingPlanIndex > -1) {
            const newPlans = [...prev];
            newPlans[existingPlanIndex] = {
                ...newPlans[existingPlanIndex],
                meals: {
                    ...newPlans[existingPlanIndex].meals,
                    [type]: [...newPlans[existingPlanIndex].meals[type], { recipe, memberIds: initialMembers, isCompleted: false }]
                }
            };
            return newPlans;
        } else {
            const newPlan: DailyMealPlan = {
                date: date,
                meals: {
                    BREAKFAST: [],
                    LUNCH: [],
                    DINNER: []
                }
            };
            newPlan.meals[type].push({ recipe, memberIds: initialMembers, isCompleted: false });
            return [...prev, newPlan];
        }
    });
    alert(`[${recipe.name}]이(가) ${date} ${type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : '저녁'} 식단에 추가되었습니다.`);
    closeMealModal();
  };

  const removeFromMealPlan = (date: string, type: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string) => {
    setMealPlans(prev => prev.map(plan => {
      if (plan.date !== date) return plan;
      return {
        ...plan,
        meals: {
          ...plan.meals,
          [type]: plan.meals[type].filter(item => item.recipe.id !== recipeId)
        }
      };
    }));
  };

  const updateMealMembers = (date: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', recipeId: string, memberId: string) => {
    setMealPlans(prev => prev.map(plan => {
      if (plan.date !== date) return plan;
      return {
        ...plan,
        meals: {
          ...plan.meals,
          [mealType]: plan.meals[mealType].map(item => {
            if (item.recipe.id === recipeId) {
                const isSelected = item.memberIds.includes(memberId);
                const newMemberIds = isSelected 
                    ? item.memberIds.filter(id => id !== memberId)
                    : [...item.memberIds, memberId];
                return { ...item, memberIds: newMemberIds };
            }
            return item;
          })
        }
      };
    }));
  };

  const saveDefaultSettings = (settings: DefaultMealSettings) => {
    setDefaultSettings(settings);
    alert('기본 식단 설정이 저장되었습니다.');
  };

  const cookRecipe = (recipe: Recipe) => {
    let deductedCount = 0;
    const newFridge = fridge.map(item => {
        const recipeIng = recipe.ingredients.find(ri => item.name.includes(ri.name) || ri.name.includes(item.name));
        if (recipeIng) {
            deductedCount++;
            return { ...item, quantity: Math.max(0, item.quantity - 1) };
        }
        return item;
    });
    
    if (deductedCount > 0) {
        setFridge(newFridge);
        alert(`냉장고에서 ${deductedCount}개의 재료를 사용했습니다.`);
    } else {
        alert('사용 가능한 냉장고 재료가 없습니다.');
    }
  };

  const addMember = (member: Member) => {
    setMembers(prev => [...prev, member]);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <DataContext.Provider value={{ recipes, fridge, members, mealPlans, cart, posts, searchQuery, setSearchQuery, addToCart, removeFromCart, addIngredient, updateIngredient, deleteIngredient, addToMealPlan, removeFromMealPlan, openMealModal, closeMealModal, mealModalData, updateMealMembers, defaultSettings, saveDefaultSettings, cookRecipe, addMember, updateMember, deleteMember }}>
      {children}
    </DataContext.Provider>
  );
};
// --- 여기까지 복사하세요 ---
