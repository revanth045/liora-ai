

import React, { useState } from 'react';
import { generateChefDescriptions } from '../services/geminiService';
import { ChefDashboardResult } from '../types';
import { Spinner } from './Spinner';

export const ChefDashboard: React.FC = () => {
    const [inputs, setInputs] = useState({
        name: 'Seared Salmon Bowl',
        core: 'salmon, jasmine rice, miso glaze, pickled veg',
        audience: 'busy lunch crowd',
        tone: 'elevated but approachable'
    });
    const [result, setResult] = useState<ChefDashboardResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const parsedResult = await generateChefDescriptions(inputs);
            setResult(parsedResult);
        } catch (err) {
            let message = 'Failed to generate descriptions. Please check your inputs and try again.';
            if (err instanceof Error && err.message === 'Invalid JSON from model') {
                message = 'Sorry, I received an unexpected response from the AI. Please try again.';
            }
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="w-full bg-cream-50 border border-cream-200 rounded-2xl shadow-md p-4 md:p-6 flex flex-col gap-4">
            <h2 className="text-2xl font-lora text-stone-800">Chef Dashboard</h2>
            <p className="text-stone-600">Generate compelling menu descriptions and marketing snippets for your dishes.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-stone-600">Dish Name</label>
                    <input type="text" name="name" value={inputs.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-cream-200 rounded-md shadow-sm focus:ring-brand-400/30 focus:border-brand-400 bg-white text-stone-800"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-stone-600">Core Ingredients</label>
                    <input type="text" name="core" value={inputs.core} onChange={handleChange} className="mt-1 block w-full p-2 border border-cream-200 rounded-md shadow-sm focus:ring-brand-400/30 focus:border-brand-400 bg-white text-stone-800"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-stone-600">Target Audience</label>
                    <input type="text" name="audience" value={inputs.audience} onChange={handleChange} className="mt-1 block w-full p-2 border border-cream-200 rounded-md shadow-sm focus:ring-brand-400/30 focus:border-brand-400 bg-white text-stone-800"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-stone-600">Desired Tone</label>
                    <input type="text" name="tone" value={inputs.tone} onChange={handleChange} className="mt-1 block w-full p-2 border border-cream-200 rounded-md shadow-sm focus:ring-brand-400/30 focus:border-brand-400 bg-white text-stone-800"/>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex justify-center items-center w-full bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
            >
                {isLoading ? <><Spinner /> <span className="ml-2">Generating descriptions...</span></> : 'Generate Descriptions'}
            </button>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {result && (
                <div className="mt-4 space-y-6">
                    <div>
                        <h3 className="text-xl font-lora text-stone-800 mb-2">Menu Description</h3>
                         <div className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow">
                            <p className="text-stone-800">{result.short_description}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-lora text-stone-800 mb-2">Marketing Snippets</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {result.variants.map((variant, index) => (
                                <div key={index} className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow flex flex-col">
                                    <p className="font-bold text-stone-800">{variant.title}</p>
                                    <p className="text-sm text-stone-600 mt-1 flex-grow">"{variant.snippet}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};