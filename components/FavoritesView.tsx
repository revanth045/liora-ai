
import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { Icon } from './Icon';

interface FavoritesViewProps {
    favorites: ChatMessage[];
    removeFavorite: (messageId: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ favorites, removeFavorite }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFavorites = favorites.filter(fav =>
        fav.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-cream-200">
                <h2 className="text-xl font-lora font-bold text-stone-800 mb-4">Saved Favorites</h2>
                {favorites.length > 0 && (
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon name="search" className="w-4 h-4 text-stone-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search favorites..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-9 bg-cream-100/80 border border-cream-200 rounded-lg text-sm focus:ring-brand-400/30"
                        />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {favorites.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                        <Icon name="bookmark" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No favorites saved yet.</p>
                        <p className="text-xs mt-1">Tap the heart on any message to save it.</p>
                    </div>
                ) : filteredFavorites.length === 0 ? (
                     <div className="text-center py-10 text-stone-400">No matches found.</div>
                ) : (
                    filteredFavorites.map((msg) => (
                        <div key={msg.id} className="bg-white p-5 rounded-2xl shadow-sm border border-cream-200 relative group">
                            <p className="whitespace-pre-wrap text-sm text-stone-800 leading-relaxed">{msg.text}</p>
                            
                            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-cream-200/60">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2">Sources</h4>
                                    <ul className="space-y-2">
                                        {msg.groundingChunks.map((chunk, idx) => {
                                            const source = chunk.web || chunk.maps;
                                            if (!source) return null;
                                            return (
                                                <li key={idx}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline truncate">
                                                        <Icon name="link" className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{source.title}</span>
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={() => removeFavorite(msg.id)}
                                className="absolute top-3 right-3 text-stone-400 hover:text-red-500 transition-colors"
                                aria-label="Remove from favorites"
                            >
                                <Icon name="trash" className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
