
import { useState, useEffect, useCallback } from 'react';
import { StoredUserProfile } from '../types';
import { sbUpsertCustomerProfile, sbGetCustomerProfile } from '../src/lib/supabaseDb';
import { userScopedKey, onSessionChange } from '../src/lib/perUserStorage';

const BASE_KEY = 'liora-user-profile';
const LOCAL_STORAGE_KEY_FN = () => userScopedKey(BASE_KEY);

const toStr = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(x => (typeof x === 'string' || typeof x === 'number') ? String(x) : '').filter(Boolean).join(', ');
    if (typeof v === 'object') {
        try {
            const vals = Object.values(v as Record<string, unknown>).filter(x => typeof x === 'string' || typeof x === 'number');
            return vals.map(String).join(', ');
        } catch { return ''; }
    }
    try { return String(v); } catch { return ''; }
};

const toStrArr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(x => (typeof x === 'string' || typeof x === 'number') ? String(x) : null).filter(Boolean) as string[];
    if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
};

const toNum = (v: unknown, fallback: number): number => {
    if (typeof v === 'number' && !isNaN(v)) return v;
    if (typeof v === 'string') { const n = parseFloat(v); if (!isNaN(n)) return n; }
    if (v != null && typeof v === 'object') {
        const inner = Object.values(v as Record<string, unknown>).find(x => typeof x === 'number');
        if (inner !== undefined) return inner as number;
    }
    return fallback;
};

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

    const loadProfileRef = (typeof window !== "undefined") ? null : null;
    useEffect(() => {
        let cancelled = false;
        const loadProfile = async () => {
            try {
                const stored = localStorage.getItem(LOCAL_STORAGE_KEY_FN());
                const raw = stored ? JSON.parse(stored) : null;
                const local = sanitizeProfile(raw);
                if (local) {
                    setProfile(local);
                    setIsLoading(false);
                    // Try to also pull from Supabase for freshness
                    const email = (local.profile as any)?.email ||
                        ((() => { try { const s = localStorage.getItem('liora_demo_session'); return s ? JSON.parse(s).email : null; } catch { return null; } })());
                    if (email) {
                        sbGetCustomerProfile(email).then(sbProfile => {
                            if (sbProfile && sbProfile.updated_at && sbProfile.updated_at > (raw?.updatedAt ?? 0)) {
                                const merged: StoredUserProfile = {
                                    summary: sbProfile.summary ?? local.summary,
                                    profile: {
                                        name: sbProfile.name ?? local.profile.name,
                                        city: sbProfile.city ?? local.profile.city,
                                        budget: sbProfile.budget ?? local.profile.budget,
                                        cuisines: sbProfile.cuisines ?? local.profile.cuisines,
                                        spice: sbProfile.spice_level ?? local.profile.spice,
                                        allergens: sbProfile.allergens ?? local.profile.allergens,
                                        diet: sbProfile.diet ?? local.profile.diet,
                                        avoid: sbProfile.avoid ?? local.profile.avoid,
                                        vibe: sbProfile.vibe ?? local.profile.vibe,
                                    },
                                    aiPreferences: {
                                        tone: (sbProfile.ai_tone as any) ?? local.aiPreferences?.tone ?? 'friendly',
                                        style: (sbProfile.ai_style as any) ?? local.aiPreferences?.style ?? 'classic',
                                    },
                                };
                                setProfile(merged);
                                localStorage.setItem(LOCAL_STORAGE_KEY_FN(), JSON.stringify(merged));
                            }
                        }).catch(() => {});
                    }
                    return;
                }
                // No local profile: try Supabase
                const email = (() => { try { const s = localStorage.getItem('liora_demo_session'); return s ? JSON.parse(s).email : null; } catch { return null; } })();
                if (email) {
                    const sbProfile = await sbGetCustomerProfile(email).catch(() => null);
                    if (sbProfile) {
                        const fromSb: StoredUserProfile = {
                            summary: sbProfile.summary ?? 'Your dining profile is ready.',
                            profile: {
                                name: sbProfile.name ?? '', city: sbProfile.city ?? '',
                                budget: sbProfile.budget ?? '$$',
                                cuisines: sbProfile.cuisines ?? [],
                                spice: sbProfile.spice_level ?? 3,
                                allergens: sbProfile.allergens ?? [],
                                diet: sbProfile.diet ?? 'No specific diet',
                                avoid: sbProfile.avoid ?? [], vibe: sbProfile.vibe ?? 'Cozy and casual',
                            },
                            aiPreferences: { tone: (sbProfile.ai_tone as any) ?? 'friendly', style: (sbProfile.ai_style as any) ?? 'classic' },
                        };
                        setProfile(fromSb);
                        localStorage.setItem(LOCAL_STORAGE_KEY_FN(), JSON.stringify(fromSb));
                    }
                }
            } catch (e) {
                console.error('Failed to load user profile', e);
                localStorage.removeItem(LOCAL_STORAGE_KEY_FN());
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
        const off = onSessionChange(() => { if(!cancelled) loadProfile(); });
        return () => { cancelled = true; off(); };
    }, []);

    const saveProfile = useCallback((newProfile: StoredUserProfile) => {
        try {
            const clean = sanitizeProfile(newProfile) ?? newProfile;
            localStorage.setItem(LOCAL_STORAGE_KEY_FN(), JSON.stringify(clean));
            setProfile(clean as StoredUserProfile);
            // Sync to Supabase
            const email = (() => { try { const s = localStorage.getItem('liora_demo_session'); return s ? JSON.parse(s).email : null; } catch { return null; } })();
            const userId = (() => { try { const s = localStorage.getItem('liora_demo_session'); return s ? JSON.parse(s).id : null; } catch { return null; } })();
            if (email && userId) {
                sbUpsertCustomerProfile({
                    id: userId as any, email,
                    name: clean.profile?.name,
                    city: clean.profile?.city as any,
                    budget: clean.profile?.budget,
                    cuisines: clean.profile?.cuisines,
                    spice_level: clean.profile?.spice as any,
                    allergens: clean.profile?.allergens,
                    diet: clean.profile?.diet,
                    avoid: clean.profile?.avoid,
                    vibe: clean.profile?.vibe,
                    ai_tone: clean.aiPreferences?.tone,
                    ai_style: clean.aiPreferences?.style,
                    summary: clean.summary,
                    updated_at: Date.now(),
                }).catch(() => {});
            }
        } catch (e) {
            console.error('Failed to save user profile', e);
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

    const updateAiPreferences = useCallback((prefs: Partial<NonNullable<StoredUserProfile['aiPreferences']>>) => {
        setProfile(currentProfile => {
            if (!currentProfile) return null;
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
