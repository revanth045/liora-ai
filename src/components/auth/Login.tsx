import React, { useState } from 'react';
import { getAuth } from '../../auth';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import { View } from '../../../types';
import AccountSwitcher from './AccountSwitcher';

interface LoginProps {
    setView: (view: View) => void;
}

export default function Login({ setView }: LoginProps) {
    const auth = getAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [role, setRole] = useState<'user' | 'restaurant'>('user');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'register') {
                if (role === 'user') {
                    await auth.signUpUser(email, password, fullName);
                    await auth.signInUser(email, password);
                } else {
                    await auth.signUpRestaurantOwner(email, password, fullName, restaurantName);
                    await auth.signInUser(email, password);
                }
            } else {
                await auth.signInUser(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm";
    const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5";

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-brand-400 flex items-center justify-center shadow-sm">
                        <span className="font-display font-bold text-white text-xl">L</span>
                    </div>
                    <span className="font-display text-2xl font-semibold text-stone-800 tracking-wide">Liora</span>
                </div>
                <h1 className="font-display text-3xl font-light text-stone-900 leading-snug">
                    {mode === 'login' ? <>Welcome <span className="italic">back</span></> : <>Create <span className="italic">account</span></>}
                </h1>
                <p className="text-stone-500 text-sm mt-2">
                    {mode === 'login' ? 'Sign in to continue your journey' : 'Start your dining journey with Liora'}
                </p>
            </div>

            {/* Role Toggle */}
            <div className="flex gap-0 mb-6 p-1 rounded-xl border border-cream-200 bg-cream-100">
                <button
                    onClick={() => setRole('user')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        role === 'user'
                            ? 'bg-white text-stone-800 shadow-sm border border-cream-200'
                            : 'text-stone-500 hover:text-stone-700'
                    }`}
                >
                    <Icon name="user-circle" className="w-4 h-4 inline mr-1.5" />
                    Diner
                </button>
                <button
                    onClick={() => setRole('restaurant')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        role === 'restaurant'
                            ? 'bg-white text-stone-800 shadow-sm border border-cream-200'
                            : 'text-stone-500 hover:text-stone-700'
                    }`}
                >
                    <Icon name="briefcase" className="w-4 h-4 inline mr-1.5" />
                    Restaurant
                </button>
            </div>

            {/* Form */}
            <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                        <Icon name="x" className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label className={labelClass}>Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className={inputClass}
                                placeholder="Your name"
                                required
                            />
                        </div>
                    )}

                    {mode === 'register' && role === 'restaurant' && (
                        <div>
                            <label className={labelClass}>Restaurant Name</label>
                            <input
                                type="text"
                                value={restaurantName}
                                onChange={e => setRestaurantName(e.target.value)}
                                className={inputClass}
                                placeholder="e.g. La Dolce Vita"
                            />
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className={inputClass}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={inputClass}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-gold w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
                    >
                        {loading ? <Spinner /> : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                        className="text-sm text-stone-500 hover:text-brand-400 transition-colors"
                    >
                        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>

                <AccountSwitcher />
            </div>
        </div>
    );
}