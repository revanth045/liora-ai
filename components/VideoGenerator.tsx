



import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { Spinner } from './Spinner';
import { Icon } from './Icon';

const loadingMessages = [
    "Warming up the cameras...",
    "Setting the scene...",
    "Adding a sprinkle of magic...",
    "Finalizing your video... This can take a few minutes.",
    "Almost there, adding the final touches...",
];

export const VideoGenerator: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('a delicious looking steak');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const loadingIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkApiKey();
    }, []);
    
    useEffect(() => {
        if (isLoading) {
            loadingIntervalRef.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 4000);
        } else if (loadingIntervalRef.current) {
            clearInterval(loadingIntervalRef.current);
            loadingIntervalRef.current = null;
        }

        return () => {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }
        };
    }, [isLoading]);

    // Cleanup for video object URL to prevent memory leaks
    useEffect(() => {
        const url = videoUrl;
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [videoUrl]);

    const handleSelectKey = async () => {
        if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile || !prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            const videoBlobUrl = await generateVideo(imageFile, prompt, aspectRatio);
            setVideoUrl(videoBlobUrl);
        } catch (err: any) {
            console.error(err);
            let errorMessage = 'Failed to generate the video. Please try again later.';
            if (err.message.includes('Requested entity was not found')) {
                errorMessage = 'Your API key is invalid. Please select a valid key to continue.';
                setApiKeySelected(false);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!apiKeySelected) {
        return (
            <div className="w-full h-full bg-cream-50 border border-cream-200 rounded-2xl shadow-lg p-6 flex flex-col justify-center items-center gap-4 text-center">
                <Icon name="video" className="w-16 h-16 text-stone-600" />
                <h2 className="text-2xl font-lora text-stone-800">Video Generator</h2>
                <p className="text-stone-600 max-w-md">This feature uses a model that requires you to select your own API key and enable billing. For more information, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">billing documentation</a>.</p>
                <button
                    onClick={handleSelectKey}
                    className="flex justify-center items-center bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-md"
                >
                    Select API Key to Continue
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-cream-50 border border-cream-200 rounded-2xl shadow-md p-4 md:p-6 flex flex-col gap-4">
            <h2 className="text-2xl font-lora text-stone-800">Video Generator</h2>
            <p className="text-stone-600">Upload a photo of a dish, describe it, and Liora will create a short video animation.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-stone-600 mb-1">Upload an image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-cream-200 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="mx-auto h-24 w-auto rounded-md object-cover"/>
                            ) : (
                                <Icon name="camera" className="mx-auto h-12 w-12 text-stone-600" />
                            )}
                            <div className="flex text-sm text-stone-600 justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-400 hover:text-yellow-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-400">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-stone-600">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-stone-600">Describe the dish</label>
                        <input type="text" name="prompt" id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A juicy steak with asparagus" className="mt-1 block w-full p-2 border border-cream-200 rounded-md shadow-sm focus:ring-brand-400/30 focus:border-brand-400 bg-white text-stone-800" />
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-stone-600">Aspect Ratio</span>
                        <div className="mt-2 flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="aspectRatio" value="16:9" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} className="h-4 w-4 text-brand-400 border-cream-200 focus:ring-brand-400/30" />
                                <span>Landscape (16:9)</span>
                            </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="aspectRatio" value="9:16" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} className="h-4 w-4 text-brand-400 border-cream-200 focus:ring-brand-400/30" />
                                <span>Portrait (9:16)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading || !imageFile || !prompt.trim()}
                className="flex justify-center items-center w-full bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
            >
                {isLoading ? <Spinner /> : 'Generate Video'}
            </button>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <div className="mt-4 flex-grow flex items-center justify-center bg-cream-100/50 rounded-lg min-h-[300px] md:min-h-[400px]">
                {isLoading && (
                    <div className="text-center text-stone-600">
                        <Spinner />
                        <p className="mt-2">{loadingMessage}</p>
                    </div>
                )}
                {!isLoading && videoUrl && (
                    <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                )}
                {!isLoading && !videoUrl && (
                    <div className="text-center text-stone-600">
                        <Icon name="video" className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                        <p>Your generated video will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
