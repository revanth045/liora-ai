
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useSubscription } from '../src/hooks/useSubscription';
import { PlanInterval } from '../types';
import { Spinner } from './Spinner';
import { Logo } from './Logo';

const FeatureItem = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
    <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-brand-400/10 rounded-full text-brand-400 flex-shrink-0">
            <Icon name={icon} className="w-5 h-5" />
        </div>
        <div>
            <h4 className="font-bold text-stone-800 text-sm">{title}</h4>
            <p className="text-xs text-stone-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const PricingCard = ({ 
    plan, 
    price, 
    period, 
    label, 
    savings, 
    selected, 
    onSelect 
}: { 
    plan: PlanInterval, 
    price: string, 
    period: string, 
    label?: string, 
    savings?: string, 
    selected: boolean, 
    onSelect: () => void 
}) => (
    <div 
        onClick={onSelect}
        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selected 
            ? 'border-brand-400 bg-brand-400/10 shadow-md' 
            : 'border-cream-200 bg-white hover:border-cream-200'
        }`}
    >
        {label && (
            <div className="absolute -top-2.5 right-4 bg-brand-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                {label}
            </div>
        )}
        <div className="flex justify-between items-center">
            <div>
                <p className="font-bold text-stone-800 text-lg">{price} <span className="text-sm font-normal text-stone-400">{period}</span></p>
                {savings && <p className="text-xs text-brand-400 font-bold mt-0.5">{savings}</p>}
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-brand-400' : 'border-cream-200'}`}>
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-brand-400" />}
            </div>
        </div>
    </div>
);

const BlurredPreview = () => (
    <div className="relative mx-4 -mt-12 mb-8 bg-white rounded-xl shadow-lg border border-cream-200 overflow-hidden transform transition-transform z-10">
        <div className="p-4 filter blur-[2px] opacity-60 pointer-events-none select-none">
            <div className="h-32 bg-cream-200/60 rounded-lg mb-3 w-full"></div>
            <div className="h-6 bg-cream-200/60 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-cream-200/60 rounded w-1/2 mb-4"></div>
            <div className="flex gap-2">
                <div className="h-8 bg-cream-200/60 rounded w-20"></div>
                <div className="h-8 bg-cream-200/60 rounded w-20"></div>
            </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px]">
            <div className="bg-cream-100 p-2 rounded-full shadow-md mb-2">
                 <Icon name="lock" className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider bg-cream-100/80 px-2 py-1 rounded-md">Available in Premium</span>
        </div>
    </div>
);

