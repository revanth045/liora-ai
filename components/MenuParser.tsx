
import React, { useState } from 'react';
import { parseMenuFromText, summarizeMenuForCard } from '../services/geminiService';
import { ParsedMenuItem, MenuSummary } from '../types';
import { Spinner } from './Spinner';

export const MenuParser: React.FC = () => {
    const [menuText, setMenuText] = useState('');
    const [parsedMenu, setParsedMenu] = useState<ParsedMenuItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    const [summary, setSummary] = useState<MenuSummary | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const handleParse = async () => {
        if (!menuText.trim()) return;
        setIsLoading(true);
        setLoadingMessage('Parsing your menu...');
        setError(null);
        setParsedMenu(null);
        setSummary(null);
        setSummaryError(null);
        try {
            const result = await parseMenuFromText(menuText);
            setParsedMenu(result);
        } catch (err) {
            let message = 'Failed to parse the menu. Please check the format and try again.';
            if (err instanceof Error && err.message === 'Invalid JSON from model') {
                message = 'Sorry, I received an unexpected response from the AI. Please try again.';
            }
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (!parsedMenu) return;
        setIsSummarizing(true);
        setLoadingMessage('Crafting a summary...');
        setSummaryError(null);
        setSummary(null);
        try {
            const result = await summarizeMenuForCard(parsedMenu);
            setSummary(result);
        } catch (err) {
            let message = 'Failed to generate a summary. Please try again.';
            if (err instanceof Error && err.message === 'Invalid JSON from model') {
                message = 'Sorry, I received an unexpected response from the AI. Please try again.';
            }
            setSummaryError(message);
            console.error(err);
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="w-full h-full bg-cream-50 border border-cream-200 rounded-2xl shadow-lg p-6 flex flex-col gap-4">
            <h2 className="text-2xl font-lora text-stone-800">Menu Parser</h2>
            <p className="text-stone-400">Paste a messy menu below, and Liora will turn it into a clean, searchable list.</p>
            <textarea
                value={menuText}
                onChange={(e) => setMenuText(e.target.value)}
                placeholder="e.g., Margherita Pizza - Tomato, Mozzarella, Basil - $12.99..."
                className="w-full h-48 p-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-brand-400/30 transition-shadow duration-200 resize-none bg-white text-stone-800"
                disabled={isLoading}
            />
            <button
                onClick={handleParse}
                disabled={isLoading || !menuText.trim()}
                className="flex justify-center items-center w-full bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
            >
                {isLoading ? <><Spinner /> <span className="ml-2">{loadingMessage}</span></> : 'Parse Menu'}
            </button>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {parsedMenu && (
                <div className="mt-4 flex-grow overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-xl font-lora text-stone-800">Parsed Menu</h3>
                        <button
                            onClick={handleSummarize}
                            disabled={isSummarizing}
                            className="flex justify-center items-center bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
                        >
                            {isSummarizing ? <Spinner /> : 'Summarize'}
                        </button>
                    </div>

                    {summaryError && <p className="text-red-500 text-center my-2">{summaryError}</p>}
                    
                    {isSummarizing && (
                        <div className="flex flex-col items-center justify-center my-4 text-center text-stone-400">
                            <Spinner />
                            <p className="mt-2">{loadingMessage}</p>
                        </div>
                    )}

                    {summary && (
                        <div className="my-4 p-6 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl shadow-lg border border-yellow-200">
                            <h4 className="font-lora text-2xl text-stone-800 font-bold">{summary.headline}</h4>
                            <p className="text-md text-stone-400 mt-1">{summary.sub}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {summary.tags.map((tag, index) => (
                                    <span key={index} className="px-3 py-1 bg-white text-stone-400 text-sm font-semibold rounded-full shadow-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <ul className="space-y-3">
                        {parsedMenu.map((item, index) => (
                            <li key={index} className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow">
                                <p className="font-bold text-stone-800">{item.recipeName}</p>
                                <p className="text-sm text-stone-400">{item.ingredients.join(', ')}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
