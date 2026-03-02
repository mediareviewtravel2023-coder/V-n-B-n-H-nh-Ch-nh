import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { DocumentData } from '@/types';
import { chatWithDocument } from '@/services/gemini';

interface AIChatPanelProps {
  doc: DocumentData;
  onUpdateDoc: (newContent: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ doc, onUpdateDoc }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Chào bạn, tôi là trợ lý AI. Bạn muốn tinh chỉnh gì ở văn bản này?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert internal messages to format expected by service
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      const result = await chatWithDocument(doc, userMsg.text, history);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: result.reply };
      setMessages(prev => [...prev, aiMsg]);

      if (result.updatedContent) {
        onUpdateDoc(result.updatedContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Xin lỗi, có lỗi xảy ra." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="h-14 bg-gov-red text-white flex items-center px-4 shrink-0 shadow-sm">
        <Bot className="mr-2" size={20} />
        <span className="font-bold">Trợ lý AI</span>
        <span className="ml-2 text-xs opacity-80">Hỗ trợ tinh chỉnh văn bản</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-green-600 ml-2' : 'bg-gov-red mr-2'
              } text-white`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 ml-10">
                <Loader2 size={16} className="animate-spin text-gov-red" />
                <span className="text-xs text-gray-500">AI đang suy nghĩ...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gov-red focus:ring-1 focus:ring-gov-red"
            placeholder="Nhập yêu cầu (ví dụ: Làm ngắn gọn hơn, sửa lỗi chính tả...)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 bg-gov-red text-white rounded-full flex items-center justify-center hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
