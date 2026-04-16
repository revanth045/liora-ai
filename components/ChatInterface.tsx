import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, MessageAuthor, View, RestaurantInfo } from '../types';
import { useConversation } from '../store/conversation';
import { chatWithHistory } from '../services/geminiService';
import { useLiveSession } from '../src/hooks/useLiveSession';
import { useDynamicLoadingMessage } from '../src/hooks/useDynamicLoadingMessage';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { uid } from '../utils/uid';

// ââ  â ¬ââ  â ¬ââ  â ¬ Dashboard content config ââ  â ¬ââ  â ¬ââ  â ¬
const DASHBOARD = {
    hero: {
        greeting: () => {
            const h = new Date().getHours();
            if (h < 12) return 'Good morning';
            if (h < 17) return 'Good afternoon';
            return 'Good evening';
        },
        tagline: 'What are we tasting today?',
    },
    quickActions: [
        { label: 'Find Dinner', prompt: 'Find me a great restaurant nearby for dinner tonight', icon: 'restaurant_menu' },
        { label: 'Plan Date', prompt: 'Plan a romantic date night for two', icon: 'favorite' },
        { label: 'Log Mood', prompt: 'I want to log how I feel about food today', icon: 'spa' },
    ],
    smartCards: [
        { title: 'Date Night', subtitle: 'Plan the perfect evening', icon: 'favorite', route: 'dating' as View, gradient: 'from-rose-500/20 to-pink-500/20', iconColor: 'text-rose-400', comingSoon: true },
        { title: 'Fitness', subtitle: 'Track nutrition & goals', icon: 'fitness_center', route: 'fitness' as View, gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400', comingSoon: true },
    ],
    spotlight: {
        title: "Chef's Table — AI Kitchen",
        subtitle: 'Get a recipe from ingredients you have at home',
        prompt: 'Help me create a recipe from what I have in my fridge',
        icon: 'soup_kitchen',
    },
    services: [
        { title: 'AI Waiter', desc: 'Dine-in companion', icon: 'room_service', route: 'ai_waiter' as View },
        { title: 'Chef Mode', desc: 'Cook like a pro', icon: 'soup_kitchen', route: 'chef_mode' as View },
        { title: 'Meal Planner', desc: 'Weekly plans', icon: 'clipboard-list', route: 'planner' as View },
        { title: 'Hotels', desc: 'Find stays', icon: 'hotel', route: 'hotels' as View },
    ],
};

// ââ  â ¬ââ  â ¬ââ  â ¬ Render helpers ââ  â ¬ââ  â ¬ââ  â ¬

function renderStars(rating: number) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Icon key={i} name={i <= Math.round(rating) ? 'star-solid' : 'star'} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-brand-400' : 'text-stone-300'}`} />
            ))}
            <span className="text-xs text-stone-400 ml-1">{rating.toFixed(1)}</span>
        </div>
    );
}

