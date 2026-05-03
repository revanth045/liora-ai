
import React, { useState } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

export const ChefMode = () => {
    const [ingredients, setIngredients] = useState('');
    const [step, setStep] = useState(0); // 0: Input, 1: Loading, 2: Recipes, 3: Steps
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

    const recipes = [
        { 
            id: 1, 
            name: "Lemon Herb Roasted Chicken", 
            time: "45m", 
            difficulty: "Easy", 
            summary: "A zesty and tender chicken dish using your lemon and herbs.",
            steps: [
                "Preheat oven to 400°F (200°C).",
                "Rub chicken with olive oil, lemon zest, and chopped herbs.",
                "Roast for 35-40 minutes until golden brown.",
                "Let rest for 5 minutes before serving."
            ]
        },
        { 
            id: 2, 
            name: "Garlic Butter Pasta", 
            time: "20m", 
            difficulty: "Medium", 
            summary: "Rich and savory pasta that makes the most of your pantry staples.",
            steps: [
                "Boil pasta in salted water until al dente.",
                "In a separate pan, melt butter and sauté minced garlic.",
                "Toss pasta in garlic butter sauce with a splash of pasta water.",
                "Garnish with parsley and serve immediately."
            ]
        }
    ];

    const handleGenerate = () => {
        if (!ingredients.trim()) return;
        setStep(1);
        setTimeout(() => setStep(2), 2000);
    };

    const handleSelectRecipe = (recipe: any) => {
        setSelectedRecipe(recipe);
        setStep(3);
    };

    return (
        <div className="flex flex-col gap-6">
            {step < 3 && (
                <div className="text-center">
                    <h2 className="text-2xl font-lora font-bold text-stone-800">Chef Mode</h2>
                    <p className="text-stone-600 text-sm">Turn your ingredients into a masterpiece.</p>
                </div>
            )}

            {step === 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-200">
                    <label className="block text-sm font-bold text-stone-800 mb-2">What's in your pantry?</label>
                    <textarea 
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="e.g. Chicken, lemon, garlic, pasta..."
                        className="w-full h-32 p-4 bg-cream-100/80 border border-cream-200 rounded-xl focus:ring-brand-400/30 resize-none"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={!ingredients.trim()}
                        className="mt-4 w-full bg-brand-400 text-white font-bold py-3 rounded-xl hover:bg-cream-200 transition-all disabled:opacity-50"
                    >
                        Create Menu
                    </button>
                </div>
            )}

            {step === 1 && (
                <div className="text-center py-12">
                    <Spinner />
                    <p className="text-stone-600 mt-4">Inventing recipes...</p>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="font-bold text-stone-800">Chef's Specials</h3>
                        <button onClick={() => setStep(0)} className="text-xs text-brand-400 font-bold">Edit Pantry</button>
                    </div>
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="bg-white p-5 rounded-xl border border-cream-200 shadow-sm relative group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg text-stone-800">{recipe.name}</h4>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">{recipe.difficulty}</span>
                            </div>
                            <p className="text-sm text-stone-600 mb-3">{recipe.summary}</p>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
                                    <Icon name="scale" className="w-3 h-3" /> {recipe.time}
                                </span>
                                <button 
                                    onClick={() => handleSelectRecipe(recipe)}
                                    className="bg-brand-400 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-opacity-90 transition-all"
                                >
                                    Start Cooking
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {step === 3 && selectedRecipe && (
                <div className="animate-fade-in">
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-800 mb-4">
                        <Icon name="chevron-left" className="w-4 h-4" /> Back to Menu
                    </button>
                    <h2 className="text-2xl font-lora font-bold text-stone-800 mb-6">{selectedRecipe.name}</h2>
                    <div className="space-y-4">
                        {selectedRecipe.steps.map((s: string, idx: number) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl border border-cream-200 shadow-sm flex gap-4">
                                <div className="w-8 h-8 bg-brand-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {idx + 1}
                                </div>
                                <p className="text-stone-800 leading-relaxed font-medium">{s}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 text-center p-6 bg-green-50 rounded-xl border border-green-100">
                        <Icon name="sparkles" className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <h3 className="font-bold text-green-800">Bon Appétit!</h3>
                    </div>
                </div>
            )}
        </div>
    );
};
