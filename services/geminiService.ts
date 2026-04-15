
import { GoogleGenAI, Content, Part, Tool } from "@google/genai";
import { 
    ChatMessage, 
    MessageAuthor, 
    RestaurantInfo, 
    MealPlan, 
    RecipeSuggestion, 
    ChefRecipeJson, 
    ChefDashboardResult, 
    ParsedMenuItem, 
    MenuSummary, 
    UserProfileData, 
    StoredUserProfile, 
    SupportRequestResult, 
    RestaurantSupportRequestResult, 
    CalorieLogResult, 
    GeneratedMenu, 
    GeneratedMenuData, 
    MenuLinkData, 
    GeneratedRecipeWithSummary,
    SpecialsResult,
    OnboardingAnswers,
    DateNightResult
} from "../types";
import { uid } from "../utils/uid";

// Initialize AI Client
export const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const SYSTEM = `IDENTITY & PERSONALITY
You are Liora, an AI Dining Companion & Relationship Concierge.
Your personality: warm, bright, concise, confident, Michelin-trained, science-based.

Your purpose is to help users:
- decide what to eat
- find restaurants
- plan date nights
- navigate dating & relationships
- understand how food affects mood, energy, sleep, and emotions

Every recommendation should combine:
- practical steps
- culinary skill
- nutrition science
- brain–gut insights
- relationship psychology (for date night)

ROLES YOU CAN PLAY
Liora can switch roles instantly when the user asks:
• Waiter: Greet, recommend, take orders, upsell.
• Chef: Recipes, techniques, timing, plating.
• Manager: SOPs, service recovery.
• Relationship Coach: Dating advice, conversation skills, understanding attraction.

RELATIONSHIP & DATE PSYCHOLOGY MODULE
When asked about dates or relationships, apply these concepts:
1. Misattribution of Arousal: Exciting activities (spicy food, heights) increase perceived attraction.
2. The Fantasy Phase: Early attraction is often idealized. Advise staying curious and authentic.
3. Connection Science: Deep questions build rapport faster than small talk.
4. Body Language: Open posture and mirroring increase connection.
5. Inclusivity: Provide advice suitable for men, women, and non-binary users. Tailor to the user's profile if known (e.g., introverts need lower-pressure tips).

KEY RULES (ALWAYS)
1. Ask Clarifying Questions: If details are missing, ask 2–3 short questions.
2. External Data: Use "map_place_id" placeholders for real places.
3. Output Style: Write in a warm, natural, conversational tone — like a knowledgeable friend talking to you. No markdown, no asterisks, no bullet dashes, no bold markers. Just plain, flowing sentences.

For restaurant suggestions, ALWAYS return a JSON array at the end of the response wrapped in markdown code blocks:
\`\`\`json
[
  {
    "name": "",
    "cuisine": "",
    "est_cost": "",
    "vibe": "",
    "what_to_order": "",
    "why_matched": "",
    "map_place_id": "",
    "rating": number,
    "distance": string
  }
]
\`\`\`
`;

export const RESTAURANT_GPT_SYSTEM_PROMPT = "You are an AI consultant for a restaurant owner. Analyze data and provide actionable insights.";

export const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data URL prefix
            resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Helper to extract JSON from mixed text/markdown
function extractJson<T>(text: string, isArray: boolean): { json: T | null, cleanText: string } {
    let json: T | null = null;
    let cleanText = text;
    let jsonStr = '';

    // 1. Try Markdown Code Block
    const codeBlockRegex = isArray 
        ? /```(?:json)?\s*(\[[\s\S]*?\])\s*```/ 
        : /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    
    const match = text.match(codeBlockRegex);
    if (match) {
        jsonStr = match[1];
        cleanText = text.replace(match[0], '').trim();
    } else {
        // 2. Fallback: Find first opening and last closing
        const startChar = isArray ? '[' : '{';
        const endChar = isArray ? ']' : '}';
        const start = text.indexOf(startChar);
        const end = text.lastIndexOf(endChar);
        
        if (start !== -1 && end !== -1 && end >= start) {
             const candidate = text.substring(start, end + 1);
             // More relaxed heuristic: Just check if it parses
             jsonStr = candidate;
             cleanText = text.replace(candidate, '').trim();
        }
    }

    if (jsonStr) {
        try {
            json = JSON.parse(jsonStr);
        } catch (e) {
            console.warn("JSON parse failed", e);
            if (!match) cleanText = text; 
        }
    }

    return { json, cleanText };
}

