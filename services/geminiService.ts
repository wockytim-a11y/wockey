
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchHealthTip(): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "The user is taking a 30-second 'ocular rest' break from their screen. Suggest a very quick 1-sentence eye exercise or a positive health affirmation to encourage looking away from the screen.",
      config: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });
    return response.text.trim() || "Look at something 20 feet away for 20 seconds.";
  } catch (error) {
    console.error("Gemini tip fetch failed:", error);
    return "Blink rapidly for a few seconds to refresh your eyes.";
  }
}
