import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getCalorieLog } from '../services/geminiService';
import { CalorieLogResult, FavoriteFood, CalorieLogItem } from '../types';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import { uid } from '../utils/uid';

const FAVORITE_FOODS_KEY = 'liora-favorite-foods';

interface CalorieLogProps {
    date: string; // YYYY-MM-DD
    existingLog: CalorieLogResult | null;
    onSave: (result: CalorieLogResult) => void;
    onDelete: () => void;
}

export const CalorieLog: React.FC<CalorieLogProps> = ({ date, existingLog, onSave, onDelete }) => {
    const [logText, setLogText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isEditing, setIsEditing] = useState(!existingLog);

    // Favorite Foods Logic
    const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        try {
            const stored = localStorage.getItem(FAVORITE_FOODS_KEY);
            if (stored) setFavoriteFoods(JSON.parse(stored));
        } catch (e) { console.error(e); }
    }, []);

    const addFavoriteFood = useCallback((item: CalorieLogItem) => {
        setFavoriteFoods(prev => {
            if (prev.some(f => f.line.toLowerCase().trim() === item.line.toLowerCase().trim())) {
                return prev;
            }
            const newFavorite: FavoriteFood = { ...item, id: uid() };
            const newFavorites = [...prev, newFavorite];
            localStorage.setItem(FAVORITE_FOODS_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    const removeFavoriteFood = useCallback((foodId: string) => {
        setFavoriteFoods(prev => {
            const newFavorites = prev.filter(f => f.id !== foodId);
            localStorage.setItem(FAVORITE_FOODS_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    const filteredFoods = favoriteFoods.filter(food =>
        food.line.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddFavoriteToLog = (food: FavoriteFood) => {
        setLogText(prev => (prev.trim() ? `${prev.trim()}\n${food.line}` : food.line));
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

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAnalyze = async () => {
        if (!logText.trim() && !imageFile) return;
        setIsLoading(true);
        setError(null);
        try {
            let imageInput: {data: string, mimeType: string} | undefined = undefined;
            if (imageFile && imagePreview) {
                imageInput = {
                    data: imagePreview.split(',')[1],
                    mimeType: imageFile.type,
                };
            }

            const analysis = await getCalorieLog(logText, imageInput);
            onSave(analysis);
            setIsEditing(false); // Switch to display view after saving
        } catch (err) {
            let message = 'Failed to analyze your log. Please try again.';
            if (err instanceof Error && err.message === 'Invalid JSON from model') {
                message = 'Sorry, I received an unexpected response from the AI. Please try again.';
            }
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const renderTotals = (totals: CalorieLogResult['totals']) => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-yellow-100 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-yellow-800 font-semibold">Calories</p>
                <p className="text-2xl font-bold text-stone-800">{totals.calories.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-blue-800 font-semibold">Protein</p>
                <p className="text-2xl font-bold text-stone-800">{totals.protein_g.toFixed(1)}g</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-red-800 font-semibold">Fat</p>
                <p className="text-2xl font-bold text-stone-800">{totals.fat_g.toFixed(1)}g</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-green-800 font-semibold">Carbs</p>
                <p className="text-2xl font-bold text-stone-800">{totals.carbs_g.toFixed(1)}g</p>
            </div>
        </div>
    );
    
    const renderDisplayView = () => {
        if (!existingLog) return null;
        return (
             <div className="space-y-6 animate-fade-in">
                <div>
                    <h3 className="text-xl font-lora text-stone-800 mb-3">Daily Totals</h3>
                    {renderTotals(existingLog.totals)}
                </div>
                {existingLog.notes && (
                    <div className="p-4 bg-blue-50/70 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
                        <p className="font-semibold">Liora's Note</p>
                        <p className="text-sm">{existingLog.notes}</p>
                    </div>
                )}
                <div>
                    <h3 className="text-xl font-lora text-stone-800 mb-3">Item Breakdown</h3>
                    <ul className="space-y-3">
                        {existingLog.items.map((item, index) => {
                            const isFavorited = favoriteFoods.some(f => f.line.toLowerCase().trim() === item.line.toLowerCase().trim());
                            return (
                                <li key={index} className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-sm flex justify-between items-start">
                                    <div className="flex-grow">
                                        <p className="font-bold text-stone-800">{item.line}</p>
                                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-stone-600">
                                            <span><strong>Cals:</strong> {item.calories}</span>
                                            <span><strong>P:</strong> {item.protein_g.toFixed(1)}g</span>
                                            <span><strong>F:</strong> {item.fat_g.toFixed(1)}g</span>
                                            <span><strong>C:</strong> {item.carbs_g.toFixed(1)}g</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => addFavoriteFood(item)} 
                                        disabled={isFavorited}
                                        className="p-1.5 rounded-full disabled:opacity-50 flex-shrink-0 ml-4"
                                        title={isFavorited ? "Already a favorite" : "Save as favorite"}
                                    >
                                        <Icon name={isFavorited ? "star-solid" : "star"} className="w-5 h-5 text-yellow-400" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 mt-4 border-t border-dashed">
                    <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600">Edit Log</button>
                    <button onClick={onDelete} className="w-full sm:w-auto bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600">Delete Log</button>
                </div>
            </div>
        );
    };
    
    const renderEditView = () => {
         return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Column 1: Log Input */}
                <div className="flex flex-col gap-4">
                    <p className="text-stone-600 text-sm">Describe your meals, or upload a photo, and Liora will estimate the nutritional breakdown.</p>
                    <textarea
                        value={logText}
                        onChange={(e) => setLogText(e.target.value)}
                        placeholder="e.g.,&#10;Breakfast: 2 eggs, avocado toast&#10;Lunch: Grilled chicken salad"
                        className="w-full p-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-brand-400/30 flex-grow resize-none bg-white text-stone-800"
                        disabled={isLoading}
                    />
                    {imagePreview && (
                        <div className="relative w-32 self-center">
                            <img src={imagePreview} alt="Food log preview" className="rounded-lg shadow-md w-full h-auto" />
                            <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600" aria-label="Remove image">
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-4 mt-auto">
                        <button onClick={handleAnalyze} disabled={isLoading || (!logText.trim() && !imageFile)} className="flex-grow flex justify-center items-center bg-brand-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 shadow-md">
                            {isLoading ? <><Spinner /> <span className="ml-2">Analyzing...</span></> : existingLog ? 'Update Analysis' : 'Analyze & Save'}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center gap-2 bg-white text-stone-600 font-bold py-3 px-4 rounded-lg hover:bg-black/5 border border-cream-200 shadow-md disabled:opacity-50">
                            <Icon name="camera" className="w-5 h-5" />
                        </button>
                    </div>
                    {existingLog && (
                        <button onClick={() => setIsEditing(false)} className="mt-2 text-sm text-center text-stone-600 hover:underline w-full">Cancel Edit</button>
                    )}
                </div>
                {/* Column 2: Favorite Foods */}
                <div className="bg-cream-100/50 p-4 rounded-lg flex flex-col h-full max-h-[500px] lg:max-h-full">
                    <h3 className="font-lora text-lg text-stone-800 mb-3">Add from Favorites</h3>
                    <div className="relative mb-3">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon name="search" className="w-4 h-4 text-stone-600" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search favorites..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-9 border border-cream-200 rounded-full focus:ring-2 focus:ring-brand-400/30 bg-white text-sm"
                        />
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                        {favoriteFoods.length === 0 ? (
                            <div className="text-center text-sm text-stone-600 py-8">
                                <p>No favorite foods saved yet.</p>
                                <p className="text-xs mt-1">Save items from your analyzed logs to add them here.</p>
                            </div>
                        ) : filteredFoods.length === 0 ? (
                            <div className="text-center text-sm text-stone-600 py-8">
                                <p>No matches for "{searchTerm}".</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {filteredFoods.map(food => (
                                    <li key={food.id} className="bg-cream-50 border border-cream-200 p-2 rounded-md flex items-center justify-between group">
                                        <div className="flex-grow overflow-hidden mr-2">
                                            <p className="font-semibold text-sm text-stone-800 truncate">{food.line}</p>
                                            <p className="text-xs text-stone-600 truncate">
                                                {food.calories}kcal &bull; P:{food.protein_g.toFixed(0)}g &bull; F:{food.fat_g.toFixed(0)}g &bull; C:{food.carbs_g.toFixed(0)}g
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                            <button onClick={() => handleAddFavoriteToLog(food)} className="p-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200" title="Add to today's log">
                                                <Icon name="plus" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => removeFavoriteFood(food.id)} className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 opacity-0 group-hover:opacity-100" title="Remove favorite">
                                                <Icon name="trash" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
         <div className="w-full bg-cream-50 border border-cream-200 rounded-2xl shadow-md p-4 md:p-6 flex flex-col gap-4">
            <h2 className="text-2xl font-lora text-stone-800">Log for {formattedDate}</h2>
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {isLoading && (
                 <div className="flex flex-col flex-grow items-center justify-center text-center text-stone-600">
                    <Spinner />
                    <p className="mt-2">Calculating your nutrition...</p>
                </div>
            )}

            {!isLoading && (isEditing ? renderEditView() : renderDisplayView())}

            {!isLoading && !isEditing && !existingLog && (
                <div className="flex flex-col items-center justify-center text-center text-stone-600 p-6 bg-cream-100/50 rounded-lg min-h-[300px] flex-grow">
                    <Icon name="scale" className="w-12 h-12 text-stone-600 mb-2" />
                    <p>No log for this day.</p>
                    <button onClick={() => setIsEditing(true)} className="mt-4 bg-brand-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90">Add Log</button>
                </div>
            )}
         </div>
    );
};