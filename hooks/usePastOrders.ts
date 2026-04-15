import { useState, useEffect, useCallback } from 'react';
import { PastOrder } from '../types';
import { uid } from '../utils/uid';
import { useSession } from '../src/auth/useSession';

const storageKey = (email: string | null) =>
    email ? `liora-past-orders-${email}` : 'liora-past-orders-guest';

export const usePastOrders = () => {
    const session = useSession();
    const userEmail = session?.user?.email ?? null;
    const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey(userEmail));
            setPastOrders(stored ? JSON.parse(stored) : []);
        } catch (e) {
            console.error("Failed to parse past orders from localStorage", e);
            localStorage.removeItem(storageKey(userEmail));
            setPastOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, [userEmail]);

    const addOrder = useCallback((order: Omit<PastOrder, 'id'>) => {
        setPastOrders(prev => {
            const newOrder: PastOrder = { ...order, id: uid() };
            const newOrders = [newOrder, ...prev];
            try {
                localStorage.setItem(storageKey(userEmail), JSON.stringify(newOrders));
            } catch (e) {
                console.error("Failed to save past orders to localStorage", e);
            }
            return newOrders;
        });
    }, [userEmail]);

    return { pastOrders, addOrder, isLoading };
};