// --- Core Chat & Tools ---

export const chatWithHistory = async ({ history, user, location, userProfile }: { 
    history: { role: 'user' | 'assistant', content: string }[], 
    user: string, 
    location?: { latitude: number, longitude: number },
    userProfile?: StoredUserProfile | null
}): Promise<ChatMessage> => {
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash';
    
    let systemInstruction = SYSTEM;
    if (userProfile) {
        systemInstruction += `\nUser Profile: ${JSON.stringify(userProfile.profile)}`;
    }
    
    const tools: Tool[] = [
        { googleMaps: {} },
        { googleSearch: {} } 
    ];
    
    const toolConfig = location ? {
        retrievalConfig: {
            latLng: {
                latitude: location.latitude,
                longitude: location.longitude
            }
        }
    } : undefined;

    const contents: Content[] = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
    }));
    
    contents.push({ role: 'user', parts: [{ text: user }] });

    try {
        const result = await ai.models.generateContent({
            model: modelId,
            contents,
            config: {
                systemInstruction,
                tools,
                toolConfig
            }
        });

        const responseText = result.text || "I'm sorry, I couldn't generate a response.";
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        // Extract JSON and Clean Text
        const { json: parsedJson, cleanText } = extractJson<any>(
            responseText, 
            responseText.trim().startsWith('[') || responseText.includes('```json\n[')
        );

        let finalPayload = undefined;

        if (parsedJson) {
            if (Array.isArray(parsedJson) && parsedJson[0]?.name) {
                 finalPayload = { type: 'nearby_guide_recommendations', data: parsedJson };
            } else if (parsedJson.plan && parsedJson.timeline) {
                 finalPayload = { type: 'date_night_planner_plan', data: parsedJson };
            } else if (parsedJson.recipes) {
                finalPayload = { type: 'recipe_suggestions', suggestions: parsedJson.recipes };
            } else if (parsedJson.recommendations && parsedJson.summary) {
                finalPayload = { type: 'lodging_recommendations', recommendations: parsedJson.recommendations, summary: parsedJson.summary };
            }
        } else if (groundingChunks.some(c => c.maps) && (user.toLowerCase().includes('restaurant') || user.toLowerCase().includes('food'))) {
             const restaurants: RestaurantInfo[] = groundingChunks
                .filter(c => c.maps)
                .map(c => ({
                    name: c.maps!.title,
                    place_id: c.maps!.placeId,
                    distance_m: 0, 
                    signature_dish_guess: "Check menu",
                    address: "", 
                    latitude: 0,
                    longitude: 0
                }));
             if (restaurants.length > 0) {
                 finalPayload = { type: 'nearby_restaurants', restaurants };
             }
        }

        // Determine final text to display
        let textToDisplay = responseText;
        
        if (parsedJson) {
            textToDisplay = cleanText.trim();
            if (!textToDisplay) {
                // AI returned ONLY JSON. Provide context based on payload type.
                if (finalPayload?.type === 'nearby_guide_recommendations' || finalPayload?.type === 'nearby_restaurants') {
                    textToDisplay = "Here are some great options for you.";
                } else if (finalPayload?.type === 'date_night_planner_plan') {
                    textToDisplay = "Here is a plan for your night.";
                } else {
                    textToDisplay = ""; 
                }
            }
        }

        return {
            id: uid(),
            author: MessageAuthor.LIORA,
            text: textToDisplay,
            groundingChunks,
            payload: finalPayload
        };

    } catch (error: any) {
        console.error("Chat Error", error);
        
        let errorMessage = "I encountered an error processing your request.";
        
        // Check for Rate Limit / Quota Exceeded (429)
        if (
            error.status === 429 || 
            error.code === 429 ||
            error.message?.includes('429') || 
            error.message?.includes('quota') ||
            error.message?.includes('RESOURCE_EXHAUSTED')
        ) {
            errorMessage = "I'm currently experiencing high traffic and have reached my usage limit (429). Please try again in a minute.";
        }

        return {
            id: uid(),
            author: MessageAuthor.SYSTEM,
            text: errorMessage
        };
    }
};

