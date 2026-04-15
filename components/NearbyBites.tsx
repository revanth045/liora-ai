
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchNearbyWithProfile, searchMenuLink } from '../services/geminiService';
import { RestaurantInfo, ChatMessage, MessageAuthor, View } from '../types';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import { db_logEvent } from '../src/demoDb';
import { uid } from '../utils/uid';
import { useLiveSession } from '../src/hooks/useLiveSession';
import { useConversation } from '../store/conversation';
import { useUserProfile } from '../hooks/useUserProfile';
import { SmartImage } from './SmartImage';
import { useDining } from '../src/context/DiningContext';

interface NearbyBitesProps {
    favorites: ChatMessage[];
    addFavorite: (message: ChatMessage) => void;
    removeFavorite: (messageId: string) => void;
    setView: (view: View) => void;
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

export const NearbyBites: React.FC<NearbyBitesProps> = ({ favorites, addFavorite, removeFavorite, setView }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [formState, setFormState] = useState({ cuisine: '', budget: 'Any', minRating: 'Any' });
    const [topPicks, setTopPicks] = useState<any[]>([]);
    const [picksLoading, setPicksLoading] = useState(false);
    
    const { history: messages, addMessage } = useConversation();
    const { profile } = useUserProfile();
    const { startSession } = useDining();
    const chatBottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize Location & Picks
    useEffect(() => {
        getLocation().then(coords => {
            setLocation(coords);
            // Auto-fetch picks once location is known
            if (!topPicks.length) {
                setPicksLoading(true);
                searchNearbyWithProfile({
                    location: coords,
                    userProfile: profile,
                    query: "Recommend 3 trending restaurants nearby."
                }).then(res => {
                    if (res.payload?.type === 'nearby_guide_recommendations') {
                        // Mock some as partners for demo
                        const data = res.payload.data.map((p: any, i: number) => ({
                            ...p,
                            isPartner: i === 0 // Make the first one a partner
                        }));
                        setTopPicks(data);
                    }
                }).finally(() => setPicksLoading(false));
            }
        }).catch(console.error);
    }, []);

    const handleCheckIn = (restaurant: any) => {
        startSession(restaurant.map_place_id || uid(), restaurant.name);
        setView('ai_waiter');
    };

    const executeSearch = useCallback(async (criteria: typeof formState) => {
        if (isLoading || !location) return;
        setIsLoading(true);
        const query = `Find ${criteria.cuisine || 'restaurants'} ${criteria.budget !== 'Any' ? `with ${criteria.budget} budget` : ''} nearby.`;
        
        addMessage({ id: uid(), author: MessageAuthor.USER, text: query });
        
        try {
            const res = await searchNearbyWithProfile({ location, userProfile: profile, query });
            // Mock partner status for search results
            if (res.payload?.type === 'nearby_guide_recommendations') {
                res.payload.data = res.payload.data.map((p: any, i: number) => ({ ...p, isPartner: i % 2 === 0 }));
            }
            addMessage(res);
            setShowFilters(false);
        } catch (e) {
            console.error(e);
            addMessage({ id: uid(), author: MessageAuthor.SYSTEM, text: "Search failed. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }, [location, profile, isLoading, addMessage]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const text = input.trim();
        setInput('');
        setIsLoading(true);
        addMessage({ id: uid(), author: MessageAuthor.USER, text });
        
        try {
            const res = await searchNearbyWithProfile({ location: location!, userProfile: profile, query: text });
            addMessage(res);
        } catch (e) {
            addMessage({ id: uid(), author: MessageAuthor.SYSTEM, text: "Error processing request." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-cream-50 border border-cream-200 md:rounded-2xl shadow-sm overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-4 bg-white/80 backdrop-blur-md border-b border-cream-200 flex justify-between items-center z-10">
                <h2 className="font-lora font-bold text-xl text-stone-800">Nearby Bites</h2>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${showFilters ? 'bg-brand-400 text-white border-brand-400' : 'bg-white text-stone-400 border-cream-200'}`}
                >
                    {showFilters ? 'Hide Filters' : 'Filters'}
                </button>
            </div>

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                
                {/* Collapsible Filters */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input 
                                type="text" 
                                placeholder="Cuisine (e.g. Sushi)" 
                                value={formState.cuisine}
                                onChange={e => setFormState({...formState, cuisine: e.target.value})}
                                className="p-2 border border-cream-200 rounded-lg text-sm focus:ring-brand-400/30"
                            />
                            <select 
                                value={formState.budget}
                                onChange={e => setFormState({...formState, budget: e.target.value})}
                                className="p-2 border border-cream-200 rounded-lg text-sm bg-white focus:ring-brand-400/30"
                            >
                                <option>Any Price</option>
                                <option>$</option>
                                <option>$$</option>
                                <option>$$$</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => executeSearch(formState)}
                            disabled={isLoading}
                            className="w-full bg-brand-400 text-white font-bold py-2 rounded-lg text-sm hover:bg-opacity-90 transition-opacity"
                        >
                            {isLoading ? <Spinner /> : 'Find Restaurants'}
                        </button>
                    </div>
                )}

                {/* Top Picks Horizontal Scroll */}
                {(topPicks.length > 0 || picksLoading) && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                            <Icon name="sparkles" className="w-3 h-3 text-brand-400" /> Recommended for You
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                            {picksLoading ? [1,2,3].map(i => (
                                <div key={i} className="w-40 h-48 bg-cream-100/50 rounded-xl flex-shrink-0 animate-pulse" />
                            )) : topPicks.map((pick, idx) => (
                                <div key={idx} className="w-40 flex-shrink-0 bg-white rounded-xl border border-cream-200/60 shadow-sm overflow-hidden group relative">
                                    <div className="h-24 bg-cream-200/60 relative">
                                        <SmartImage src={pick.imageUrl} className="w-full h-full object-cover" />
                                        {pick.isPartner && (
                                            <div className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-stone-800 shadow-sm flex items-center gap-0.5">
                                                <Icon name="sparkles" className="w-2 h-2 text-brand-400" /> PARTNER
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <h4 className="font-bold text-stone-800 text-sm truncate">{pick.name}</h4>
                                        <p className="text-[10px] text-stone-400 uppercase font-semibold">{pick.cuisine} â ¢ {pick.est_cost}</p>
                                        <button 
                                            onClick={() => pick.isPartner ? handleCheckIn(pick) : executeSearch({ ...formState, cuisine: pick.name })}
                                            className={`w-full mt-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${pick.isPartner ? 'bg-brand-400 text-white' : 'bg-cream-50 text-stone-800'}`}
                                        >
                                            {pick.isPartner ? 'Check In Live' : 'View Menu'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Stream */}
                <div className="space-y-4 pb-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                            {msg.author !== MessageAuthor.USER && <div className="w-8 h-8 rounded-full bg-brand-400 flex-shrink-0 mt-1"></div>}
                            <div className={`max-w-[90%] p-3 rounded-2xl text-sm shadow-sm ${
                                msg.author === MessageAuthor.USER ? 'bg-brand-400 text-white rounded-br-none' : 
                                'bg-white text-stone-800 rounded-bl-none border border-cream-200/60'
                            }`}>
                                {msg.payload?.type === 'nearby_guide_recommendations' ? (
                                    <div className="space-y-3">
                                        <p>{msg.text}</p>
                                        {Array.isArray(msg.payload.data) && msg.payload.data.map((rec: any, i: number) => (
                                            <div key={i} className="bg-cream-100/80 p-3 rounded-xl border border-cream-200">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-stone-800">{rec.name}</h4>
                                                        {rec.isPartner && <Icon name="sparkles" className="w-3 h-3 text-brand-400" />}
                                                    </div>
                                                    <span className="bg-white px-2 py-0.5 rounded text-xs border border-cream-200">{rec.rating}â …</span>
                                                </div>
                                                <p className="text-xs text-stone-400 mt-0.5">{rec.cuisine} â ¢ {rec.est_cost} â ¢ {rec.distance}</p>
                                                <p className="text-xs text-stone-600 mt-2 italic">"{rec.why_matched}"</p>
                                                <div className="mt-3 flex gap-2">
                                                    {rec.isPartner ? (
                                                        <button 
                                                            onClick={() => handleCheckIn(rec)}
                                                            className="flex-1 bg-brand-400 text-white text-center py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                                                        >
                                                            <Icon name="scan" className="w-3 h-3" /> Check In
                                                        </button>
                                                    ) : (
                                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.name)}`} target="_blank" rel="noreferrer" className="flex-1 bg-brand-400 text-white text-center py-1.5 rounded-lg text-xs font-bold">Map</a>
                                                    )}
                                                    <button className="flex-1 bg-white border border-cream-200 text-stone-800 py-1.5 rounded-lg text-xs font-bold">Menu</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-400 flex-shrink-0"></div>
                            <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-cream-200/60 shadow-sm flex items-center gap-2">
                                <Spinner /> <span className="text-xs text-stone-400">Searching nearby...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatBottomRef} />
                </div>
            </div>

            {/* Pinned Input Bar */}
            <div className="flex-shrink-0 p-3 bg-white border-t border-cream-200">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask Liora anything nearby..."
                        className="flex-1 p-2.5 pl-4 bg-cream-100/80 border border-cream-200 rounded-full text-sm focus:ring-2 focus:ring-brand-400/30 focus:bg-white transition-all"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleSendMessage}
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
