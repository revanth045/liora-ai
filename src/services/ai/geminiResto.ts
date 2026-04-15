import { getAiClient, generateFoodImage } from "../../../services/geminiService";

export type RestoAIResult = { text?: string; imageUrl?: string; sources?: {title:string;url:string}[] };

export async function restoSuggestCopy(prompt: string): Promise<RestoAIResult> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return { text: response.text };
  } catch (e) {
    console.error("restoSuggestCopy failed", e);
    throw new Error("Failed to generate marketing copy.");
  }
}

export async function restoGenImagePrompt(dishOrTheme: string): Promise<RestoAIResult> {
  try {
    const base64Image = await generateFoodImage(dishOrTheme);
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;
    return { imageUrl };
  } catch (e) {
    console.error("restoGenImagePrompt failed", e);
    throw new Error("Failed to generate image.");
  }
}
