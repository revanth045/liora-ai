
import React, { useState, useEffect } from 'react';
import { useDining } from '../../../context/DiningContext';
import { ChatMessage, View } from '../../../../types';
import { Icon } from '../../../../components/Icon';
import { useConversation } from '../../../../store/conversation';
import { uid } from '../../../../utils/uid';

// Mock Data representing the "Restaurant Portal" Integration
const RESTAURANTS = [
  {
    id: 'r1',
    name: 'Holstein Grill',
    type: 'Steakhouse',
    price: '$$$',
    rating: 4.8,
    isPartner: true, // Connected to Restaurant Portal
    matchReason: 'Matches your protein goal',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
    tags: ['Date Night', 'Meat Lover']
  },
  {
    id: 'r2',
    name: 'Hummus & Co.',
    type: 'Mediterranean',
    price: '$',
    rating: 4.5,
    isPartner: false,
    matchReason: 'Budget friendly & healthy',
    image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&w=800&q=80',
    tags: ['Healthy', 'Quick', 'Budget']
  },
  {
    id: 'r3',
    name: 'Kira Sushi',
    type: 'Japanese',
    price: '$$',
    rating: 4.9,
    isPartner: true,
    matchReason: 'Top rated in your area',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    tags: ['Sushi', 'Fresh']
  },
  {
    id: 'r4',
    name: 'Taco Barrio',
    type: 'Mexican Street Food',
    price: '$',
    rating: 4.4,
    isPartner: false,
    matchReason: 'Trending nearby',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    tags: ['Spicy', 'Budget']
  }
];

const MOODS = [
  { id: 'budget', label: 'Under $15', icon: 'attach_money', color: 'bg-green-100 text-green-700' },
  { id: 'healthy', label: 'Healthy Kick', icon: 'spa', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'comfort', label: 'Comfort Food', icon: 'soup_kitchen', color: 'bg-orange-100 text-orange-700' },
  { id: 'new', label: 'Try New', icon: 'explore', color: 'bg-blue-100 text-blue-700' },
];

interface FoodHubProps {
    favorites: ChatMessage[];
    addFavorite: (msg: ChatMessage) => void;
    removeFavorite: (id: string) => void;
    setView: (view: View) => void;
}