export const searchNearbyWithProfile = async ({ location, userProfile, query }: { 
    location: { latitude: number, longitude: number },
    userProfile?: StoredUserProfile | null,
    query?: string
}): Promise<ChatMessage> => {
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash';
    
    const prompt = `ROLE: Liora - Nearby Guide

INPUTS:
- location: ${location.latitude}, ${location.longitude}
- user_profile: ${userProfile ? JSON.stringify(userProfile.profile) : 'null'}
- user_query: ${query || "Find nearby recommendations"}

TASK:
1) Recommend 5 top matches based on profile and query.
2) Follow Liora's persona: Warm, Michelin-trained, concise.
3) Return JSON format wrapped in markdown blocks:
\`\`\`json
[
  {
    "name": "",
    "cuisine": "",
    "vibe": "",
    "est_cost": "",
    "what_to_order": "",
    "why_matched": "",
    "map_place_id": "",
    "rating": number,
    "distance": "e.g. 0.3 mi"
  }
]
\`\`\`
`;

    const tools: Tool[] = [{ googleMaps: {} }];
    const toolConfig = {
        retrievalConfig: {
            latLng: {
                latitude: location.latitude,
                longitude: location.longitude
            }
        }
    };

    try {
        const result = await ai.models.generateContent({
            model: modelId,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                tools,
                toolConfig
            }
        });

        const rawText = result.text || "I couldn't find anything right now.";
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const { json: recommendations, cleanText } = extractJson<any[]>(rawText, true);
        
        let finalPayload = undefined;

        if (Array.isArray(recommendations) && recommendations.length > 0) {
            if (groundingChunks.length > 0) {
                recommendations.forEach((rec: any) => {
                     const match = groundingChunks.find(c => c.maps && c.maps.title.toLowerCase().includes(rec.name.toLowerCase()));
                     if (match && match.maps) {
                         rec.map_place_id = match.maps.placeId;
                     }
                });
            }
            finalPayload = { type: 'nearby_guide_recommendations', data: recommendations };
        }

        const displayText = cleanText.trim() || (finalPayload ? "Here are some top matches for you." : rawText);

        return {
            id: uid(),
            author: MessageAuthor.LIORA,
            text: displayText,
            groundingChunks,
            payload: finalPayload as any
        };

    } catch (error) {
        console.error("Nearby Guide Error", error);
        throw error;
    }
};

export const findNearbyBites = async (cuisine: string, location: string) => {
    return [];
};

export const searchMenuLink = async (restaurantName: string, location?: string): Promise<MenuLinkData | null> => {
    const ai = getAiClient();
    const prompt = `Find the official menu URL for ${restaurantName}${location ? ` in ${location}` : ''}. Return a JSON object with { "title": "Menu Page Title", "url": "https://..." }.`;
    
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json'
            }
        });
        return JSON.parse(result.text || 'null');
    } catch {
        return null;
    }
};

export const parseMenuFromText = async (text: string): Promise<ParsedMenuItem[]> => {
    const ai = getAiClient();
    const prompt = `Extract menu items from this text: "${text}". Return JSON array: [{ "recipeName": string, "ingredients": string[] }]`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '[]');
};

