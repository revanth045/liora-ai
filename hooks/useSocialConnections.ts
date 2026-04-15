import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'liora-social-connections';

export type SocialPlatform = 'facebook' | 'instagram' | 'x';

type Connections = {
    [key in SocialPlatform]?: boolean;
};

export const useSocialConnections = () => {
    const [connections, setConnections] = useState<Connections>({});

    useEffect(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                setConnections(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load social connections from localStorage", e);
        }
    }, []);

    const updateConnections = useCallback((newConnections: Connections) => {
        setConnections(newConnections);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConnections));
        } catch (e) {
            console.error("Failed to save social connections to localStorage", e);
        }
    }, []);

    const connect = useCallback((platform: SocialPlatform) => {
        updateConnections({ ...connections, [platform]: true });
    }, [connections, updateConnections]);

    const disconnect = useCallback((platform: SocialPlatform) => {
        const newConnections = { ...connections };
        delete newConnections[platform];
        updateConnections(newConnections);
    }, [connections, updateConnections]);

    const isConnected = useCallback((platform: SocialPlatform) => {
        return !!connections[platform];
    }, [connections]);
    
    const hasAnyConnection = useCallback(() => {
        return Object.values(connections).some(status => status === true);
    }, [connections]);

    return { connections, connect, disconnect, isConnected, hasAnyConnection };
};
