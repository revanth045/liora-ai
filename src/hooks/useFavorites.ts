import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';

const LOCAL_STORAGE_KEY = 'liora-favorites';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<ChatMessage[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to parse favorites from localStorage", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }, []);

    const addFavorite = useCallback((message: ChatMessage) => {
        setFavorites(prev => {
            if (prev.some(f => f.id === message.id)) {
                return prev;
            }
            const newFavorites = [...prev, message];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    const removeFavorite = useCallback((messageId: string) => {
        setFavorites(prev => {
            const newFavorites = prev.filter(f => f.id !== messageId);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    return { favorites, addFavorite, removeFavorite };
};