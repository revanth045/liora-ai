import React from 'react';
import { Icon } from './Icon';
import { View } from '../types';

interface FooterProps {
    setView?: (view: View) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
    const handleNav = (view: View) => {
        if (setView) setView(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-forest-900 text-cream-200 py-16 px-6 mt-auto">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
                {/* Brand */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center">
                            <span className="font-display font-bold text-white text-lg">L</span>
                        </div>
                        <span className="font-display text-xl font-semibold text-white tracking-wide">Liora</span>
                    </div>
                    <p className="text-sm text-cream-100 leading-relaxed">Your personal dining &amp; lifestyle concierge.</p>
                    <div className="flex gap-3 pt-1">
                        {['instagram', 'twitter', 'facebook'].map(s => (
                            <a key={s} href="#" aria-label={s} className="w-8 h-8 rounded-full border border-cream-200/20 flex items-center justify-center hover:border-brand-400 hover:text-brand-400 transition-colors">
                                <Icon name={s} className="w-3.5 h-3.5" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Explore */}
                <div>
                    <h4 className="text-[10px] font-bold text-champagne mb-5 uppercase tracking-widest">Explore</h4>
                    <ul className="space-y-3 text-sm text-cream-100">
                        <li><button onClick={() => handleNav('date_night')} className="hover:text-brand-400 transition-colors">Date Night</button></li>
                        <li><button onClick={() => handleNav('hotels')} className="hover:text-brand-400 transition-colors">Hotels</button></li>
                    </ul>
                </div>

                {/* Community */}
                <div>
                    <h4 className="text-[10px] font-bold text-champagne mb-5 uppercase tracking-widest">Community</h4>
                    <ul className="space-y-3 text-sm text-cream-100">
                        <li><button onClick={() => handleNav('home')} className="hover:text-brand-400 transition-colors">Home</button></li>
                        <li><button onClick={() => handleNav('support')} className="hover:text-brand-400 transition-colors">Support</button></li>
                        <li><a href="#" className="hover:text-brand-400 transition-colors">Partners</a></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 className="text-[10px] font-bold text-champagne mb-5 uppercase tracking-widest">Legal</h4>
                    <ul className="space-y-3 text-sm text-cream-100">
                        <li><a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-brand-400 transition-colors">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-brand-400 transition-colors">Cookies</a></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-cream-200/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-cream-100">&copy; {new Date().getFullYear()} Liora AI. All rights reserved.</p>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-champagne tracking-wider">
                        <Icon name="lock" className="w-3 h-3 text-emerald-400" /> Secure
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-champagne tracking-wider">
                        <Icon name="sparkles" className="w-3 h-3 text-brand-400" /> AI Powered
                    </span>
                </div>
            </div>
        </footer>
    );
};