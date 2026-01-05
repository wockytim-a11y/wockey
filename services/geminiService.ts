
import { GoogleGenAI } from "@google/genai";

export async function fetchHealthTip(): Promise<string> {
  const apiKey = process.env.API_KEY;

  // Fallback tips if no API key is provided
  const localTips = [
    "Look at an object at least 20 feet away for 20 seconds.",
    "Blink rapidly for a few seconds to moisten your eyes.",
    "Roll your eyes slowly in a circle to stretch the muscles.",
    "Close your eyes tightly for 5 seconds, then open wide.",
    "Take a deep breath and look out the nearest window."
  ];

  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.warn("Gemini API Key missing. Using local fallback tips.");
    return localTips[Math.floor(Math.random() * localTips.length)];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "The user is taking a 30-second 'ocular rest' break from their screen. Suggest a very quick 1-sentence eye exercise or a positive health affirmation to encourage looking away from the screen.",
      config: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });
    
    return response.text?.trim() || localTips[0];
  } catch (error) {
    console.error("Gemini tip fetch failed:", error);
    return localTips[1];
  }
}
