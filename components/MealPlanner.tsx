
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { planMeal, searchMenuLink, openExternal, generateMenuFromSearch, generateFoodImage } from '../services/geminiService';
import { MealPlan, MenuLinkData, GeneratedMenuData } from '../types';
import { Spinner } from './Spinner';
import { useConversation } from '../store/conversation';
import { Icon } from './Icon';

interface MealPlannerProps {
    demoTrigger?: number;
    prefillData?: any | null;
    onPrefillConsumed?: () => void;
}

interface MealPlanConstraints {
    mood: string;
    diet: string;
    budget: number;
    time: number;
    location: string;
    recentItems: string;
}

const moods = [
    { name: 'Adventurous', emoji: 'ð  º️' },
    { name: 'Cozy', emoji: 'â •' },
    { name: 'Healthy', emoji: 'ð ¥ ' },
    { name: 'Celebratory', emoji: 'ð   ' },
    { name: 'Quick & Easy', emoji: 'â ¡' },
    { name: 'Comfort', emoji: '🍲' },
];

export const MealPlanner: React.FC<MealPlannerProps> = ({ demoTrigger = 0, prefillData, onPrefillConsumed }) => {
    const [constraints, setConstraints] = useState<MealPlanConstraints>({
        mood: 'adventurous',
        diet: 'none',
        budget: 25,
        time: 30,
        location: '',
        recentItems: 'pizza, pasta'
    });
    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [menuData, setMenuData] = useState<{ [key: string]: { data: MenuLinkData | GeneratedMenuData | null; isLoading: boolean; error: string | null } }>({});

    const lastDemoTrigger = useRef(0);
    
    const handleSubmit = useCallback(async (planConstraintsOverride?: Partial<MealPlanConstraints>) => {
        const planConstraints = { ...constraints, ...planConstraintsOverride };
        setIsLoading(true);
        setError(null);
        setMealPlan(null);
        try {
            const result = await planMeal({
                mood: planConstraints.mood,
                diet: planConstraints.diet,
                budget: planConstraints.budget,
                time: planConstraints.time,
                location: planConstraints.location,
                recent_items: planConstraints.recentItems.split(',').map(s => s.trim()).filter(Boolean)
            });
            setMealPlan(result);
        } catch (err) {
            let message = 'Failed to generate a meal plan. Please check your inputs and try again.';
            if (err instanceof Error && err.message === 'Invalid JSON from model') {
                message = 'Sorry, I received an unexpected response from the AI. Please try again.';
            }
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [constraints]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setConstraints(prev => ({ ...prev, location: `${latitude},${longitude}` }));
            },
            (err) => {
                console.warn("Could not get location, user can enter it manually.", err.message);
                setConstraints(prev => ({...prev, location: 'New York, NY'}));
            }
        );
    }, []);
    
    useEffect(() => {
        if (prefillData && onPrefillConsumed) {
            let newConstraints: Partial<MealPlanConstraints> | null = null;
            if (prefillData.mood) {
                newConstraints = { ...prefillData };
                setConstraints(prev => ({ ...prev, ...newConstraints }));
                handleSubmit(newConstraints);
            } else if (prefillData.cuisines) {
                newConstraints = {
                    diet: prefillData.diet || 'none',
                    budget: prefillData.budget === '$' ? 15 : prefillData.budget === '$$' ? 30 : 50,
                };
                 setConstraints(prev => ({ ...prev, ...newConstraints }));
            }
            onPrefillConsumed();
        }
    }, [prefillData, onPrefillConsumed, handleSubmit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = name === 'budget' || name === 'time';
        setConstraints(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleMoodChange = (newMood: string) => {
        setConstraints(prev => ({ ...prev, mood: newMood }));
    };

    const handleShowMenu = async (key: string, name: string, dish: string, location: string) => {
        setMenuData(prev => ({ ...prev, [key]: { data: null, isLoading: true, error: null } }));
        try {
            const linkResult = await searchMenuLink(name, location);
            if (linkResult) {
                setMenuData(prev => ({ ...prev, [key]: { data: { type: 'link', ...linkResult }, isLoading: false, error: null } }));
            } else {
                const generatedMenu = await generateMenuFromSearch(name, dish);
                setMenuData(prev => ({
                    ...prev,
                    [key]: {
                        data: { type: 'generated', items: generatedMenu.items },
                        isLoading: true,
                        error: null
                    }
                }));
                const base64Image = await generateFoodImage(generatedMenu.heroImagePrompt);
                const imageUrl = `data:image/jpeg;base64,${base64Image}`;
                setMenuData(prev => ({
                    ...prev,
                    [key]: {
                        data: { ...(prev[key].data as GeneratedMenuData), heroImage: imageUrl },
                        isLoading: false,
                        error: null,
                    }
                }));
            }
        } catch (err: any) {
            console.error("Failed to fetch or generate menu:", err);
            let message = "Could not fetch or create menu info at this time.";
            setMenuData(prev => ({ ...prev, [key]: { data: null, isLoading: false, error: message } }));
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-lora text-stone-800">Meal Planner</h2>
                <p className="text-stone-400 text-sm mt-1">Tell Liora your mood and constraints to get a personalized meal plan.</p>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">What's the mood?</label>
                    <div className="grid grid-cols-2 gap-2">
                        {moods.map(mood => (
                            <button
                                key={mood.name}
                                onClick={() => handleMoodChange(mood.name.toLowerCase())}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                                    constraints.mood.toLowerCase() === mood.name.toLowerCase()
                                        ? 'bg-brand-400 text-white shadow-md'
                                        : 'bg-white border border-cream-200 text-stone-800 hover:border-brand-400'
                                }`}
                            >
                                <span className="mr-1">{mood.emoji}</span> {mood.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Budget ($)</label>
                        <input type="number" name="budget" value={constraints.budget} onChange={handleChange} className="w-full p-3 rounded-xl border border-cream-200 focus:outline-none focus:border-brand-400 bg-white text-stone-800"/>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Time (mins)</label>
                        <input type="number" name="time" value={constraints.time} onChange={handleChange} className="w-full p-3 rounded-xl border border-cream-200 focus:outline-none focus:border-brand-400 bg-white text-stone-800"/>
                    </div>
                </div>

                 <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Location</label>
                    <input type="text" name="location" value={constraints.location} onChange={handleChange} placeholder="Auto-detecting..." className="w-full p-3 rounded-xl border border-cream-200 bg-cream-100/80 text-stone-400 text-sm"/>
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Recent meals</label>
                    <textarea name="recentItems" value={constraints.recentItems} onChange={handleChange} rows={2} className="w-full p-3 rounded-xl border border-cream-200 focus:outline-none focus:border-brand-400 resize-none bg-white text-stone-800"></textarea>
                </div>
            </div>

            <button
                onClick={() => handleSubmit()}
                disabled={isLoading}
                className="w-full py-4 bg-brand-400 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2"
            >
                {isLoading ? <Spinner /> : 'Plan my meal'}
            </button>

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            {mealPlan && (
                <div className="mt-8 space-y-6 animate-fade-in">
                    <h3 className="font-lora font-bold text-xl text-stone-800">Liora's Recommendation</h3>
                    <div className="space-y-4">
                        {mealPlan.recommendations.map((idea, index) => (
                            <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-cream-200">
                                <h4 className="font-bold text-stone-800">{idea.title}</h4>
                                <p className="text-sm text-stone-400 mt-2 italic">"{idea.why}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
