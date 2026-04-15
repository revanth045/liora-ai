import React from 'react';
import { Icon } from '../../components/Icon';

interface ForRestaurantsProps {
    onGoToLogin: () => void;
    onBackToHome: () => void;
}

export default function ForRestaurants({ onGoToLogin, onBackToHome }: ForRestaurantsProps) {
    const benefits = [
        { icon: 'sparkles', title: 'Attract New Customers', description: 'Get featured in AI-powered recommendations and boost your visibility in local search.', color: 'from-brand-400/20 to-brand-400/5 text-brand-400' },
        { icon: 'menu', title: 'Optimize Your Menu', description: 'Use AI to write compelling descriptions, analyze item performance, and price effectively.', color: 'from-blue-400/20 to-blue-400/5 text-blue-400' },
        { icon: 'chat', title: 'Engage Your Diners', description: 'Respond to feedback, manage reservations, and build customer loyalty all in one place.', color: 'from-purple-400/20 to-purple-400/5 text-purple-400' },
        { icon: 'briefcase', title: 'Streamline Operations', description: 'From inventory tracking to staff scheduling, let AI handle the heavy lifting.', color: 'from-emerald-400/20 to-emerald-400/5 text-emerald-400' },
    ];

    return (
        <div className="min-h-screen bg-cream-50 text-stone-800 relative overflow-hidden">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-brand-400/5 rounded-full blur-[150px]" />
                <div className="dot-grid absolute inset-0 opacity-20" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-300 flex items-center justify-center">
                        <span className="font-display font-bold text-stone-900 text-lg">L</span>
                    </div>
                    <div>
                        <span className="font-display text-xl font-bold">Liora</span>
                        <span className="text-xs text-stone-400 ml-2 font-medium">for Restaurants</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onBackToHome} className="text-stone-400 font-medium hover:text-stone-800 transition-colors text-sm">Back Home</button>
                    <button onClick={onGoToLogin} className="bg-brand-400 text-stone-900 font-bold py-2.5 px-5 rounded-full hover:bg-brand-300 transition-all text-sm shadow-lg shadow-brand-400/20">Get Started</button>
                </div>
            </header>

            {/* Hero */}
            <section className="relative z-10 text-center py-20 px-6 max-w-4xl mx-auto">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 border border-cream-200 rounded-full mb-8">
                    <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Restaurant Operating System</span>
                </span>
                <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    The AI Operating System<br/>
                    <span className="text-gradient">for Your Restaurant.</span>
                </h1>
                <p className="text-lg text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Stop juggling spreadsheets and apps. Liora brings your menu, marketing, and management into one intelligent platform.
                </p>
                <button onClick={onGoToLogin} className="bg-brand-400 text-stone-900 font-bold py-4 px-8 rounded-2xl text-lg shadow-xl shadow-brand-400/20 hover:bg-brand-300 transition-all active:scale-[0.97] glow-brand">
                    Start Your Free Trial
                </button>
            </section>

            {/* Benefits */}
            <section className="relative z-10 py-20 border-t border-cream-100">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="font-display text-4xl font-bold mb-12 text-center">Run a Smarter Business</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {benefits.map(b => (
                            <div key={b.title} className="bg-cream-50 border border-cream-200 rounded-2xl p-6 hover:bg-white/[0.06] transition-all group">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon name={b.icon} className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{b.title}</h3>
                                <p className="text-stone-400 leading-relaxed">{b.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="relative z-10 py-20 px-6 border-t border-cream-100">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="bg-cream-50 border border-cream-200 rounded-3xl p-10">
                        <Icon name="chat_bubble" className="w-8 h-8 text-brand-400/50 mx-auto mb-4" />
                        <p className="font-display text-2xl md:text-3xl italic text-stone-700 leading-relaxed mb-6">
                            "Liora's marketing studio saved us 10 hours a week on social media. The AI-generated copy is better than what we were writing ourselves."
                        </p>
                        <p className="font-semibold text-brand-400">â€” Maria, Owner of The Corner Bistro</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 py-20 border-t border-cream-100">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="font-display text-4xl font-bold mb-4">Ready to Grow?</h2>
                    <p className="text-lg text-stone-400 mb-8 max-w-xl mx-auto">Join restaurants using Liora to increase efficiency and delight customers. Your first 14 days are free.</p>
                    <button onClick={onGoToLogin} className="bg-brand-400 text-stone-900 font-bold py-4 px-8 rounded-2xl text-lg shadow-xl shadow-brand-400/20 hover:bg-brand-300 transition-all active:scale-[0.97] glow-brand">
                        Claim Your Free Trial
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-cream-100 py-8">
                <div className="max-w-7xl mx-auto px-6 text-center text-stone-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} Liora for Restaurants. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
