import React, { useState } from 'react';
import { classifySupportRequest } from '../services/geminiService';
import { SupportRequestResult } from '../types';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import { useDynamicLoadingMessage } from '../src/hooks/useDynamicLoadingMessage';

const supportLoadingMessages = [
    "Analyzing your request...",
    "Understanding the issue...",
    "Routing your request...",
    "Preparing a helpful response..."
];

export const CustomerSupport: React.FC = () => {
    const [request, setRequest] = useState('');
    const [result, setResult] = useState<SupportRequestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for order tracking
    const [orderId, setOrderId] = useState('');
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    const loadingMessage = useDynamicLoadingMessage(isLoading, supportLoadingMessages);

    const handleSubmit = async () => {
        if (!request.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const parsedResult = await classifySupportRequest(request);
            setResult(parsedResult);
        } catch (err) {
            let message = 'An unexpected error occurred. Please check your connection and try again.';
            if (err instanceof Error && err.message === 'Invalid JSON from model') {
                message = "I'm having a little trouble understanding that. Could you please try rephrasing your request? Being more specific helps, e.g., 'My order #12345 arrived damaged.'";
            }
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTrackOrder = async () => {
        if (!orderId.trim()) return;
        setIsTracking(true);
        setOrderStatus(null);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockStatuses: { [key: string]: string } = {
            "12345": "Your pizza is on its way and should arrive in 15 minutes!",
            "67890": "Your order is being prepared by the restaurant.",
            "11223": "Order #11223 was delivered yesterday. Enjoy!",
        };

        const status = mockStatuses[orderId.trim()] || `No order found with ID #${orderId.trim()}. Please double-check the number.`;
        setOrderStatus(status);
        setIsTracking(false);
    };

    return (
        <div className="w-full bg-cream-50 border border-cream-200 rounded-2xl shadow-md p-4 md:p-6 flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-lora text-stone-800">Customer Support</h2>
                <p className="text-stone-400">Get help with orders, your account, or provide feedback.</p>
            </div>

            {/* Order Tracking Section */}
            <div className="p-4 bg-cream-50 border border-cream-200 rounded-lg shadow-sm border border-cream-200">
                <h3 className="font-lora text-lg text-stone-800 mb-3">Track Your Order</h3>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="Enter Order ID..."
                        className="flex-grow w-full p-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-brand-400/30 transition-shadow duration-200 bg-white text-stone-800"
                        disabled={isTracking}
                        onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
                    />
                    <button
                        onClick={handleTrackOrder}
                        disabled={isTracking || !orderId.trim()}
                        className="flex-shrink-0 w-full sm:w-auto flex justify-center items-center bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
                    >
                        {isTracking ? <Spinner /> : 'Track'}
                    </button>
                </div>
                {orderStatus && (
                    <div className="mt-3 p-3 bg-yellow-100/60 text-yellow-900 rounded-lg text-sm animate-fade-in">
                        {orderStatus}
                    </div>
                )}
            </div>

            {/* General Support Chat Section */}
             <div className="p-4 bg-cream-50 border border-cream-200 rounded-lg shadow-sm border border-cream-200 flex flex-col gap-4">
                 <h3 className="font-lora text-lg text-stone-800">General Support Chat</h3>
                <p className="text-stone-400 text-sm">For other questions about your account, allergies, or feedback, let us know how we can help.</p>
                <textarea
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    placeholder="e.g., 'My pizza was cold.' or 'How do I update my payment method?'"
                    className="w-full h-24 p-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-brand-400/30 transition-shadow duration-200 resize-none bg-white text-stone-800"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !request.trim()}
                    className="flex justify-center items-center w-full bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
                >
                    {isLoading ? <><Spinner /> <span className="ml-2">{loadingMessage}</span></> : 'Submit Request'}
                </button>

                {error && <p className="text-red-500 text-center">{error}</p>}

                {result && (
                    <div className="mt-4 flex-grow overflow-y-auto space-y-4 animate-fade-in">
                        <div>
                            <h3 className="text-md font-lora text-stone-800">Liora's Response:</h3>
                            <div className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-inner mt-1">
                                <p>{result.response_text}</p>
                            </div>
                        </div>
                         <div>
                            <h3 className="text-md font-lora text-stone-800">Action Summary:</h3>
                             <pre className="p-3 bg-gray-800 text-white rounded-md text-sm overflow-x-auto mt-1">
                                {JSON.stringify(result.action_json, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};