import { GoogleGenAI } from "@google/genai";

export const getPaisaAssistantResponse = async (userMessage: string, language: 'es' | 'en' = 'es') => {
  // Inicialización dentro del scope del llamado para usar la key más reciente.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = language === 'es'
    ? `Eres "Beto", el mejor guía de Medellín. Hablas con alegría, orgullo paisa y usas jerga (¡Qué berraquera!, Pues, Parce). Ayuda a elegir tours: Guatapé, Hacienda Nápoles, Comuna 13, Café. Los precios van de $99k a $269k. Tu WhatsApp es +57 333 248 2626.`
    : `You are "Beto", Medellin's best guide. Friendly, cheerful, and proud. Use Paisa slang (Parce, Pues). Help choosing tours: Guatapé, Hacienda Nápoles, Comuna 13, Coffee. Prices $99k-$269k. WhatsApp +57 333 248 2626.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    // Uso de .text directo como indica la guía.
    return response.text || (language === 'es' ? "¡No te escuché bien, mijo!" : "Didn't hear you well!");
  } catch (error) {
    console.error("Gemini Error:", error);
    return language === 'es' 
      ? "¡Eh ave maría! Escríbeme al WhatsApp +57 333 248 2626 mejor."
      : "Oh boy! Better message me on WhatsApp +57 333 248 2626.";
  }
};