export const PremiumModal: React.FC = () => {
    const { isModalOpen, closeModal, upgrade, modalInitialStep } = useSubscription();
    const [selectedPlan, setSelectedPlan] = useState<PlanInterval>('year');
    const [isProcessing, setIsProcessing] = useState(false);
    const pricingRef = useRef<HTMLDivElement>(null);

    // Scroll to pricing if deep-linked
    useEffect(() => {
        if (isModalOpen && modalInitialStep === 'pricing' && pricingRef.current) {
            setTimeout(() => {
                pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }, [isModalOpen, modalInitialStep]);

    if (!isModalOpen) return null;

    const handleSubscribe = async () => {
        setIsProcessing(true);
        await upgrade(selectedPlan);
        setIsProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full md:max-w-md h-full md:h-auto md:max-h-[90vh] bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Close Button */}
                <button 
                    onClick={closeModal} 
                    className="absolute top-4 right-4 z-30 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors"
                >
                    <Icon name="x" className="w-5 h-5" />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 custom-scrollbar">
                    
                    {/* Hero Header */}
                    <div className="bg-gradient-to-br from-brand-400 via-brand-400 to-brand-500 pt-12 pb-20 px-6 text-center relative">
                        <div className="relative z-10">
                            <div className="inline-block mb-2 opacity-90 brightness-0 invert">
                                <Logo className="h-12" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-lora font-bold text-white mb-2 drop-shadow-md">Unlock Liora Premium</h2>
                            <p className="text-yellow-50 text-sm font-medium opacity-90">Your perfect dining life starts here.</p>
                        </div>
                    </div>

                    {/* Floating Preview */}
                    <BlurredPreview />

                    {/* Value Proposition */}
                    <div className="px-6 mb-6">
                        <h3 className="text-center font-lora text-xl font-bold text-stone-800 mb-2">Why Premium?</h3>
                        <p className="text-center text-sm text-stone-400 mb-6">Everything you need to eat better and stress less.</p>
                        
                        <FeatureItem 
                            icon="clipboard-list" 
                            title="AI Meal Plans" 
                            desc="Weekly curated plans based on your taste & goals." 
                        />
                        <FeatureItem 
                            icon="heart" 
                            title="Date Night Concierge" 
                            desc="Full date plans with restaurants, events, and timeline." 
                        />
                        <FeatureItem 
                            icon="sparkles" 
                            title="Restaurant Secrets" 
                            desc="Unlock hidden gems and off-menu recommendations." 
                        />
                        <FeatureItem 
                            icon="menu" 
                            title="Smart Pantry + Recipes" 
                            desc="Generate recipes from what you already have." 
                        />
                         <FeatureItem 
                            icon="star" 
                            title="Chef Mode" 
                            desc="Pro-level culinary guidance and techniques." 
                        />
                    </div>

                    {/* Pricing Section */}
                    <div className="px-6 pb-8 bg-cream-100/50 pt-6 border-t border-dashed border-cream-200" ref={pricingRef}>
                        <h3 className="text-center font-lora text-lg font-bold text-stone-800 mb-4">Choose Your Plan</h3>
                        
                        <div className="space-y-3">
                            <PricingCard 
                                plan="year"
                                price="$59.99"
                                period="/ year"
                                label="Most Popular"
                                savings="Save 35%"
                                selected={selectedPlan === 'year'}
                                onSelect={() => setSelectedPlan('year')}
                            />
                            <PricingCard 
                                plan="month"
                                price="$7.99"
                                period="/ month"
                                selected={selectedPlan === 'month'}
                                onSelect={() => setSelectedPlan('month')}
                            />
                            <PricingCard 
                                plan="lifetime"
                                price="$99"
                                period="one-time"
                                label="Best Value"
                                savings="Pay once, own forever"
                                selected={selectedPlan === 'lifetime'}
                                onSelect={() => setSelectedPlan('lifetime')}
                            />
                        </div>

                         {selectedPlan !== 'lifetime' && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-700 bg-green-50 py-2 rounded-lg border border-green-100">
                                <Icon name="sparkles" className="w-3.5 h-3.5" />
                                <strong>7-Day Free Trial</strong> included. Cancel anytime.
                            </div>
                        )}
                    </div>
                    
                    {/* Terms */}
                     <div className="px-6 pb-8 text-[10px] text-stone-400 text-center leading-tight">
                        <p>Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period. You can manage your subscription in Account Settings.</p>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-4 bg-white border-t border-cream-200 flex-shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button 
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                        className="w-full bg-brand-400 text-white text-lg font-bold py-3.5 rounded-xl hover:bg-opacity-90 transition-all shadow-lg flex justify-center items-center gap-2 transform active:scale-[0.98]"
                    >
                        {isProcessing ? <Spinner /> : (selectedPlan === 'lifetime' ? 'Get Lifetime Access' : 'Start Free Trial')}
                    </button>
                    <p className="text-center text-[11px] text-stone-400 mt-2 font-medium">
                        {selectedPlan === 'lifetime' ? 'Unlock everything instantly. No recurring fees.' : 'Unlock everything instantly. No commitment.'}
                    </p>
                    <div className="flex justify-center gap-4 mt-3 text-[10px] text-stone-400">
                        <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-stone-400 transition-colors">Terms & Conditions</a>
                        <span className="text-stone-400">|</span>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-stone-400 transition-colors">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
