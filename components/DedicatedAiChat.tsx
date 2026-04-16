
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, MessageAuthor, StoredUserProfile } from '../types';
import { chatWithHistory, SYSTEM } from '../services/geminiService';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import { useConversation } from '../store/conversation';
import { uid } from '../utils/uid';
import { useLiveSession } from '../src/hooks/useLiveSession';
import { useUserProfile } from '../hooks/useUserProfile';

const SAVED_CHATS_KEY = 'liora-saved-chats';

export const DedicatedAiChat: React.FC = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { history: messages, addMessage, switchContext } = useConversation();
    const { profile } = useUserProfile();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    useEffect(() => {
        switchContext('ai_chat');
    }, [switchContext]);

    const { isListening, start: startLiveSession, stop: stopLiveSession } = useLiveSession({
        onMessage: (message) => {
             if(message.serverContent?.turnComplete && (message.userInput || message.modelOutput)) {
                if (message.userInput) {
                    addMessage({id: uid(), author: MessageAuthor.USER, text: message.userInput});
                }
                if (message.modelOutput) {
                    addMessage({id: uid(), author: MessageAuthor.LIORA, text: message.modelOutput});
                }
             }
        },
        onError: (err) => {
             console.error("Mic/session failed", err);
             addMessage({id: uid(), author: MessageAuthor.SYSTEM, text: "Microphone access is required for voice chat."});
        },
        systemInstruction: SYSTEM + "\n\nYou are in 'Concierge Mode'. You can discuss anything on the Liora platform, including food, dating, wellness, and hotels.",
    });

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (textOverride?: string) => {
        const text = (textOverride || input).trim();
        if (!text || isLoading) return;

        const newUserMessage: ChatMessage = { id: uid(), author: MessageAuthor.USER, text };
        addMessage(newUserMessage);
        setInput('');
        setIsLoading(true);

        try {
            const simpleHistory = messages.reduce<Array<{role: 'user' | 'assistant', content: string}>>((acc, msg) => {
                if (msg.author === MessageAuthor.USER) acc.push({ role: 'user', content: msg.text });
                else if (msg.author === MessageAuthor.LIORA) acc.push({ role: 'assistant', content: msg.text });
                return acc;
            }, []);

            const response = await chatWithHistory({
                history: simpleHistory,
                user: text,
                userProfile: profile
            });
            addMessage(response);
        } catch (error) {
            console.error(error);
            addMessage({ id: uid(), author: MessageAuthor.SYSTEM, text: 'Something went wrong. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveChat = () => {
        if (messages.length <= 1) return;
        setSaveStatus('saving');
        
        const savedChats = JSON.parse(localStorage.getItem(SAVED_CHATS_KEY) || '[]');
        const newChat = {
            id: uid(),
            timestamp: Date.now(),
            title: messages.find(m => m.author === MessageAuthor.USER)?.text.substring(0, 40) + '...' || 'New Chat',
            messages: messages
        };
        
        localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify([newChat, ...savedChats]));
        
        setTimeout(() => {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 800);
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Testing Phase Banner */}
            <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-widest">Testing Phase</span>
                    <p className="text-xs text-amber-800 truncate">We&apos;re live and improving — your feedback shapes what comes next.</p>
                </div>
                <button
                    onClick={() => {
                        setInput('🟡 Suggestion: ');
                        // focus input after a tick
                        setTimeout(() => {
                            const inp = document.querySelector<HTMLInputElement>('input[placeholder*="Message Liora"]');
                            inp?.focus();
                            inp?.setSelectionRange(inp.value.length, inp.value.length);
                        }, 50);
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold transition-colors"
                >
                    <Icon name="chat_bubble_outline" className="w-3.5 h-3.5" />
                    Suggest
                </button>
            </div>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-32">
                {messages.length <= 1 && (
                    <div className="max-w-md mx-auto py-12 text-center space-y-6 animate-fade-in">
                        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-sm">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                                <Icon name="sparkles" className="w-3 h-3" />
                                Testing Phase — In Active Development
                            </div>
                            <h3 className="font-lora text-xl font-bold text-stone-800 mb-2">Ask me anything...</h3>
                            <p className="text-sm text-stone-400 mb-1 leading-relaxed">
                                Discuss restaurant picks, plan your weekend, or dive into nutrition science with me in real-time.
                            </p>
                            <p className="text-xs text-stone-400 mb-5 leading-relaxed">
                                We're continuously improving — if something feels off or you have ideas, tap <strong className="text-amber-600">Suggest</strong> above and tell us!
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    "Plan a healthy week of meals for me",
                                    "Suggest a 3-stop date night in Manhattan",
                                    "Explain the gut-brain connection",
                                    "Find me a luxury hotel with a great view",
                                    "🟡 Suggestion: I'd love a feature that..."
                                ].map((q, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSendMessage(q)}
                                        className={`text-left p-3 text-xs border rounded-xl transition-colors ${
                                            q.startsWith('🟡')
                                                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 font-medium'
                                                : 'bg-cream-100/80 hover:bg-cream-50 border-cream-200/60 text-stone-400'
                                        }`}
                                    >
                                        "{q}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                        {msg.author !== MessageAuthor.USER && (
                             <div className="w-8 h-8 rounded-full bg-brand-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] shadow-sm mt-1">L</div>
                        )}
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm leading-relaxed ${
                            msg.author === MessageAuthor.USER 
                                ? 'bg-brand-400 text-white rounded-br-none' 
                                : 'bg-white text-stone-800 border border-cream-200/60 rounded-bl-none'
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[-*] /gm, '').trim()}</p>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-3 animate-pulse">
                         <div className="w-8 h-8 rounded-full bg-brand-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">L</div>
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-cream-200/60 shadow-sm flex items-center gap-2">
                            <Spinner />
                            <span className="text-xs text-stone-400 font-medium">Liora is processing...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-cream-50 via-cream-50 to-transparent pt-12">
                <div className="max-w-3xl mx-auto relative group">
                    <div className="absolute inset-0 bg-brand-400/5 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-2 bg-white border border-cream-200 p-2 rounded-full shadow-lg ring-1 ring-black/5">
                        <button 
                            onClick={isListening ? stopLiveSession : startLiveSession}
                            className={`p-3 rounded-full transition-all flex-shrink-0 ${
                                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-cream-50 text-brand-400 hover:bg-brand-400 hover:text-white'
                            }`}
                        >
                            <Icon name={isListening ? 'stop' : 'mic'} className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isListening ? "Listening..." : "Message Liora Concierge..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 text-stone-800 placeholder-gray-400"
                            disabled={isLoading || isListening}
                        />
                        <button
                            onClick={handleSaveChat}
                            disabled={messages.length <= 1 || saveStatus !== 'idle'}
                            title="Save chat"
                            className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                                saveStatus === 'success' ? 'bg-green-100 text-green-600' : 'bg-cream-50 text-stone-400 hover:bg-cream-100 hover:text-brand-400 disabled:opacity-40'
                            }`}
                        >
                            <Icon name={saveStatus === 'success' ? 'sparkles' : 'bookmark'} className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isLoading || isListening}
                            className="p-3 bg-brand-400 text-white rounded-full hover:bg-cream-200 disabled:bg-cream-200/60 disabled:text-stone-400 transition-all flex-shrink-0 shadow-md"
                        >
                            <Icon name="send" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <p className="text-[9px] text-center text-stone-400 mt-3 font-bold uppercase tracking-tighter">Powered by Liora Real-Time Voice Intelligence</p>
            </div>
        </div>
    );
};