export const summarizeMenuForCard = async (menu: ParsedMenuItem[]): Promise<MenuSummary> => {
    const ai = getAiClient();
    const prompt = `Summarize this menu for a restaurant card. JSON: { "headline": string, "sub": string, "tags": string[] }`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: JSON.stringify(menu),
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

export const planMeal = async (constraints: any): Promise<MealPlan> => {
    const ai = getAiClient();
    const prompt = `Plan a meal based on these constraints: ${JSON.stringify(constraints)}. Return JSON conforming to MealPlan interface.`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

export const planDateNight = async (inputs: {
    vibe: string;
    occasion: string;
    budget: string;
    userProfile?: StoredUserProfile | null;
    location?: { latitude: number; longitude: number };
}): Promise<DateNightResult | null> => {
    
    try {
        const ai = getAiClient();
        const prompt = `ROLE: Liora - Date Night Planner

INPUTS:
- form_vibe: ${inputs.vibe}
- form_occasion: ${inputs.occasion}
- form_budget: ${inputs.budget}
- user_profile: ${inputs.userProfile ? JSON.stringify(inputs.userProfile.profile) : 'null'}

BEHAVIOR:
1) Use Date Night psychology (excitement vs comfort).
2) Recommend a full plan including dessert and a budget-friendly alternative.
3) Use Google Maps if location is available.

OUTPUT:
First: a short, warm summary (2–4 sentences).
Then: a JSON object wrapped in markdown code blocks:
\`\`\`json
{
  "plan_title": "",
  "vibe": "",
  "occasion": "",
  "budget": "",
  "dinner": {
    "name": "",
    "cuisine": "",
    "vibe": "",
    "signature_item": "",
    "why_matched": "",
    "place_id": "", 
    "rating": number,
    "imageUrl": ""
  },
  "after_dinner": {
    "name": "",
    "type": "bar|movie|walk|event",
    "why_matched": "",
    "map_place_id": ""
  },
  "dessert": {
    "name": "Name of dessert spot",
    "description": "Short description",
    "why_matched": "Why this is a sweet ending",
    "map_place_id": ""
  },
  "budget_alternative": {
    "title": "Thrifty Twist",
    "description": "A lower cost idea matching the vibe",
    "cost_estimate": "e.g. $30 total"
  },
  "hotel": {
    "name": "",
    "type": "hotel|motel",
    "why_matched": "",
    "map_place_id": "",
    "rating": number
  },
  "conversation_starter": "",
  "photo_moment": "",
  "summary_for_user": "",
  "timeline": [{"time": "", "activity": ""}]
}
\`\`\``;

        const tools: Tool[] = [{ googleMaps: {} }];
        const toolConfig = inputs.location ? {
            retrievalConfig: {
                latLng: {
                    latitude: inputs.location.latitude,
                    longitude: inputs.location.longitude
                }
            }
        } : undefined;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools,
                toolConfig,
                // Fix: responseMimeType is not allowed when using the googleMaps tool.
                // Removing responseMimeType and responseSchema.
            }
        });

        // Since we removed responseMimeType, we must use extraction logic
        const { json: planData, cleanText } = extractJson<any>(result.text || '', false);
        
        if (!planData || !planData.plan_title) {
            console.error("No valid plan data in Date Night response");
            return null;
        }

        const summary = cleanText.trim() || planData.summary_for_user || "Here is your date night plan.";

        return {
            summary,
            plan: planData
        };

    } catch (error) {
        console.error("Date Night Planning Error", error);
        throw error;
    }
};

export const generateMenuFromSearch = async (name: string, dish: string): Promise<GeneratedMenu> => {
    const ai = getAiClient();
    const prompt = `Generate a sample menu for a restaurant named "${name}" famous for "${dish}". JSON: { "items": [{ "name": string, "description": string, "price": string }], "heroImagePrompt": string }`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

// --- Media Generation ---

export const generateFoodImage = async (prompt: string, options?: { model?: string, size?: '1K' | '2K' | '4K' }): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const model = options?.model || 'gemini-2.5-flash-image';
    const imageSize = options?.size || '1K';

    const config: any = {};
    
    if (model === 'gemini-3-pro-image-preview') {
        config.imageConfig = {
            aspectRatio: "1:1",
            imageSize: imageSize
        };
    } else {
        config.imageConfig = {
            aspectRatio: "1:1"
        };
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [{ text: prompt }],
        },
        config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    
    throw new Error("No image generated");
};

