
export type View = 'home' | 'dating' | 'fitness' | 'account' | 'support' | 'nearby' | 'planner' | 'favorites' | 'calorie_log' | 'date_night' | 'visualizer' | 'video' | 'parser' | 'onboarding' | 'chef' | 'login' | 'hotels' | 'ai_waiter' | 'chef_mode' | 'ai_chat' | 'checkout' | 'profile' | 'offers' | 'orders' | 'dine_in' | 'restaurants';

export enum MessageAuthor {
    USER = 'user',
    LIORA = 'liora',
    SYSTEM = 'system'
}

export interface ChatMessage {
    id: string;
    author: MessageAuthor;
    text: string;
    groundingChunks?: any[];
    payload?: any;
    route?: {
        view: View;
        params?: any;
    };
}

export interface RestaurantInfo {
    name: string;
    place_id: string;
    distance_m: number;
    signature_dish_guess: string;
    price_level?: number;
    address?: string;
    imageUrl?: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
}

export interface MealPlan {
    recommendations: {
        title: string;
        why: string;
    }[];
}

export interface RecipeSuggestion {
    recipeName: string;
    ingredients: string[];
}

export interface ChefRecipeJson {
    title: string;
    servings: number;
    prepTime?: string;
    cookTime?: string;
    difficulty?: string;
    cuisine?: string;
    whyItWorks?: string;
    ingredients: { name: string; qty: string; notes?: string }[];
    steps: string[];
    image_prompt: string;
    tips: string[];
    substitutions?: string[];
}

export interface FoodAnalysis {
    dish: string;
    keyTechniques: string[];
    preparationSteps: string[];
    proTips: string[];
    difficulty: string;
    estimatedTime: string;
    chefNote: string;
    platingNote: string;
}

export interface GeneratedRecipeWithSummary {
    recipe: ChefRecipeJson;
    summary: string;
}

export interface ChefDashboardResult {
    short_description: string;
    variants: { title: string; snippet: string }[];
}

export interface ParsedMenuItem {
    recipeName: string;
    ingredients: string[];
}

export interface MenuSummary {
    headline: string;
    sub: string;
    tags: string[];
}

export interface UserProfileData {
    name: string;
    city: string;
    budget: string;
    cuisines: string[];
    spice: string | number;
    allergens: string[];
    diet: string;
    avoid: string[];
    vibe: string;
}

export interface StoredUserProfile {
    summary: string;
    profile: UserProfileData;
    aiPreferences?: {
        tone: 'direct' | 'friendly' | 'playful';
        style: 'classic' | 'adventurous' | 'healthy';
    };
}

export interface SupportRequestResult {
    response_text: string;
    action_json: {
        intent: "ACCOUNT" | "ORDER_STATUS" | "REFUND" | "ALLERGY_UPDATE" | "FEEDBACK";
        confidence: number;
        action_required: boolean;
        fields: any;
    };
}

export interface RestaurantSupportRequestResult {
    response_text: string;
    action_json: {
        intent: "BILLING_INQUIRY" | "TECHNICAL_SUPPORT" | "FEATURE_REQUEST" | "ACCOUNT_UPDATE" | "GENERAL_QUESTION";
        confidence: number;
        action_required: boolean;
        urgency: "low" | "medium" | "high";
        fields: any;
    };
}

export interface CalorieLogItem {
    line: string;
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
}

export interface CalorieLogResult {
    items: CalorieLogItem[];
    totals: {
        calories: number;
        protein_g: number;
        fat_g: number;
        carbs_g: number;
    };
    notes: string;
}

export interface FavoriteFood extends CalorieLogItem {
    id: string;
}

export interface GeneratedMenu {
    items: { name: string; description: string; price: string }[];
    heroImagePrompt: string;
}

export interface MenuLinkData {
    title: string;
    url: string;
}

export interface GeneratedMenuData {
    type: 'link' | 'generated';
    title?: string;
    url?: string;
    items?: { name: string; description: string; price: string }[];
    heroImage?: string;
}

export interface SpecialsResult {
    specials: any[];
    recap: string;
}

export interface DietaryRestrictions {
    presets: string[];
    custom: string;
}

export interface OnboardingAnswers {
    diet: DietaryRestrictions;
    cuisines: string[];
    budget: string;
    spice: number;
    avoid: string;
    vibe: string;
    // Extended dietary preferences
    allergies?: string[];
    severeAllergy?: boolean;
    lifestyle?: string;
    religious?: string[];
    customReligious?: string;
    healthNeeds?: string[];
    notes?: string;
    discountClaimed?: boolean;
}

export interface DateNightPick {
    name: string;
    cuisine?: string;
    vibe?: string;
    why_matched?: string;
    place_id?: string;
    rating?: number;
    imageUrl?: string;
    signature_item?: string;
    type?: "bar" | "movie" | "walk" | "event";
}

export interface DateNightResult {
    summary: string;
    plan: {
        plan_title: string;
        vibe: string;
        occasion: string;
        budget: string;
        dinner: DateNightPick;
        after_dinner: DateNightPick;
        dessert: {
            name: string;
            description: string;
            why_matched: string;
            map_place_id: string;
        };
        budget_alternative: {
            title: string;
            description: string;
            cost_estimate: string;
        };
        hotel?: {
            name: string;
            type: "hotel" | "motel";
            why_matched: string;
            map_place_id: string;
            rating: number;
        };
        conversation_starter: string;
        photo_moment: string;
        summary_for_user: string;
        timeline: { time: string; activity: string }[];
    };
}

export interface PastOrder {
    id: string;
    restaurantName: string;
    date: string;
    total: string;
    items: { name: string; price: string }[];
}

export type PlanInterval = 'month' | 'year' | 'lifetime';

export interface SubscriptionStatus {
    isPremium: boolean;
    plan: PlanInterval | null;
    startDate: string | null;
    renewalDate: string | null;
    isTrial: boolean;
    canceled: boolean;
}

export interface CreatorProfile {
    displayName: string;
    bio: string;
    specialties: string[];
    city: string;
    portfolioImages: string[];
    verified: boolean;
}

export interface LodgingRecommendation {
    name: string;
    location: string;
    rating: number;
    price: string;
    tags: string[];
}

export interface ReminderSettings {
    mealLogging: {
        enabled: boolean;
        breakfast: string;
        lunch: string;
        dinner: string;
    };
    drinkWater: {
        enabled: boolean;
        interval: number;
        startTime: string;
        endTime: string;
    };
}