export default function FoodHub({ favorites, addFavorite, removeFavorite, setView }: FoodHubProps) {
    const { startSession } = useDining();
    const { switchContext } = useConversation();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        switchContext('nearby');
    }, [switchContext]);

    // Simulating User Data Intelligence
    const weeklyRecap = {
        status: "You've had a lot of carbs this week.",
        suggestion: "How about some lean protein or fresh greens today?"
    };

    const handleCheckIn = (restaurant: any) => {
        startSession(restaurant.id, restaurant.name);
        setView('ai_waiter');
    };

    const filteredRestaurants = RESTAURANTS.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' 
            ? true 
            : activeFilter === 'budget' ? r.price === '$' 
            : activeFilter === 'healthy' ? r.tags.includes('Healthy') 
            : true;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="h-full flex flex-col bg-cream-50">
            {/* --- HEADER & INSIGHTS --- */}
            <div className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-lora font-bold text-stone-800">Taste & Discover</h1>
                        <p className="text-stone-400 text-sm mt-1">Found 42 local gems near you</p>
                    </div>
                    <button className="p-2.5 bg-white border border-cream-200 rounded-full text-stone-800 shadow-sm hover:bg-cream-50 transition-all">
                        <Icon name="tune" size={20} />
                    </button>
                </div>

                {/* Personalized Insight Banner */}
                <div className="bg-forest-900 text-white p-5 rounded-2xl flex items-start gap-4 shadow-lg mb-6 relative overflow-hidden">
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Icon name="insights" size={16} className="text-yellow-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Weekly Insight</span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">
                            "{weeklyRecap.status} <span className="underline decoration-yellow-400/50 text-yellow-50">{weeklyRecap.suggestion}</span>"
                        </p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                        <Icon name="utensils" size={24} className="text-white" />
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                        <Icon name="sparkles" size={120} />
                    </div>
                </div>

                {/* Mood Selectors (The "Why") */}
                <div className="mb-6">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">What's the vibe?</h3>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 overscroll-x-contain touch-pan-x">
                        {MOODS.map(mood => (
                            <button 
                                key={mood.id}
                                onClick={() => setActiveFilter(activeFilter === mood.id ? 'all' : mood.id)}
                                className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl border transition-all ${
                                    activeFilter === mood.id 
                                        ? 'bg-cream-100 text-white border-cream-200 shadow-md' 
                                        : 'bg-white text-stone-800 border-cream-200 hover:border-cream-200 shadow-sm'
                                }`}
                            >
                                <div className={`p-1.5 rounded-full ${activeFilter === mood.id ? 'bg-white/20' : mood.color.split(' ')[0]}`}>
                                    <Icon name={mood.icon} size={16} className={activeFilter === mood.id ? 'text-white' : mood.color.split(' ')[1]} />
                                </div>
                                <span className="text-sm font-bold">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MAIN FEED --- */}
            <div className="flex-1 overflow-y-auto p-6 pt-0 scrollbar-hide space-y-6 pb-24">
                
                {/* Search Bar */}
                <div className="sticky top-0 z-20 py-2 bg-cream-50/95 backdrop-blur-sm">
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for sushi, tacos, or craving..."
                            className="w-full p-4 pl-12 bg-white rounded-2xl border border-cream-200 text-stone-800 shadow-sm group-focus-within:ring-1 group-focus-within:ring-brand-400 focus:outline-none transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-800 transition-colors">
                            <Icon name="search" size={20} />
                        </div>
                    </div>
                </div>

                {/* Restaurant Cards */}
                <div className="space-y-6">
                    {filteredRestaurants.map(place => {
                        const isFavorited = favorites.some(fav => fav.id === `foodhub-${place.id}`);
                        return (
                            <div key={place.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-cream-200 group hover:shadow-xl transition-all duration-500">
                                <div className="h-56 relative overflow-hidden">
                                    <img src={place.image} alt={place.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    
                                    {/* Partner Badge */}
                                    {place.isPartner && (
                                        <div className="absolute top-5 left-5 bg-cream-100 text-white px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-xl border border-cream-200">
                                            <Icon name="verified" size={12} className="text-yellow-400" />
                                            LIORA PARTNER
                                        </div>
                                    )}
                                    
                                    {/* Match Score Badge */}
                                    <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-stone-800 shadow-lg flex items-center gap-2 border border-cream-200/60">
                                        <Icon name="auto_awesome" size={14} className="text-purple-500" />
                                        {place.matchReason}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-lora text-2xl font-bold text-stone-800">{place.name}</h3>
                                            <p className="text-sm text-stone-400 font-medium">{place.type} • <span className="text-stone-800 font-bold">{place.price}</span></p>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-cream-50 px-3 py-1.5 rounded-xl border border-cream-200">
                                            <Icon name="star-solid" size={14} className="text-yellow-500" />
                                            <span className="text-sm font-bold text-stone-800">{place.rating}</span>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mt-4 mb-6">
                                        {place.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-cream-100/80 text-stone-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-cream-200/60">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        {place.isPartner ? (
                                            <button 
                                                onClick={() => handleCheckIn(place)}
                                                className="flex-1 py-4 bg-cream-100 text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-400/20 hover:bg-cream-200 transition-all flex justify-center items-center gap-2.5 active:scale-95"
                                            >
                                                <Icon name="qr_code_scanner" size={20} />
                                                Connect to Table
                                            </button>
                                        ) : (
                                            <button className="flex-1 py-4 border border-cream-200 text-stone-800 rounded-2xl text-sm font-bold hover:bg-cream-50 transition-colors active:scale-95">
                                                View Menu
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => isFavorited ? removeFavorite(`foodhub-${place.id}`) : addFavorite({id: `foodhub-${place.id}`, author: 'liora' as any, text: `Saved Restaurant: ${place.name}`})}
                                            className={`p-4 border border-cream-200 rounded-2xl transition-all active:scale-90 ${isFavorited ? 'bg-red-50 border-red-200 text-red-500' : 'text-stone-800 hover:bg-red-50 hover:border-red-100 hover:text-red-500'}`}
                                        >
                                            <Icon name={isFavorited ? "heart-solid" : "favorite_border"} size={22} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredRestaurants.length === 0 && (
                    <div className="text-center py-20 animate-fade-in">
                        <div className="w-20 h-20 bg-cream-200/60/50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-800 shadow-inner">
                            <Icon name="search_off" size={40} />
                        </div>
                        <h3 className="text-stone-800 font-lora text-xl font-bold">No matching gems</h3>
                        <p className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">Try adjusting your mood filters or searching for something else.</p>
                        <button onClick={() => setActiveFilter('all')} className="mt-8 px-6 py-2.5 bg-cream-100 text-white rounded-xl text-sm font-bold shadow-md">Clear Filters</button>
                    </div>
                )}

            </div>
        </div>
    );
}
