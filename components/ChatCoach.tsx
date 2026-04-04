
import React, { useState, useEffect, useRef } from 'react';
import { createChatSession } from '../services/gemini';
import { ChatMessage, FunnelProject } from '../types';
import { Send, Loader2, Bot, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GenerateContentResponse, Chat } from '@google/genai';
import VoiceInput from './VoiceInput';

interface ChatCoachProps {
  onAutoSave: (project: FunnelProject) => void;
  initialProject?: FunnelProject;
}

const ChatCoach: React.FC<ChatCoachProps> = ({ onAutoSave, initialProject }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(Date.now().toString());
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  // Parse initial content if resuming a chat
  useEffect(() => {
    if (initialProject && initialProject.type === 'CHAT_SESSION') {
        setSessionId(initialProject.id);
        
        // Simple parser to restore visual state from the markdown content
        // Note: In a real app, we would store the message array JSON in the project.
        // Here we attempt to reconstruct or just start fresh if it's too complex.
        const lines = initialProject.content.split('\n\n');
        const restored: ChatMessage[] = lines.map((line, idx) => {
            let role: 'user' | 'model' = 'model';
            let text = line;
            if (line.startsWith('**You:**')) {
                role = 'user';
                text = line.replace('**You:** ', '');
            } else if (line.startsWith('**Coach:**')) {
                role = 'model';
                text = line.replace('**Coach:** ', '');
            }
            return {
                id: `restored-${idx}`,
                role,
                text,
                timestamp: initialProject.createdAt
            };
        });
        
        if (restored.length > 0) {
            setMessages(restored);
        } else {
             setMessages([{
                id: 'welcome',
                role: 'model',
                text: "Welcome back! How can I help with your funnel today?",
                timestamp: Date.now()
            }]);
        }
    } else {
        setMessages([{
            id: 'welcome',
            role: 'model',
            text: "Hey! I'm your FunnelMate coach. Ask me anything about affiliate marketing, traffic, or copywriting!",
            timestamp: Date.now()
        }]);
    }

    // Initialize Gemini Chat
    if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
    }
  }, [initialProject]);

  // Auto-Save Effect
  useEffect(() => {
    if (messages.length <= 1) return; // Don't save empty/welcome chats

    const timeoutId = setTimeout(() => {
        const content = messages.map(m => `**${m.role === 'model' ? 'Coach' : 'You'}:** ${m.text}`).join('\n\n');
        const firstUserMessage = messages.find(m => m.role === 'user')?.text || 'New Session';
        const shortName = firstUserMessage.length > 30 ? firstUserMessage.substring(0, 30) + '...' : firstUserMessage;

        const project: FunnelProject = {
            id: sessionId,
            name: `Chat: ${shortName}`,
            type: 'CHAT_SESSION',
            content: content,
            niche: 'Coaching',
            productName: 'Chat History',
            targetAudience: 'User',
            createdAt: initialProject ? initialProject.createdAt : Date.now()
        };
        
        onAutoSave(project);
    }, 1000); // Debounce save by 1 second

    return () => clearTimeout(timeoutId);
  }, [messages, sessionId, onAutoSave, initialProject]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceInput = (text: string) => {
    setInputText(prev => prev ? `${prev} ${text}` : text);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({
          message: userMsg.text
      });
      
      const responseText = result.text || "I'm having trouble thinking right now. Try again?";

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error connecting to Gemini. Please check your connection.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
      setSessionId(Date.now().toString());
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: "New chat started! What's on your mind?",
        timestamp: Date.now()
      }]);
      chatSessionRef.current = createChatSession();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Bot size={18} />
            </div>
            <div>
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">AI Coach</h2>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Auto-saving to history</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={startNewChat} 
                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
                <Plus size={14} /> New Chat
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' ? (
                <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 max-w-none dark:prose-invert">
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={handleKeyPress}
              placeholder="Ask about strategy..."
              className="w-full bg-gray-100 dark:bg-gray-700 dark:text-white border-0 rounded-2xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:placeholder-gray-400 transition-colors resize-none overflow-hidden min-h-[44px]"
              disabled={isTyping}
            />
            <div className="absolute right-1 top-2">
               <VoiceInput onTranscript={handleVoiceInput} />
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatCoach;
