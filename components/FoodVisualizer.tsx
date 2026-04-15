

import React, { useState, useEffect } from 'react';
import { generateFoodImage, generateFoodAnalysis } from '../services/geminiService';
import { Spinner } from './Spinner';
import { Icon } from './Icon';

type ImageSize = '1K' | '2K' | '4K';
type ModelType = 'standard' | 'pro';

export const FoodVisualizer: React.FC = () => {
    const [dish, setDish] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    
    // Settings for image generation
    const [modelType, setModelType] = useState<ModelType>('standard');
    const [imageSize, setImageSize] = useState<ImageSize>('1K');
    const [apiKeySelected, setApiKeySelected] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    };

    const handleGenerate = async () => {
        if (!dish.trim()) return;
        
        // If Pro model selected but no key, prompt user
        if (modelType === 'pro' && !apiKeySelected) {
            setError("High-quality generation requires your own API key. Please select one above.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        setAnalysis(null);
        try {
            const model = modelType === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
            const cinematicPrompt = `Professional food photography, magazine quality: ${dish}. Styled on a marble surface with natural window light, shallow depth of field, fresh garnish, warm inviting tones, appetizing presentation.`;
            const base64Image = await generateFoodImage(cinematicPrompt, { model, size: imageSize });
            setImageUrl(`data:image/jpeg;base64,${base64Image}`);
            // Non-blocking analysis
            setLoadingAnalysis(true);
            generateFoodAnalysis(dish)
                .then(a => setAnalysis(a))
                .catch(() => null)
                .finally(() => setLoadingAnalysis(false));
        } catch (err: any) {
            let message = 'Failed to generate the image. Please try again later.';
            if (err.message?.includes('403') || err.message?.includes('API key')) {
                message = 'API Key error. Please ensure you have selected a valid key with billing enabled.';
                setApiKeySelected(false);
            }
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-cream-50 border border-cream-200 rounded-2xl shadow-md p-4 md:p-6 flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-lora text-stone-800">Food Visualizer</h2>
                <p className="text-stone-400">Create photorealistic images of any dish.</p>
            </div>
            
            {/* Configuration Controls */}
            <div className="bg-white/60 p-3 rounded-lg border border-cream-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800">Quality:</span>
                        <div className="flex bg-cream-200/60 rounded-lg p-0.5">
                            <button 
                                onClick={() => setModelType('standard')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${modelType === 'standard' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                Standard
                            </button>
                            <button 
                                onClick={() => setModelType('pro')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${modelType === 'pro' ? 'bg-brand-400 text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <Icon name="sparkles" className="w-3 h-3" /> Pro
                            </button>
                        </div>
                    </div>

                    {modelType === 'pro' && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <span className="font-semibold text-stone-800">Size:</span>
                            <select 
                                value={imageSize} 
                                onChange={(e) => setImageSize(e.target.value as ImageSize)}
                                className="bg-white border border-cream-200 text-stone-600 text-xs rounded-md focus:ring-brand-400/30 focus:border-brand-400 block p-1"
                            >
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>
                        </div>
                    )}
                </div>

                {modelType === 'pro' && !apiKeySelected && (
                    <button 
                        onClick={handleSelectKey}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold hover:bg-blue-200 transition-colors animate-pulse"
                    >
                        Select API Key Required
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={dish}
                    onChange={(e) => setDish(e.target.value)}
                    placeholder="e.g., Spicy ramen with a soft-boiled egg"
                    className="w-full p-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-brand-400/30 transition-shadow duration-200 bg-white text-stone-800"
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading || !dish.trim() || (modelType === 'pro' && !apiKeySelected)}
                    className="flex justify-center items-center bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md whitespace-nowrap"
                >
                    {isLoading ? <Spinner /> : 'Generate'}
                </button>
            </div>

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <div className="mt-4 flex-grow flex items-center justify-center bg-cream-100/50 rounded-lg min-h-[300px] md:min-h-[400px] relative overflow-hidden border border-cream-200">
                {isLoading && (
                    <div className="text-center text-stone-400">
                        <Spinner />
                        <p className="mt-2">{modelType === 'pro' ? `Rendering ${imageSize} Image...` : 'Generating Image...'}</p>
                    </div>
                )}
                {!isLoading && imageUrl && (
                    <img src={imageUrl} alt={dish} className="max-w-full max-h-full object-contain rounded-lg shadow-lg animate-fade-in" />
                )}
                {!isLoading && !imageUrl && (
                    <div className="text-center text-stone-400">
                        <Icon name="camera" className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                        <p>Your generated food image will appear here.</p>
                    </div>
                )}
                {modelType === 'pro' && imageUrl && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                        Pro {imageSize}
                    </div>
                )}
            </div>

            {/* Chef Marco's Preparation Guide */}
            {(loadingAnalysis || analysis) && (
                <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm animate-fade-in">
                    <div className="bg-forest-900 px-5 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-400/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
                            <span className="font-lora font-bold text-sm text-brand-300">M</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-cream-50">Chef Marco's Preparation Guide</p>
                            <p className="text-xs text-cream-300">How to recreate this dish at home</p>
                        </div>
                        {analysis && (
                            <div className="flex gap-2 flex-shrink-0">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${analysis.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : analysis.difficulty === 'Advanced' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {analysis.difficulty}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-cream-200">{analysis.estimatedTime}</span>
                            </div>
                        )}
                    </div>

                    {loadingAnalysis && !analysis ? (
                        <div className="flex items-center justify-center gap-3 py-8 text-stone-400">
                            <Spinner />
                            <p className="text-sm animate-pulse">Chef Marco is preparing your guide…</p>
                        </div>
                    ) : analysis && (
                        <div className="p-5 space-y-4">
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl">
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Chef's Note</p>
                                <p className="text-sm italic text-stone-700">{analysis.chefNote}</p>
                            </div>

                            {analysis.keyTechniques?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Key Techniques</p>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.keyTechniques.map((t: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-forest-900/8 border border-forest-900/15 text-forest-900 rounded-full text-xs font-semibold">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysis.preparationSteps?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">How to Prepare</p>
                                    <ol className="space-y-2">
                                        {analysis.preparationSteps.map((step: string, i: number) => (
                                            <li key={i} className="flex gap-3 items-start">
                                                <span className="flex-shrink-0 w-5 h-5 bg-forest-900 text-cream-50 text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">{i + 1}</span>
                                                <p className="text-sm text-stone-700 leading-relaxed">{step}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {analysis.proTips?.length > 0 && (
                                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                                    <p className="font-bold text-amber-800 text-xs uppercase tracking-widest mb-2">Pro Tips</p>
                                    <ul className="space-y-1.5">
                                        {analysis.proTips.map((tip: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-sm text-stone-700">
                                                <span className="text-amber-500 font-bold flex-shrink-0">✦</span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.platingNote && (
                                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                                    <p className="font-bold text-blue-700 text-xs uppercase tracking-widest mb-1">Plating &amp; Presentation</p>
                                    <p className="text-sm text-stone-700">{analysis.platingNote}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
