import React, { useState } from 'react';
import { classifyRestaurantSupportRequest } from '../../../services/geminiService';
import { RestaurantSupportRequestResult } from '../../../types';
import { Spinner } from '../../../components/Spinner';
import type { DemoRestaurant } from '../../demoDb';
import { useDynamicLoadingMessage } from '../../hooks/useDynamicLoadingMessage';

const supportLoadingMessages = [
    "Analyzing your request...",
    "Understanding the issue...",
    "Routing to the right department...",
    "Preparing a response..."
];

const FAQItem = ({ q, a }: { q: string; a: string }) => (
    <details className="border-b border-cream-200 py-3">
        <summary className="font-semibold cursor-pointer flex justify-between items-center group">
            {q}
            <span className="text-brand-400 transform transition-transform duration-200 group-open:rotate-45 text-2xl font-light">+</span>
        </summary>
        <p className="mt-2 text-stone-400 text-sm">{a}</p>
    </details>
);

export default function RestoSupport({restaurant}:{restaurant:DemoRestaurant}) {
    const [request, setRequest] = useState('');
    const [result, setResult] = useState<RestaurantSupportRequestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadingMessage = useDynamicLoadingMessage(isLoading, supportLoadingMessages);

    const handleSubmit = async () => {
        if (!request.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const parsedResult = await classifyRestaurantSupportRequest(request);
            setResult(parsedResult);
        } catch (err) {
            let message = 'An unexpected error occurred. Please check your connection and try again.';
            if (err instanceof Error && err.message === 'Invalid JSON from model') {
                message = "I'm having trouble categorizing that. Could you be more specific? For example: 'I need to update my bank details for payouts' or 'The video generator in the Menu Studio is not working'.";
            }
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-cream-50 border border-cream-200 rounded-2xl shadow-lg p-6">
                <h3 className="font-lora text-xl text-stone-800 mb-3">Submit a Support Ticket</h3>
                <p className="text-stone-400 text-sm mb-4">Have an issue with billing, a technical problem, or a feature request? Let us know below and our AI assistant will route your request.</p>
                <textarea
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    placeholder="e.g., 'I have a question about my last invoice.' or 'I'm having trouble uploading a new menu photo.'"
                    className="w-full h-24 p-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-brand-400/30 transition-shadow duration-200 resize-none bg-white text-stone-800"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !request.trim()}
                    className="mt-4 flex justify-center items-center bg-brand-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
                >
                    {isLoading ? <><Spinner /> <span className="ml-2">{loadingMessage}</span></> : 'Submit Request'}
                </button>

                {error && <p className="text-red-500 text-center mt-3">{error}</p>}

                {result && (
                    <div className="mt-6 pt-6 border-t border-dashed border-cream-200 space-y-4 animate-fade-in">
                        <div>
                            <h3 className="text-md font-lora text-stone-800">Liora's Response:</h3>
                            <div className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-inner mt-1">
                                <p>{result.response_text}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-md font-lora text-stone-800">Ticket Summary (for our team):</h3>
                            <pre className="p-3 bg-gray-800 text-white rounded-md text-sm overflow-x-auto mt-1">
                                {JSON.stringify(result.action_json, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-cream-50 border border-cream-200 rounded-2xl shadow-lg p-6">
                <h3 className="font-lora text-xl text-stone-800 mb-3">Frequently Asked Questions</h3>
                <FAQItem 
                    q="How do I update my menu?" 
                    a="Navigate to the 'Menu Studio' tab. From there, you can add new items using the form, or edit, disable, or delete existing items from your current menu list."
                />
                <FAQItem 
                    q="How does the AI Marketing Studio work?" 
                    a="In the 'Marketing Studio', you can describe a promotion or dish. Our AI will generate professional ad copy and social media posts. You can also generate a placeholder image to go with your campaign."
                />
                <FAQItem 
                    q="Where can I see my analytics?" 
                    a="The 'KPIs & Analytics' tab shows you key metrics like how many users have viewed your restaurant, opened your menu, or saved you as a favorite within the Liora app."
                />
                 <FAQItem 
                    q="How do I update my billing information?" 
                    a="Currently, billing is managed through your account settings. For specific invoice questions, please submit a support ticket with the 'Billing Inquiry' category."
                />
            </div>
        </div>
    );
}