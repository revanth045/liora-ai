
import { useState, useEffect, useCallback } from 'react';
import { StoredUserProfile } from '../../types';

import { userScopedKey, onSessionChange } from '../lib/perUserStorage';
const BASE_KEY = 'liora-user-profile';
const LOCAL_STORAGE_KEY_FN = () => userScopedKey(BASE_KEY);

/** Coerce any value to a plain string, never throws */
const toStr = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(x => (typeof x === 'string' || typeof x === 'number') ? String(x) : '').filter(Boolean).join(', ');
    if (typeof v === 'object') {
        try {
            const vals = Object.values(v as Record<string, unknown>)
                .filter(x => typeof x === 'string' || typeof x === 'number');
            return vals.map(String).join(', ');
        } catch { return ''; }
    }
    try { return String(v); } catch { return ''; }
};

/** Coerce any value to a string array, never throws */
const toStrArr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(x => (typeof x === 'string' || typeof x === 'number') ? String(x) : null).filter(Boolean) as string[];
    if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
};

/** Coerce any value to a number, never throws */
const toNum = (v: unknown, fallback: number): number => {
    if (typeof v === 'number' && !isNaN(v)) return v;
    if (typeof v === 'string') { const n = parseFloat(v); if (!isNaN(n)) return n; }
    if (v != null && typeof v === 'object') {
        const inner = Object.values(v as Record<string, unknown>).find(x => typeof x === 'number');
        if (inner !== undefined) return inner as number;
    }
    return fallback;
};

/**
 * Sanitize a raw profile object from localStorage — ensures every field is the
 * correct primitive type regardless of what the AI or old code stored.
 */
const sanitizeProfile = (raw: unknown): StoredUserProfile | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const p = (r.profile && typeof r.profile === 'object') ? r.profile as Record<string, unknown> : {};
    return {
        summary: toStr(r.summary) || 'Your dining profile is ready.',
        profile: {
            name: toStr(p.name),
            city: toStr(p.city),
            budget: toStr(p.budget) || '$$',
            cuisines: toStrArr(p.cuisines),
            spice: toNum(p.spice, 3),
            allergens: toStrArr(p.allergens),
            diet: toStr(p.diet) || 'No specific diet',
            avoid: toStrArr(p.avoid).length ? toStrArr(p.avoid) : [],
            vibe: toStr(p.vibe) || 'Cozy and casual',
        },
        aiPreferences: (r.aiPreferences && typeof r.aiPreferences === 'object')
            ? r.aiPreferences as StoredUserProfile['aiPreferences']
            : undefined,
    };
};

export const useUserProfile = () => {
    const [profile, setProfile] = useState<StoredUserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const reload = useCallback(() => {
        try {
            const storedProfile = localStorage.getItem(LOCAL_STORAGE_KEY_FN());
            if (storedProfile) {
                const raw = JSON.parse(storedProfile);
                setProfile(sanitizeProfile(raw));
            } else {
                setProfile(null);
            }
        } catch (e) {
            console.error("Failed to parse user profile from localStorage", e);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
        return onSessionChange(reload);
    }, [reload]);

    const saveProfile = useCallback((newProfile: StoredUserProfile) => {
        try {
            const clean = sanitizeProfile(newProfile) ?? newProfile;
            localStorage.setItem(LOCAL_STORAGE_KEY_FN(), JSON.stringify(clean));
            setProfile(clean as StoredUserProfile);
        } catch (e) {
            console.error("Failed to save user profile to localStorage", e);
        }
    }, []);

    const clearProfile = useCallback(() => {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY_FN());
            setProfile(null);
        } catch (e) {
            console.error("Failed to clear user profile from localStorage", e);
        }
    }, []);

    // FIX: Use NonNullable to ensure we are taking a Partial of the defined object, not undefined.
    const updateAiPreferences = useCallback((prefs: Partial<NonNullable<StoredUserProfile['aiPreferences']>>) => {
        setProfile(currentProfile => {
            if (!currentProfile) return null;
            // Create a new profile object with updated preferences
            const newProfile: StoredUserProfile = { 
                ...currentProfile, 
                aiPreferences: {
                    ...(currentProfile.aiPreferences || { tone: 'friendly', style: 'classic' }),
                    ...prefs
                } 
            };
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY_FN(), JSON.stringify(newProfile));
            } catch (e) {
                console.error("Failed to save AI preferences to localStorage", e);
            }
            return newProfile;
        });
    }, []);

    return { profile, saveProfile, clearProfile, isLoading, updateAiPreferences };
};