function RestaurantCard({ r, onSave }: { r: RestaurantInfo; onSave: () => void }) {
    return (
        <div className="bg-cream-50 border border-cream-200 rounded-xl overflow-hidden mt-3 border border-cream-200">
            {r.imageUrl && (
                <div className="h-36 overflow-hidden">
                    <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
            )}
            <div className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-semibold text-stone-800 text-sm">{r.name}</h4>
                        {r.rating && renderStars(r.rating)}
                    </div>
                </div>
                {r.signature_dish_guess && (
                    <p className="text-xs text-stone-400"><span className="text-brand-400">Signature:</span> {r.signature_dish_guess}</p>
                )}
                {r.address && <p className="text-xs text-stone-400">{r.address}</p>}
                <div className="flex gap-2 pt-1">
                    {r.place_id && (
                        <a
                            href={`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(r.place_id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-1.5 text-xs font-semibold rounded-lg bg-cream-50 border border-cream-200 hover:bg-cream-200/60 text-stone-600 transition-colors"
                        >
                            Route
                        </a>
                    )}
                    <button onClick={onSave} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-brand-400/10 text-brand-400 hover:bg-brand-400/20 transition-colors">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function renderMarkdown(text: string) {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
        let processed = line
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-stone-800">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)/g, '<h3 class="text-base font-semibold text-stone-800 mt-3 mb-1">$1</h3>')
            .replace(/^## (.+)/g, '<h2 class="text-lg font-bold text-stone-800 mt-3 mb-1">$1</h2>')
            .replace(/^[-ââ ¬¢] (.+)/g, '<li class="ml-4 list-disc text-stone-600">$1</li>')
            .replace(/^\d+\. (.+)/g, '<li class="ml-4 list-decimal text-stone-600">$1</li>');
        return <div key={i} dangerouslySetInnerHTML={{ __html: processed || '<br/>' }} />;
    });
}

// ââ  â ¬ââ  â ¬ââ  â ¬ Main Component ââ  â ¬ââ  â ¬ââ  â ¬

interface ChatInterfaceProps {
    favorites: ChatMessage[];
    addFavorite: (message: ChatMessage) => void;
    removeFavorite: (messageId: string) => void;
    setView: (view: View) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ favorites, addFavorite, removeFavorite, setView }) => {
    const { history, addMessage, setIntent, setCandidates } = useConversation();
    const { profile } = useUserProfile();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [comingSoonToast, setComingSoonToast] = useState(false);

    const showComingSoon = () => {
        setComingSoonToast(true);
        setTimeout(() => setComingSoonToast(false), 3500);
    };
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const loadingMessage = useDynamicLoadingMessage(isLoading, [
        'Thinking...',
        'Consulting local experts...',
        'Curating the best options...',
        'Almost there...',
    ]);

    // Get location once
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            pos => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => {} // silently fail
        );
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);

    // Voice chat
    const { isListening, start: startVoice, stop: stopVoice } = useLiveSession({
        onMessage: (msg) => {
            if (msg.userInput && msg.modelOutput) {
                addMessage({ id: uid(), author: MessageAuthor.USER, text: msg.userInput });
                addMessage({ id: uid(), author: MessageAuthor.LIORA, text: msg.modelOutput });
            }
        },
        onError: () => {},
        systemInstruction: 'You are Liora, a friendly AI dining and lifestyle companion. Help with restaurants, recipes, dates, and wellness.',
    });

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;
        const userMsg: ChatMessage = { id: uid(), author: MessageAuthor.USER, text: text.trim() };
        addMessage(userMsg);
        setInput('');
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const chatHistory = history.filter(m => m.author !== MessageAuthor.SYSTEM).map(m => ({
                role: (m.author === MessageAuthor.USER ? 'user' : 'assistant') as 'user' | 'assistant',
                content: m.text,
            }));

            const response = await chatWithHistory({
                history: chatHistory,
                user: text.trim(),
                location: location || undefined,
                userProfile: profile,
            });

            addMessage(response);

            if (response.payload?.type === 'nearby_restaurants' || response.payload?.type === 'nearby_guide_recommendations') {
                const candidates = response.payload.restaurants || response.payload.data;
                if (candidates) setCandidates(candidates);
            }
        } catch (err) {
            addMessage({ id: uid(), author: MessageAuthor.SYSTEM, text: 'Something went wrong. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    }, [history, isLoading, location, profile, addMessage, setCandidates]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    const showDashboard = history.length <= 1;
    const isFavorite = (id: string) => favorites.some(f => f.id === id);

    // ââ  â ¬ââ  â ¬ââ  â ¬ Dashboard View ââ  â ¬ââ  â ¬ââ  â ¬
    if (showDashboard) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-4">
                    {/* Hero */}
                    <div className="relative rounded-2xl overflow-hidden mb-6 p-6 bg-cream-50 border border-cream-200">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <h1 className="text-2xl md:text-3xl font-lora font-bold text-stone-800 mb-1">
                                {DASHBOARD.hero.greeting()}
                            </h1>
                            <p className="text-stone-400 text-sm mb-4">{DASHBOARD.hero.tagline}</p>
                            <div className="flex flex-wrap gap-2">
                                {DASHBOARD.quickActions.map((a, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(a.prompt)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-50 border border-cream-200-light text-xs font-medium text-stone-700 hover:bg-cream-200/60 transition-all"
                                    >
                                        <Icon name={a.icon} className="w-3.5 h-3.5 text-brand-400" />
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Smart Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {DASHBOARD.smartCards.map((card, i) => (
                            <button
                                key={i}
                                onClick={() => card.comingSoon ? showComingSoon() : setView(card.route)}
                                className={`p-4 rounded-xl bg-cream-50 border border-cream-200 hover:scale-[1.02] transition-all text-left group bg-gradient-to-br ${card.gradient} relative overflow-hidden`}
                            >
                                <Icon name={card.icon} className={`w-6 h-6 mb-2 ${card.iconColor}`} />
                                <h3 className="font-semibold text-stone-800 text-sm">{card.title}</h3>
                                <p className="text-xs text-stone-400 mt-0.5">{card.subtitle}</p>
                                {card.comingSoon && (
                                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest bg-white/70 text-stone-400 px-1.5 py-0.5 rounded-full border border-stone-200/60">Soon</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Coming Soon Toast */}
                    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${comingSoonToast ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="bg-forest-900 text-cream-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 min-w-[260px]">
                            <span className="text-xl">✨</span>
                            <div>
                                <p className="font-semibold text-sm">Something exciting is coming!</p>
                                <p className="text-xs text-cream-300 mt-0.5">We're putting the finishing touches on this — stay tuned 🏃‍♂️</p>
                            </div>
                        </div>
                    </div>

                    {/* Spotlight */}
                    <button
                        onClick={() => sendMessage(DASHBOARD.spotlight.prompt)}
                        className="w-full mb-6 p-5 rounded-xl bg-cream-50 border border-cream-200 hover:bg-cream-100/60 transition-all text-left group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-brand-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-brand-400/10 flex items-center justify-center flex-shrink-0">
                                <Icon name={DASHBOARD.spotlight.icon} className="w-5 h-5 text-brand-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-stone-800 text-sm">{DASHBOARD.spotlight.title}</h3>
                                <p className="text-xs text-stone-400">{DASHBOARD.spotlight.subtitle}</p>
                            </div>
                            <Icon name="arrow_forward" className="w-4 h-4 text-stone-400 ml-auto group-hover:text-brand-400 transition-colors" />
                        </div>
                    </button>

                    {/* Services */}
                    <div className="mb-6">
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Concierge Services</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {DASHBOARD.services.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => setView(s.route)}
                                    className="p-3 rounded-xl bg-cream-50 border border-cream-200 hover:bg-cream-200/60 transition-all text-left"
                                >
                                    <Icon name={s.icon} className="w-5 h-5 text-brand-400 mb-1.5" />
                                    <h3 className="text-sm font-semibold text-stone-700">{s.title}</h3>
                                    <p className="text-xs text-stone-400">{s.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input */}
                {renderInput()}
            </div>
        );
    }

    // ââ  â ¬ââ  â ¬ââ  â ¬ Chat View ââ  â ¬ââ  â ¬ââ  â ¬
    function renderInput() {
        return (
            <div className="flex-shrink-0 p-3 border-t border-cream-200">
                <div className="flex items-end gap-2 bg-cream-50 border border-cream-200 rounded-2xl p-2">
                    <button
                        onClick={isListening ? stopVoice : startVoice}
                        className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
                            isListening
                                ? 'bg-red-500/20 text-red-400 animate-pulse'
                                : 'text-stone-400 hover:text-stone-700 hover:bg-cream-200/60'
                        }`}
                        title={isListening ? 'Stop listening' : 'Voice input'}
                    >
                        <Icon name={isListening ? 'stop' : 'mic'} className="w-5 h-5" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? 'Listening...' : 'Ask Liora anything...'}
                        className="flex-1 bg-transparent text-stone-800 placeholder-stone-400 text-sm resize-none outline-none max-h-[120px] py-2"
                        rows={1}
                        disabled={isListening}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 rounded-xl bg-brand-400 text-stone-900 flex-shrink-0 hover:bg-brand-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Spinner /> : <Icon name="send" className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-4 space-y-4">
                {history.map((msg) => {
                    if (msg.author === MessageAuthor.SYSTEM) {
                        return (
                            <div key={msg.id} className="flex justify-center">
                                <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs max-w-md text-center">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    }
                    if (msg.author === MessageAuthor.USER) {
                        return (
                            <div key={msg.id} className="flex justify-end">
                                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-brand-400/15 border border-brand-400/20 text-stone-800 text-sm">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    }
                    // Liora message
                    const restaurants: RestaurantInfo[] = msg.payload?.restaurants || msg.payload?.data || [];
                    return (
                        <div key={msg.id} className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-stone-900 text-xs font-bold font-lora">L</span>
                            </div>
                            <div className="flex-1 max-w-[85%]">
                                <div className="bg-cream-50 border border-cream-200 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-stone-600 leading-relaxed">
                                    {renderMarkdown(msg.text)}
                                    {/* Restaurant cards */}
                                    {restaurants.length > 0 && (
                                        <div className="space-y-3 mt-2">
                                            {restaurants.map((r: RestaurantInfo, i: number) => (
                                                <RestaurantCard
                                                    key={r.place_id || i}
                                                    r={r}
                                                    onSave={() => addFavorite(msg)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Grounding sources */}
                                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {msg.groundingChunks.slice(0, 4).map((chunk: any, idx: number) => {
                                            const source = chunk.web || chunk.maps;
                                            if (!source) return null;
                                            return (
                                                <a
                                                    key={idx}
                                                    href={source.uri}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cream-50 border border-cream-200-light text-[10px] text-stone-400 hover:text-brand-400 transition-colors truncate max-w-[200px]"
                                                >
                                                    <Icon name={chunk.maps ? 'map-pin' : 'link'} className="w-2.5 h-2.5 flex-shrink-0" />
                                                    <span className="truncate">{source.title}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                                {/* Favorite toggle */}
                                <div className="flex items-center gap-2 mt-1.5">
                                    <button
                                        onClick={() => isFavorite(msg.id) ? removeFavorite(msg.id) : addFavorite(msg)}
                                        className={`p-1 rounded transition-colors ${isFavorite(msg.id) ? 'text-red-400' : 'text-stone-300 hover:text-stone-400'}`}
                                    >
                                        <Icon name={isFavorite(msg.id) ? 'heart-solid' : 'heart'} className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-stone-900 text-xs font-bold font-lora">L</span>
                        </div>
                        <div className="bg-cream-50 border border-cream-200 rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </div>
                                <span className="text-xs text-stone-400">{loadingMessage}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {renderInput()}
        </div>
    );
};
