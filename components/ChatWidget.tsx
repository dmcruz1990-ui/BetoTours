import React, { useState, useRef, useEffect } from 'react';
import { getPaisaAssistantResponse } from '../services/geminiService';

interface ChatWidgetProps {
  language: 'es' | 'en';
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const initialBotMessage = language === 'es' 
    ? '¡Hola pues! Soy Beto. ¿En qué le puedo ayudar hoy, mijo? ¿Buscando un tour bacán por Medellín?'
    : "Hi there! I'm Beto. How can I help you today, buddy? Looking for a cool tour in Medellín?";

  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  
  useEffect(() => {
    setMessages([{ role: 'bot', text: initialBotMessage }]);
  }, [language]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await getPaisaAssistantResponse(userMsg, language);
    setMessages(prev => [...prev, { role: 'bot', text: response }]);
    setIsLoading(false);
  };

  const assistantTitle = language === 'es' ? 'Beto (Experto Paisa)' : 'Beto (Paisa Expert)';
  const statusLabel = language === 'es' ? 'En línea y listo, pues' : 'Online and ready then';
  const placeholder = language === 'es' ? 'Pregúntele a Beto...' : 'Ask Beto...';
  const buttonLabel = language === 'es' ? '¡Hablemos pues!' : 'Let\'s talk then!';

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-green-600 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3 text-white">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <i className="fa-solid fa-user-tie text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="font-bold">{assistantTitle}</p>
                <p className="text-xs opacity-90">{statusLabel}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-75">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          
          <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-green-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex space-x-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t flex space-x-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={placeholder} 
              className="flex-grow px-4 py-2 rounded-full border focus:outline-none focus:border-green-500 text-sm"
            />
            <button 
              onClick={handleSend}
              className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-700 shadow-md transition"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 hover:scale-110 transition-all duration-300 flex items-center space-x-2 border-4 border-white"
        >
          <i className="fa-solid fa-comments text-2xl"></i>
          <span className="hidden sm:inline font-bold">{buttonLabel}</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;