import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../../types';
import { userScopedKey, onSessionChange } from '../lib/perUserStorage';

const BASE = 'liora-favorites';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<ChatMessage[]>([]);

    const reload = useCallback(() => {
        try {
            const stored = localStorage.getItem(userScopedKey(BASE));
            setFavorites(stored ? JSON.parse(stored) : []);
        } catch (e) {
            console.error("Failed to parse favorites from localStorage", e);
            setFavorites([]);
        }
    }, []);

    useEffect(() => {
        reload();
        return onSessionChange(reload);
    }, [reload]);

    const addFavorite = useCallback((message: ChatMessage) => {
        setFavorites(prev => {
            if (prev.some(f => f.id === message.id)) return prev;
            const next = [...prev, message];
            localStorage.setItem(userScopedKey(BASE), JSON.stringify(next));
            return next;
        });
    }, []);

    const removeFavorite = useCallback((messageId: string) => {
        setFavorites(prev => {
            const next = prev.filter(f => f.id !== messageId);
            localStorage.setItem(userScopedKey(BASE), JSON.stringify(next));
            return next;
        });
    }, []);

    return { favorites, addFavorite, removeFavorite };
};