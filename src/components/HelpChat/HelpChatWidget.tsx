import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import helpFlowData from './help-flow.json';

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

interface FlowNode {
  message: string;
  options?: { text: string; next: string }[];
}

const HelpChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [currentNodeKey, setCurrentNodeKey] = useState('start');
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const flow = helpFlowData as Record<string, FlowNode>;

  const getInitialNodeKey = (pathname: string): string => {
    if (pathname.startsWith('/reservas')) return 'start_reservas';
    if (pathname.startsWith('/alunos')) return 'start_alunos';
    if (pathname.startsWith('/quadras')) return 'start_quadras';
    if (pathname.startsWith('/settings')) return 'start_settings';
    if (pathname.startsWith('/dashboard')) return 'start_dashboard';
    if (pathname.startsWith('/perfil')) return 'start_perfil';
    if (pathname.startsWith('/financeiro')) return 'start_financeiro';
    if (pathname.startsWith('/torneios')) return 'start_torneios';
    if (pathname.startsWith('/eventos')) return 'start_eventos';
    if (pathname.startsWith('/loja')) return 'start_loja';
    return 'start';
  };

  useEffect(() => {
    if (isOpen) {
      const initialNodeKey = getInitialNodeKey(location.pathname);
      const startNode = flow[initialNodeKey] || flow['start'];
      setHistory([{ sender: 'bot', text: startNode.message }]);
      setCurrentNodeKey(initialNodeKey);
    }
  }, [isOpen, location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleOptionClick = (text: string, nextNodeKey: string) => {
    const userMessage: Message = { sender: 'user', text };
    const nextNode = flow[nextNodeKey];
    
    if (nextNode) {
      const botMessage: Message = { sender: 'bot', text: nextNode.message };
      setHistory(prev => [...prev, userMessage, botMessage]);
      setCurrentNodeKey(nextNodeKey);
    }
  };

  const searchFlow = (query: string): string | null => {
    const keywords = query.toLowerCase().split(' ').filter(k => k.length > 2);
    if (keywords.length === 0) return null;

    let bestMatch = { key: null as string | null, score: 0 };

    for (const [key, node] of Object.entries(flow)) {
      let score = 0;
      if (node.options) {
        node.options.forEach(option => {
          keywords.forEach(kw => {
            if (option.text.toLowerCase().includes(kw)) {
              score += 2;
            }
          });
        });
      }
      keywords.forEach(kw => {
        if (node.message.toLowerCase().includes(kw)) {
          score += 1;
        }
      });
      
      if (score > bestMatch.score) {
        bestMatch = { key, score };
      }
    }

    return bestMatch.score > 0 ? bestMatch.key : null;
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage: Message = { sender: 'user', text: userInput };
    
    const bestMatchKey = searchFlow(userInput);

    if (bestMatchKey) {
      const botMessage: Message = { sender: 'bot', text: flow[bestMatchKey].message };
      setHistory(prev => [...prev, userMessage, botMessage]);
      setCurrentNodeKey(bestMatchKey);
    } else {
      const notFoundMessage: Message = { sender: 'bot', text: "Desculpe, não entendi sua pergunta. Que tal tentar uma destas opções?" };
      setHistory(prev => [...prev, userMessage, notFoundMessage]);
      setCurrentNodeKey('start');
    }

    setUserInput('');
  };

  const currentNode = flow[currentNodeKey];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="bg-brand-blue-600 text-white rounded-full p-4 shadow-lg"
          aria-label="Abrir chat de ajuda"
        >
          <MessageSquare className="h-6 w-6" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 w-80 h-[450px] bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl flex flex-col z-50 border border-brand-gray-200 dark:border-brand-gray-700"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-brand-gray-200 dark:border-brand-gray-700 flex-shrink-0">
              <h3 className="font-semibold text-brand-gray-900 dark:text-white">Assistente Virtual</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {history.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.sender === 'user'
                        ? 'bg-brand-blue-600 text-white'
                        : 'bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Options and Input */}
            <div className="p-4 border-t border-brand-gray-200 dark:border-brand-gray-700 space-y-3 flex-shrink-0">
              <div className="flex flex-col space-y-2">
                {currentNode?.options?.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleOptionClick(option.text, option.next)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full text-left text-sm font-medium p-2 rounded-md border border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400 hover:bg-blue-50 dark:hover:bg-brand-blue-500/10"
                  >
                    {option.text}
                  </motion.button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <div className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ou digite sua pergunta..."
                    className="w-full form-input rounded-full border-brand-gray-300 dark:border-brand-gray-600 bg-brand-gray-100 dark:bg-brand-gray-700 pl-4 pr-12 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-brand-blue-600 text-white rounded-full p-2 hover:bg-brand-blue-700 transition-colors"
                    aria-label="Enviar"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpChatWidget;
