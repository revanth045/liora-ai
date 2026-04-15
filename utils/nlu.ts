import { RestaurantInfo } from "../types";

/**
 * Classifies the user's intent based on keywords in the text.
 * @param text The user's input text.
 * @returns The classified intent.
 */
export function intentOf(text: string): "NEARBY" | "SHOW_MENU" | "PLAN_MEAL" | "SMALL_TALK" | "UNKNOWN" | "SHOW_SPECIALS" {
  if (/specials|deals|what's good/i.test(text)) return "SHOW_SPECIALS";
  if (/menu|see.*menu|show.*menu/i.test(text)) return "SHOW_MENU";
  if (/nearby|close|around me/i.test(text)) return "NEARBY";
  if (/plan|mood|what should i eat|meal/i.test(text)) return "PLAN_MEAL";
  if (/thank|hi|hello|hey/i.test(text)) return "SMALL_TALK";
  return "UNKNOWN";
}


/**
 * Extracts a specific restaurant name from the user's text, prioritizing direct mentions over context.
 * @param text The user's input text.
 * @param lastRestaurant The most recently mentioned restaurant for context.
 * @param candidates A list of potential restaurant candidates to check for direct mentions.
 * @returns The extracted restaurant name or undefined.
 */
export function inferRestaurant(
    text: string, 
    lastRestaurant?: RestaurantInfo, 
    candidates?: RestaurantInfo[]
): RestaurantInfo | undefined {
    // 1. Prioritize direct mentions from the list of candidates
    const directMention = candidates?.find(c => {
        // Escape special regex characters in the name and use word boundaries for accuracy
        const escapedName = c.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        return new RegExp(`\\b${escapedName}\\b`, "i").test(text)
    });

    if (directMention) {
        return directMention;
    }

    // 2. If no direct mention, check for contextual pronouns
    if (/their|that place|there|that one/i.test(text) && lastRestaurant) {
        return lastRestaurant;
    }
    
    // 3. No restaurant could be inferred
    return undefined;
}

const cuisineMapping: { [key: string]: string[] } = {
    'Italian': ['italian', 'pasta', 'pizza'],
    'Mexican': ['mexican', 'tacos', 'burritos'],
    'Chinese': ['chinese', 'dim sum', 'noodles'],
    'Japanese': ['japanese', 'sushi', 'ramen'],
    'Indian': ['indian', 'curry', 'tandoori'],
    'Thai': ['thai'],
    'Mediterranean': ['mediterranean', 'greek'],
    'American': ['american', 'burgers', 'diner', 'bbq'],
    'Cafe': ['cafe', 'coffee', 'bakery', 'sandwiches'],
    'Seafood': ['seafood', 'fish'],
    'Vegetarian': ['vegetarian', 'veggie'],
    'Vegan': ['vegan'],
};

/**
 * Infers a cuisine type from the user's text.
 * @param text The user's input text.
 * @returns The inferred cuisine type (e.g., "Italian") or undefined if no match is found.
 */
export function inferCuisine(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    for (const cuisine in cuisineMapping) {
        for (const keyword of cuisineMapping[cuisine]) {
            // Match keyword with optional 's' or 'es' for plurals
            if (new RegExp(`\\b${keyword}(s|es)?\\b`, 'i').test(lowerText)) {
                return cuisine;
            }
        }
    }
    return undefined;
}