
import { useState, useEffect, useRef } from 'react';

const defaultMessages = [
    "Thinking...",
    "Consulting experts...",
    "Gathering insights...",
    "Crafting the perfect response...",
    "Just a moment...",
];

export const useDynamicLoadingMessage = (isLoading: boolean, messages: string[] = defaultMessages, interval = 3000) => {
    const [loadingMessage, setLoadingMessage] = useState(messages[0]);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isLoading) {
            setLoadingMessage(messages[0]);
            intervalRef.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = messages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % messages.length;
                    return messages[nextIndex];
                });
            }, interval);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isLoading, messages, interval]);

    return loadingMessage;
};
