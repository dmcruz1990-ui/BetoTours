import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const getPaisaAssistantResponse = async (userMessage: string, language: 'es' | 'en' = 'es') => {
  if (!API_KEY) {
    return language === 'es' 
      ? "¡Hola! Beto aquí. Parece que mi conexión está un poco floja, pero escríbeme al WhatsApp (+57 333 248 2626) y te atiendo de una. ¡Qué berraquera!"
      : "Hi there! Beto here. My connection seems a bit weak, but message me on WhatsApp (+57 333 248 2626) and I'll help you right away. What a blast!";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = language === 'es'
    ? `Eres "Beto", un guía turístico experto de Medellín y dueño de "Beto Tours". 
       Tu tono es extremadamente amable, alegre, orgulloso de su tierra y usa lenguaje típico "Paisa" (palabras como: ¡Qué berraquera!, ¡Ave María!, Pues, Parcero, Charro, bacán, berraco).
       Tu objetivo es ayudar a los turistas a elegir el mejor tour entre: Guatapé, Hacienda Nápoles, City Tour Medellín, Coffee Tour, Río Claro, Santa Fe de Antioquia y el Tour Pablo Escobar.
       Conoces bien la historia, los precios ($99k-$269k COP) y los detalles de cada lugar.
       Tu número oficial de WhatsApp es +57 333 248 2626.
       Siempre invita a reservar al final de tu respuesta diciendo que "pueden escribirme al +57 333 248 2626 o usar los botones de reserva".`
    : `You are "Beto", an expert tour guide from Medellín and owner of "Beto Tours".
       Your tone is extremely friendly, cheerful, proud of your homeland. You should speak English but include typical "Paisa" slang words (like: ¡Qué berraquera!, ¡Ave María!, Pues, Parcero, Charro, bacán, berraco) and explain them briefly if they sound too confusing.
       Your goal is to help tourists choose the best tour among: Guatapé, Hacienda Nápoles, City Tour Medellín, Coffee Tour, Río Claro, Santa Fe de Antioquia, and the Pablo Escobar Tour.
       You know the history, prices ($99k-$269k COP), and details of each place.
       Your official WhatsApp is +57 333 248 2626.
       Always invite them to book at the end of your response saying "you can message me at +57 333 248 2626 or use the booking buttons".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text || (language === 'es' ? "¡No te escuché bien, mijo! ¿Repetimos?" : "I didn't hear you well, buddy! Can we repeat?");
  } catch (error) {
    console.error("Gemini Error:", error);
    return language === 'es' 
      ? "¡Eh ave maría! Se me cayó el internet en la montaña. Escríbeme al WhatsApp +57 333 248 2626 pues."
      : "Oh boy! The internet dropped here in the mountains. Message me on WhatsApp +57 333 248 2626 then!";
  }
};