import React, { useState, useEffect, useCallback, useRef } from 'react';
import { chatWithHistory, searchMenuLink, planDateNight } from '../services/geminiService';
import { DateNightResult, ChatMessage, MessageAuthor, DateNightPick } from '../types';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import { usePastOrders } from '../hooks/usePastOrders';
import { db_logEvent } from '../src/demoDb';
import { useConversation } from '../store/conversation';
import { uid } from '../utils/uid';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLiveSession } from '../src/hooks/useLiveSession';
import { useSubscription } from '../src/hooks/useSubscription';
import { SmartImage } from './SmartImage';
import { Footer } from './Footer';

interface DateNightPlannerProps {
    prefillData?: any | null;
    onPrefillConsumed?: () => void;
    favorites: ChatMessage[];
    addFavorite: (message: ChatMessage) => void;
    removeFavorite: (messageId: string) => void;
}

const getLocation = (): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation is not supported by your browser."));
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            (error) => reject(error),
            { timeout: 7000 }
        );
    });
};

const getImageUrl = (query: string) => 
    `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=400&height=200&nologo=true`;

const adviceTopics = [
    { label: "First Date Tips", prompt: "Give me scientific first date advice to make a great impression. Include body language tips." },
    { label: "Icebreakers", prompt: "I need deep but not intrusive conversation starters for a date. Avoid small talk." },
    { label: "Red Flags", prompt: "What are some early relationship red flags I should watch out for?" },
    { label: "Rapport", prompt: "How can I build rapport and connection quickly on a date using psychology?" },
    { label: "Texting", prompt: "Give me advice on texting before and after a date to maintain interest." }
];

