import { userScopedKey, onSessionChange } from '../lib/perUserStorage';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { SubscriptionStatus, PlanInterval } from '../../types';

const BASE_KEY = 'liora-subscription';
const STORAGE_KEY_FN = () => userScopedKey(BASE_KEY);

const DEFAULT_STATUS: SubscriptionStatus = {
    isPremium: false,
    plan: null,
    startDate: null,
    renewalDate: null,
    isTrial: false,
    canceled: false,
};

interface SubscriptionContextType extends SubscriptionStatus {
    upgrade: (plan: PlanInterval) => Promise<void>;
    cancel: () => Promise<void>;
    restore: () => Promise<void>;
    daysLeftInTrial: number | null;
    isModalOpen: boolean;
    openModal: (initialStep?: 'benefits' | 'pricing') => void;
    closeModal: () => void;
    modalInitialStep: 'benefits' | 'pricing';
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<SubscriptionStatus>(DEFAULT_STATUS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialStep, setModalInitialStep] = useState<'benefits' | 'pricing'>('benefits');

    useEffect(() => {
        const reload = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY_FN());
                setStatus(stored ? JSON.parse(stored) : DEFAULT_STATUS);
            } catch (e) {
                console.error("Failed to parse subscription", e);
                setStatus(DEFAULT_STATUS);
            }
        };
        reload();
        return onSessionChange(reload);
    }, []);

    const saveStatus = (newStatus: SubscriptionStatus) => {
        setStatus(newStatus);
        localStorage.setItem(STORAGE_KEY_FN(), JSON.stringify(newStatus));
    };

    const daysLeftInTrial = useMemo(() => {
        if (!status.isPremium || !status.isTrial || !status.renewalDate) return null;
        const now = new Date();
        const renewal = new Date(status.renewalDate);
        const diffTime = renewal.getTime() - now.getTime();
        // Return 0 if expired, otherwise ceil for days remaining (e.g. 1.5 days -> 2 days left)
        if (diffTime < 0) return 0;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [status]);

    const upgrade = useCallback(async (plan: PlanInterval) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const now = new Date();
        const renewal = new Date();
        let isTrial = false;

        if (plan === 'lifetime') {
            // Lifetime: No trial, pay once, own forever. Set renewal far in future.
            renewal.setFullYear(2099, 11, 31);
            isTrial = false;
        } else {
            // Monthly & Yearly: 7-day free trial
            isTrial = true;
            renewal.setDate(now.getDate() + 7); 
        }

        const newStatus: SubscriptionStatus = {
            isPremium: true,
            plan,
            startDate: now.toISOString(),
            renewalDate: renewal.toISOString(),
            isTrial,
            canceled: false
        };
        saveStatus(newStatus);
        setIsModalOpen(false);
    }, []);

    const cancel = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (status.isTrial) {
            // Logic: If canceled during trial, revert immediately to free.
            const newStatus: SubscriptionStatus = { ...DEFAULT_STATUS };
            saveStatus(newStatus);
        } else {
            // Logic: If paid user cancels, keep premium until end of period.
            const newStatus = { ...status, canceled: true };
            saveStatus(newStatus);
        }
    }, [status]);
    
    const restore = useCallback(async () => {
         await new Promise(resolve => setTimeout(resolve, 500));
         if (status.plan) {
             // Un-cancel
             saveStatus({...status, canceled: false});
         }
    }, [status]);

    const openModal = useCallback((initialStep: 'benefits' | 'pricing' = 'benefits') => {
        setModalInitialStep(initialStep);
        setIsModalOpen(true);
    }, []);
    
    const closeModal = useCallback(() => setIsModalOpen(false), []);

    const value = {
        ...status,
        upgrade,
        cancel,
        restore,
        daysLeftInTrial,
        isModalOpen,
        openModal,
        closeModal,
        modalInitialStep
    };

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
    