export const generateVideo = async (imageFile: File, prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
    const ai = getAiClient();
    const base64Image = await fileToGenerativePart(imageFile);
    
    if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }
    const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let operation = await freshAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: {
            imageBytes: base64Image,
            mimeType: imageFile.type
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await freshAi.operations.getVideosOperation({ operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed");

    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

// --- Specific Generators ---

export const generateChefRecipe = async (idea: string): Promise<GeneratedRecipeWithSummary> => {
    const ai = getAiClient();
    const prompt = `You are Chef Marco Bellini — a world-class culinary master with over 50 years of professional kitchen experience across Michelin-starred restaurants in Paris, Rome, Tokyo, and New York. You have cooked for royalty, trained under legendary chefs, and authored three acclaimed cookbooks. You hold deep expertise in flavour science, French classical technique, Asian fusion, and modern gastronomy.

Your role is Chef Tutor. When a user provides a list of INGREDIENTS, your FIRST job is to assess those ingredients and determine the best, most harmonious dish possible — considering flavour profiles, texture contrasts, cooking chemistry, and seasonality. Then craft a complete, restaurant-quality recipe.

When working with provided ingredients:
- Identify why these ingredients work together and name the best dish
- Hint at 1-2 alternative dishes in your tips
- Reveal the professional technique that elevates it beyond average home cooking
- Include a Chef's Secret tip from your 50+ years of experience
- Write every step with authority and precision — include temperature, timing, and sensory cues (e.g. "until the onions are translucent with slight golden edges") never vague instructions

Customer's request: "${idea}"

Respond strictly as valid JSON (no markdown fences, no code blocks):
{
  "recipe": {
    "title": "string",
    "servings": 2,
    "prepTime": "string e.g. 15 mins",
    "cookTime": "string e.g. 30 mins",
    "difficulty": "Easy|Intermediate|Advanced|Chef Level",
    "cuisine": "string e.g. Italian",
    "whyItWorks": "string — 1-2 sentences on the flavour science or ingredient harmony",
    "ingredients": [{"name": "string", "qty": "string", "notes": "optional prep note e.g. finely diced"}],
    "steps": ["detailed step with temperature and sensory cues"],
    "image_prompt": "cinematic food photography prompt for this specific dish",
    "tips": ["pro tip from 50+ years of cooking"],
    "substitutions": ["e.g. No cream? Use full-fat coconut milk for a Thai twist"]
  },
  "summary": "2-3 sentences in Chef Marco's passionate voice explaining why this dish is special and what makes it sing"
}`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

export const generateFoodAnalysis = async (dish: string): Promise<{
    dish: string;
    keyTechniques: string[];
    preparationSteps: string[];
    proTips: string[];
    difficulty: string;
    estimatedTime: string;
    chefNote: string;
    platingNote: string;
}> => {
    const ai = getAiClient();
    const prompt = `You are Chef Marco Bellini, a culinary master with 50+ years of experience across Michelin-starred kitchens worldwide. A customer has just visualised the dish: "${dish}".

Give them professional guidance on how to recreate this dish at home. Be specific, practical, and inspiring. Share the professional techniques that separate truly great results from average home cooking.

Respond strictly as valid JSON (no markdown fences, no code blocks):
{
  "dish": "clean dish name",
  "keyTechniques": ["3-4 essential professional techniques specific to this dish"],
  "preparationSteps": ["5-7 concise but precise preparation steps for a home cook"],
  "proTips": ["3 tips from professional kitchen experience that genuinely change the outcome"],
  "difficulty": "Easy|Intermediate|Advanced",
  "estimatedTime": "total time e.g. 45 mins",
  "chefNote": "one personal sentence from Chef Marco about his experience with this dish",
  "platingNote": "how to plate and present it beautifully at home"
}`;

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(result.text || '{}');
};

export const generateChefDescriptions = async (inputs: any): Promise<ChefDashboardResult> => {
    const ai = getAiClient();
    const prompt = `Generate menu descriptions for: ${JSON.stringify(inputs)}. JSON: { "short_description": string, "variants": [{"title": string, "snippet": string}] }`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

export const generateUserProfile = async (answers: OnboardingAnswers): Promise<{summary: string, profile: UserProfileData}> => {
    const ai = getAiClient();
    const prompt = `You are a dining profile generator. Based on the user's answers below, return ONLY a raw JSON object (no markdown, no code fences) in exactly this shape:
{"summary":"<2-sentence friendly summary>","profile":{"name":"","city":"","budget":"${answers.budget}","cuisines":[],"spice":${answers.spice},"allergens":[],"diet":"","avoid":"","vibe":""}}

User answers: ${JSON.stringify(answers)}`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const rawText = result.text || '{}';
    const { json } = extractJson<{summary: string, profile: UserProfileData}>(rawText, false);
    if (json && json.summary && json.profile) return json;

    const fallback = JSON.parse(rawText.replace(/```json|```/g, '').trim() || '{}');
    if (fallback && fallback.summary) return fallback;

    throw new Error('Invalid profile response from AI');
};

export const createProfileFromForm = async (data: any): Promise<UserProfileData> => {
     const ai = getAiClient();
     const prompt = `Format this data into a UserProfileData JSON object: ${JSON.stringify(data)}`;
     const result = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: prompt,
         config: { responseMimeType: 'application/json' }
     });
     return JSON.parse(result.text || '{}');
};

export const generateSummaryForProfileData = async (data: any): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Write a 2 sentence summary for this dining profile: ${JSON.stringify(data)}`;
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return result.text || '';
};

export const classifySupportRequest = async (text: string): Promise<SupportRequestResult> => {
    const ai = getAiClient();
    const prompt = `Classify this support request: "${text}". JSON: { "response_text": string, "action_json": { "intent": "ACCOUNT"|"ORDER_STATUS"|"REFUND"|"ALLERGY_UPDATE"|"FEEDBACK", "confidence": number, "action_required": boolean, "fields": object } }`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

export const classifyRestaurantSupportRequest = async (text: string): Promise<RestaurantSupportRequestResult> => {
    const ai = getAiClient();
    const prompt = `Classify this restaurant support request: "${text}". JSON: { "response_text": string, "action_json": { "intent": "BILLING_INQUIRY"|"TECHNICAL_SUPPORT"|"FEATURE_REQUEST"|"ACCOUNT_UPDATE"|"GENERAL_QUESTION", "confidence": number, "action_required": boolean, "urgency": "low"|"medium"|"high", "fields": object } }`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

export const getCalorieLog = async (text: string, image?: {data: string, mimeType: string}): Promise<CalorieLogResult> => {
    const ai = getAiClient();
    const parts: Part[] = [];
    if (image) {
        parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
    }
    parts.push({ text: `Analyze this food log/image. JSON: { "items": [{ "line": string, "calories": number, "protein_g": number, "fat_g": number, "carbs_g": number }], "totals": { "calories": number, "protein_g": number, "fat_g": number, "carbs_g": number }, "notes": string }` });
    if (text) parts.push({ text: `User notes: ${text}` });

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts }],
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(result.text || '{}');
};

export const getRestaurantSpecials = async (query: string): Promise<SpecialsResult> => {
    return { specials: [], recap: "No specials found." };
};

export const chatWithRestaurantGpt = async (
    history: { role: string, parts: { text: string }[] }[], 
    userMessage: string, 
    context?: string
): Promise<string> => {
    const ai = getAiClient();
    const systemInstruction = context 
        ? `${RESTAURANT_GPT_SYSTEM_PROMPT}\n\n=== REAL-TIME BUSINESS DATA ===\n${context}\n\nINSTRUCTIONS:\n- Use the provided business data to give specific, tailored advice.\n- Analyze menu structure, pricing, and descriptions if relevant.\n- Reference engagement metrics (views, favorites) to suggest marketing or operational improvements.\n- If the menu is empty, suggest specific items based on the restaurant name or concept.` 
        : RESTAURANT_GPT_SYSTEM_PROMPT;

    const contents: Content[] = history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts
    }));
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction }
    });
    
    return result.text || '';
};