export const DateNightPlanner: React.FC<DateNightPlannerProps> = ({ prefillData, onPrefillConsumed, favorites, addFavorite, removeFavorite }) => {
    const [constraints, setConstraints] = useState({ vibe: 'Romantic', budget: '$$', occasion: '' });
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const { history: messages, addMessage, setPrefillData } = useConversation();
    const { profile } = useUserProfile();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFormCollapsed, setIsFormCollapsed] = useState(false);
    const { isPremium, openModal } = useSubscription();
    const chatBottomRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat when messages update
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const { isListening, start: startLiveSession, stop: stopLiveSession } = useLiveSession({
        onMessage: (message) => {
             if(message.serverContent?.turnComplete && (message.userInput || message.modelOutput)) {
                if (message.userInput) addMessage({id: uid(), author: MessageAuthor.USER, text: message.userInput});
                if (message.modelOutput) addMessage({id: uid(), author: MessageAuthor.LIORA, text: message.modelOutput});
             }
        },
        onError: (err) => {
             console.error("Mic/session failed", err);
             addMessage({id: uid(), author: MessageAuthor.SYSTEM, text: "Microphone access is required for voice chat."});
        }
    });

    const handleSendMessage = useCallback(async (userMessageText: string) => {
        const requiresLocation = userMessageText.toLowerCase().includes('find') || userMessageText.toLowerCase().includes('recommend');
        if (isLoading || (requiresLocation && !location)) return;

        const newUserMessage: ChatMessage = { id: uid(), author: MessageAuthor.USER, text: userMessageText };
        addMessage(newUserMessage);
        setInput('');
        setIsLoading(true);

        try {
            const history = [...messages, newUserMessage];
            const simpleHistory = history.reduce<Array<{role: 'user' | 'assistant', content: string}>>((acc, msg) => {
                if (msg.author === MessageAuthor.USER) acc.push({ role: 'user', content: msg.text });
                else if (msg.author === MessageAuthor.LIORA) acc.push({ role: 'assistant', content: msg.text });
                return acc;
            }, []);
            
            const results = await chatWithHistory({
                history: simpleHistory,
                user: userMessageText,
                location: location || undefined,
                userProfile: profile
            });
            addMessage(results);
        } catch (error) {
            console.error("Error in date night planner chat:", error);
            const errorMessage: ChatMessage = { id: uid(), author: MessageAuthor.SYSTEM, text: 'Sorry, I had trouble processing your request.' };
            addMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, location, addMessage, messages, profile]);

    const handleSubmit = useCallback(async () => {
        if (isLoading) return;
        
        if (!isPremium) {
             openModal('pricing');
             return;
        }
        
        setIsFormCollapsed(true);
        setIsLoading(true);
        const userText = `Plan a ${constraints.vibe} date night for me. My budget is ${constraints.budget}${constraints.occasion ? ` for a ${constraints.occasion}` : ''}.`;
        addMessage({ id: uid(), author: MessageAuthor.USER, text: userText });

        try {
            const result = await planDateNight({
                vibe: constraints.vibe,
                occasion: constraints.occasion,
                budget: constraints.budget,
                userProfile: profile,
                location: location || undefined
            });

            if (result) {
                addMessage({
                    id: uid(),
                    author: MessageAuthor.LIORA,
                    text: result.summary,
                    payload: { type: 'date_night_result', result: result }
                });
            } else {
                 addMessage({ id: uid(), author: MessageAuthor.SYSTEM, text: "I had trouble generating a plan. Please check your connection and try again." });
            }
        } catch (e) {
            console.error("Date Night submit error", e);
             addMessage({ id: uid(), author: MessageAuthor.SYSTEM, text: "Sorry, something went wrong while planning your date." });
        } finally {
            setIsLoading(false);
        }
    }, [constraints, profile, location, addMessage, isLoading, isPremium, openModal]);

    useEffect(() => {
        getLocation().then(setLocation).catch(console.error);
        return () => { stopLiveSession(); };
    }, [stopLiveSession]);

    const renderMessageContent = (msg: ChatMessage) => {
        if (msg.payload?.type === 'date_night_result' && msg.payload.result) {
            const planResult = msg.payload.result;
            const { plan } = planResult;
            
            const dinnerImg = plan.dinner.imageUrl || getImageUrl(`romantic dinner at ${plan.dinner.name}`);
            const activityImg = plan.after_dinner.imageUrl || getImageUrl(`${plan.after_dinner.type}`);
            
            return (
                <div className="space-y-4 animate-fade-in w-full">
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-900 rounded-r-lg text-sm">
                        <p className="font-semibold">{plan.plan_title}</p>
                        <p className="italic mt-1">"{planResult.summary}"</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-cream-100 to-cream-50 rounded-xl shadow-sm border border-cream-200">
                        <SmartImage src={dinnerImg} alt={plan.dinner.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                        <h4 className="font-bold text-lg text-stone-800">{plan.dinner.name}</h4>
                        <p className="text-sm text-stone-400 mb-2">{plan.dinner.cuisine} ââ ¬¢ {plan.dinner.rating}â˜â ¦</p>
                        <p className="text-xs text-stone-400 italic mb-3">"{plan.dinner.why_matched}"</p>
                        <button className="w-full bg-white border border-cream-200 text-stone-800 font-bold py-2 rounded-lg text-sm hover:bg-cream-100/80">View Details</button>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-cream-100 to-cream-50 rounded-xl shadow-sm border border-cream-200">
                        <SmartImage src={activityImg} alt={plan.after_dinner.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                        <h4 className="font-bold text-lg text-stone-800">{plan.after_dinner.name}</h4>
                        <p className="text-sm text-stone-400 mb-2 capitalize">{plan.after_dinner.type}</p>
                        <p className="text-xs text-stone-400 italic">"{plan.after_dinner.why_matched}"</p>
                    </div>
                </div>
            );
        }
        return <p className="whitespace-pre-wrap text-sm">{msg.text}</p>;
    };

    return (
        <div className="flex flex-col h-full bg-cream-50 border border-cream-200 md:rounded-2xl shadow-sm overflow-hidden">
            {/* Header Section (Non-scrolling title) */}
            <div className="flex-shrink-0 p-4 border-b border-cream-200 bg-white/80 backdrop-blur-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-lora font-bold text-stone-800">Date Night Planner</h2>
                    <p className="text-xs text-stone-400">Plans & Advice</p>
                </div>
                {!isPremium && (
                    <button onClick={() => openModal('pricing')} className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Icon name="lock" className="w-3 h-3" /> PREMIUM
                    </button>
                )}
            </div>

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth scrollbar-hide">
                
                {/* Compact Planner Form */}
                <div className={`bg-white p-4 rounded-xl shadow-sm border border-cream-200 transition-all duration-300 ${isFormCollapsed ? 'opacity-60 hover:opacity-100' : ''}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-stone-800 text-sm">Plan a Date</h3>
                        {isFormCollapsed && <button onClick={() => setIsFormCollapsed(false)} className="text-xs text-brand-400 font-bold">Edit</button>}
                    </div>
                    
                    {!isFormCollapsed && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-400 mb-1">Vibe</label>
                                    <select 
                                        value={constraints.vibe} 
                                        onChange={(e) => setConstraints({...constraints, vibe: e.target.value})} 
                                        className="w-full p-2 text-sm bg-cream-100/80 border border-cream-200 rounded-lg focus:ring-brand-400/30"
                                    >
                                        {['Romantic', 'Casual', 'Adventurous', 'First Date'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-400 mb-1">Budget</label>
                                    <select 
                                        value={constraints.budget} 
                                        onChange={(e) => setConstraints({...constraints, budget: e.target.value})} 
                                        className="w-full p-2 text-sm bg-cream-100/80 border border-cream-200 rounded-lg focus:ring-brand-400/30"
                                    >
                                        {['$', '$$', '$$$', '$$$$'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Occasion (e.g. Anniversary)" 
                                value={constraints.occasion}
                                onChange={(e) => setConstraints({...constraints, occasion: e.target.value})}
                                className="w-full p-2 text-sm bg-cream-100/80 border border-cream-200 rounded-lg focus:ring-brand-400/30"
                            />
                            <button 
                                onClick={handleSubmit} 
                                disabled={isLoading}
                                className="w-full bg-brand-400 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-cream-200 transition-colors shadow-md"
                            >
                                {isLoading ? <Spinner /> : 'Generate Full Plan'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Dating Intelligence Pills */}
                <div>
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Dating Intelligence</h3>
                    <div className="flex flex-wrap gap-2">
                        {adviceTopics.map(topic => (
                            <button
                                key={topic.label}
                                onClick={() => handleSendMessage(topic.prompt)}
                                className="px-3 py-1.5 bg-white border border-cream-200 rounded-full text-xs font-semibold text-stone-400 hover:bg-brand-400 hover:text-white hover:border-brand-400 transition-all shadow-sm"
                            >
                                {topic.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat History */}
                <div className="space-y-4 pb-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8 opacity-50">
                            <Icon name="heart" className="w-12 h-12 mx-auto mb-2 text-stone-400" />
                            <p className="text-sm text-stone-400">Ask for advice or generate a plan.</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                            {msg.author !== MessageAuthor.USER && <div className="w-8 h-8 rounded-full bg-brand-400 flex-shrink-0 mt-1"></div>}
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                msg.author === MessageAuthor.USER ? 'bg-brand-400 text-white rounded-br-none' : 
                                'bg-white text-stone-800 rounded-bl-none border border-cream-200/60'
                            }`}>
                                {renderMessageContent(msg)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-400 flex-shrink-0"></div>
                            <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-cream-200/60 shadow-sm flex items-center gap-2">
                                <Spinner /> <span className="text-xs text-stone-400">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatBottomRef} />
                </div>
                
                {/* Scrollable Footer */}
                <Footer />
            </div>

            {/* Pinned Input Bar */}
            <div className="flex-shrink-0 p-3 bg-white border-t border-cream-200">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(input)}
                        placeholder="Ask for dating advice..."
                        className="flex-1 p-2.5 pl-4 bg-cream-100/80 border border-cream-200 rounded-full text-sm focus:ring-2 focus:ring-brand-400/30 focus:bg-white transition-all"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-brand-400 text-white rounded-full hover:bg-opacity-90 disabled:opacity-50 shadow-sm"
                    >
                        <Icon name="send" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
