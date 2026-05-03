import React, { useEffect, useState, useCallback } from 'react';
import { getAuth } from '../../auth';
import { SavedAccount, listSavedAccounts, forgetSavedAccount } from '../../auth/demoAuth';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';

export default function AccountSwitcher() {
    const auth = getAuth();
    const [accounts, setAccounts] = useState<SavedAccount[]>([]);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const refreshAccounts = useCallback(() => {
        setAccounts(listSavedAccounts());
    }, []);

    useEffect(() => {
        refreshAccounts();
        const unsubscribe = auth.onAuthStateChange(() => {
            refreshAccounts();
        });
        return unsubscribe;
    }, [auth, refreshAccounts]);

    const handleSelect = async (email: string) => {
        if (!auth.signInFromSwitcher) return;
        setIsLoading(email);
        try {
            await auth.signInFromSwitcher(email);
        } catch (e: any) {
            console.error("Failed to switch account:", e.message);
        } finally {
            setIsLoading(null);
        }
    };

    const handleForget = (email: string) => {
        forgetSavedAccount(email);
        refreshAccounts();
    };

    if (accounts.length === 0) return null;

    return (
        <div className="mt-6 pt-4 border-t border-cream-200">
            <h3 className="text-xs font-semibold text-center text-stone-600 mb-3 uppercase tracking-wider">Quick access</h3>
            <div className="space-y-1">
                {accounts.map(acc => (
                    <div key={acc.email} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-cream-100 transition-colors">
                        <button onClick={() => handleSelect(acc.email)} disabled={!!isLoading} className="flex-grow flex items-center gap-3 text-left disabled:cursor-wait">
                            <div className="p-2 bg-cream-100 rounded-full border border-cream-200">
                                <Icon name={acc.role === 'user' ? 'user-circle' : 'briefcase'} className="w-5 h-5 text-stone-600" />
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm font-semibold text-stone-700">{acc.name || acc.email}</p>
                                <p className="text-xs text-stone-600">{acc.role === 'user' ? 'User Account' : 'Restaurant Owner'}</p>
                            </div>
                            {isLoading === acc.email && <Spinner />}
                        </button>
                        <button
                            onClick={() => handleForget(acc.email)}
                            className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-cream-200 transition-all"
                            aria-label={`Forget ${acc.email}`}
                            disabled={!!isLoading}
                        >
                            <Icon name="x" className="w-4 h-4 text-stone-600" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}