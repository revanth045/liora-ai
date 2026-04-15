import { useState, useEffect, useCallback } from 'react';
import { ReminderSettings } from '../types';

const LOCAL_STORAGE_KEY = 'liora-reminders';

const defaultSettings: ReminderSettings = {
    mealLogging: {
        enabled: false,
        breakfast: '09:00',
        lunch: '13:00',
        dinner: '19:00',
    },
    drinkWater: {
        enabled: false,
        interval: 60,
        startTime: '09:00',
        endTime: '21:00',
    },
};

export const useReminders = () => {
    const [settings, setSettings] = useState<ReminderSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                // Merge with defaults to handle any new properties added to the type
                const parsed = JSON.parse(stored);
                setSettings({
                    mealLogging: { ...defaultSettings.mealLogging, ...parsed.mealLogging },
                    drinkWater: { ...defaultSettings.drinkWater, ...parsed.drinkWater },
                });
            }
        } catch (e) {
            console.error("Failed to parse reminders from localStorage", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveSettings = useCallback((newSettings: ReminderSettings) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (e) {
            console.error("Failed to save reminders to localStorage", e);
        }
    }, []);

    return { settings, saveSettings, isLoading };
};
