import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { View } from '../../../types';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { PremiumModal } from '../../../components/PremiumModal';
import { Spinner } from '../../../components/Spinner';
import { ConversationProvider } from '../../../store/conversation';
import { DiningProvider } from '../../context/DiningContext';
import { useFavorites } from '../../hooks/useFavorites';
import { useSubscription } from '../../hooks/useSubscription';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useSession } from '../../auth/useSession';
import { Icon } from '../../../components/Icon';

// Lazy load pages
const HomePage         = lazy(() => import('./pages/Home'));
const NearbyPage       = lazy(() => import('./pages/Nearby'));
const DateNightPage    = lazy(() => import('./pages/DateNight'));
const PlannerPage      = lazy(() => import('./pages/Planner'));
const WellnessHub      = lazy(() => import('./pages/WellnessHub').then(m => ({ default: m.WellnessHub })));
const HotelsPage       = lazy(() => import('./pages/Hotels'));
const CheckoutPage     = lazy(() => import('./pages/Checkout'));
const AiWaiterPage     = lazy(() => import('./pages/AiWaiterPage'));
const ChefModePage     = lazy(() => import('./pages/ChefModePage'));
const AiChatPage       = lazy(() => import('./pages/AiChatPage'));
const UserProfile      = lazy(() => import('./pages/UserProfile'));
const AccountPage      = lazy(() => import('./pages/Account'));
const FavoritesPage    = lazy(() => import('./pages/Favorites'));
const SupportPage      = lazy(() => import('./pages/Support'));
const CalorieLogPage   = lazy(() => import('./pages/CalorieLogPage'));
const OnboardingPage   = lazy(() => import('./pages/Onboarding'));
const DatingHub        = lazy(() => import('./pages/DatingHub'));
const OffersPage       = lazy(() => import('./pages/Offers'));
const OrdersPage       = lazy(() => import('./pages/Orders'));
const RestaurantsPage  = lazy(() => import('./pages/RestaurantsPage'));
const LandingPage      = lazy(() => import('../../public/Landing'));

const PageSpinner = () => (
    <div className="flex items-center justify-center h-full py-20"><Spinner /></div>
);

function PaddedPage({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-page-slide">{children}</div>
      </div>
    );
}

function FullPage({ children }: { children: React.ReactNode }) {
    return <div className="flex-1 overflow-y-auto custom-scrollbar animate-fade-in">{children}</div>;
}

const BOTTOM_NAV = [
    { icon: 'home',         label: 'Home',     view: 'home'         as View },
    { icon: 'map-pin',      label: 'Dine',     view: 'restaurants'  as View },
    { icon: 'sparkles',     label: 'AI',       view: 'ai_chat'      as View },
    { icon: 'receipt_long', label: 'Orders',   view: 'orders'       as View },
    { icon: 'user-circle',  label: 'Account',  view: 'account'      as View },
];

export default function UserShell() {
    const [view, setView_internal] = useState<View>('home');
    const viewRef = useRef<View>('home');
    const [viewHistory, setViewHistory] = useState<View[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const setView = useCallback((next: View) => {
        if (next === viewRef.current) return;
        setViewHistory(h => [...h, viewRef.current]);
        viewRef.current = next;
        setView_internal(next);
    }, []);

    const goBack = useCallback(() => {
        setViewHistory(h => {
            if (h.length === 0) return h;
            const target = h[h.length - 1];
            viewRef.current = target;
            setView_internal(target);
            return h.slice(0, -1);
        });
    }, []);

    const resetToHome = useCallback(() => {
        setViewHistory([]);
        viewRef.current = 'home';
        setView_internal('home');
    }, []);

    const canGoBack = viewHistory.length > 0;
    const { favorites, addFavorite, removeFavorite } = useFavorites();
    const { isPremium, isTrial, daysLeftInTrial, openModal } = useSubscription();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const session = useSession();

    const [showOnboarding, setShowOnboarding] = useState(false);
    useEffect(() => {
        if (!profileLoading && session) {
            const needs = localStorage.getItem('liora-needs-onboarding') === 'true';
            if (!profile || needs) setShowOnboarding(true);
        }
    }, [profileLoading, profile, session]);

    const handleProfileCreated = () => {
        localStorage.removeItem('liora-needs-onboarding');
        setShowOnboarding(false);
        setView('home');
    };

    const fullPageViews: View[] = ['onboarding', 'checkout'];
    const isFullPage = fullPageViews.includes(view) || showOnboarding;

    if (view === 'landing' && !showOnboarding) {
        return (
            <ConversationProvider>
                <DiningProvider>
                    <div className="relative min-h-dscreen bg-app pt-safe">
                        <button
                            onClick={() => setView('home')}
                            className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-900/90 backdrop-blur-md text-cream-50 text-xs font-bold uppercase tracking-widest shadow-2xl hover:bg-stone-800 transition-all border border-white/10"
                        >
                            <Icon name="chevron-left" className="w-4 h-4" />
                            Back to dashboard
                        </button>
                        <Suspense fallback={<PageSpinner />}>
                            <LandingPage
                                onGoToLogin={() => setView('home')}
                                onGoToRestaurants={() => setView('restaurants')}
                                onGoToHotels={() => setView('hotels')}
                                onGetStarted={() => setView('home')}
                                onGoToProviderChooser={() => setView('home')}
                            />
                        </Suspense>
                    </div>
                    <PremiumModal />
                </DiningProvider>
            </ConversationProvider>
        );
    }

    if (isFullPage || showOnboarding) {
        return (
            <ConversationProvider>
                <DiningProvider>
                    <div className="min-h-dscreen bg-app text-stone-800 overflow-y-auto pt-safe">
                        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
                            <Suspense fallback={<PageSpinner />}>
                                {showOnboarding ? (
                                    <OnboardingPage onProfileCreated={handleProfileCreated} />
                                ) : view === 'checkout' ? (
                                    <CheckoutPage onNavigate={setView} />
                                ) : null}
                            </Suspense>
                        </div>
                    </div>
                    <PremiumModal />
                </DiningProvider>
            </ConversationProvider>
        );
    }

    const renderPage = () => {
        switch (view) {
            case 'home':         return <FullPage><HomePage favorites={favorites} addFavorite={addFavorite} removeFavorite={removeFavorite} setView={setView} /></FullPage>;
            case 'nearby':       return <PaddedPage><NearbyPage favorites={favorites} addFavorite={addFavorite} removeFavorite={removeFavorite} setView={setView} /></PaddedPage>;
            case 'date_night':   return <PaddedPage><DateNightPage /></PaddedPage>;
            case 'dating':       return <PaddedPage><DatingHub setView={setView} /></PaddedPage>;
            case 'planner':      return <PaddedPage><PlannerPage /></PaddedPage>;
            case 'fitness':      return <PaddedPage><WellnessHub /></PaddedPage>;
            case 'hotels':       return <PaddedPage><HotelsPage onNavigate={setView} /></PaddedPage>;
            case 'ai_waiter':    return <FullPage><AiWaiterPage /></FullPage>;
            case 'chef_mode':
            case 'chef':         return <FullPage><ChefModePage /></FullPage>;
            case 'ai_chat':      return <FullPage><AiChatPage /></FullPage>;
            case 'profile':      return <PaddedPage><UserProfile setView={setView} /></PaddedPage>;
            case 'account':
            case 'login':        return <PaddedPage><AccountPage setView={setView} /></PaddedPage>;
            case 'favorites':    return <PaddedPage><FavoritesPage favorites={favorites} removeFavorite={removeFavorite} /></PaddedPage>;
            case 'support':      return <PaddedPage><SupportPage /></PaddedPage>;
            case 'calorie_log':  return <PaddedPage><CalorieLogPage /></PaddedPage>;
            case 'offers':       return <PaddedPage><OffersPage /></PaddedPage>;
            case 'orders':       return <PaddedPage><OrdersPage /></PaddedPage>;
            case 'restaurants':  return <PaddedPage><RestaurantsPage setView={setView} /></PaddedPage>;
            default:             return <FullPage><HomePage favorites={favorites} addFavorite={addFavorite} removeFavorite={removeFavorite} setView={setView} /></FullPage>;
        }
    };

    return (
        <ConversationProvider>
            <DiningProvider>
                <div className="flex h-dscreen bg-app text-stone-800 overflow-hidden px-safe pt-safe">
                    <Sidebar
                        view={view}
                        setView={setView}
                        onDemoClick={() => setView('home')}
                        isSidebarOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />

                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-30 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    <main className="flex-1 flex flex-col min-w-0 relative bg-app">
                        <Header
                            setView={setView}
                            onMenuClick={() => setIsSidebarOpen(true)}
                            canGoBack={canGoBack}
                            onBack={goBack}
                            onHomeClick={resetToHome}
                        />

                        {isPremium && isTrial && daysLeftInTrial !== null && daysLeftInTrial <= 3 && (
                            <div className="mx-4 mt-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500/12 to-brand-500/5 border border-brand-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon name="sparkles" className="w-4 h-4 text-brand-500" />
                                    <span className="text-xs text-stone-700">
                                        <strong className="text-brand-600">{daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''}</strong> left in trial
                                    </span>
                                </div>
                                <button onClick={() => openModal('pricing')} className="text-xs font-bold text-brand-600 hover:text-brand-700">Upgrade →</button>
                            </div>
                        )}

                        <Suspense fallback={<PageSpinner />}>{renderPage()}</Suspense>

                        {/* Mobile bottom nav */}
                        <nav className="md:hidden flex-shrink-0 bg-app-elev/95 backdrop-blur-xl border-t border-cream-200 safe-area-bottom">
                            <div className="grid grid-cols-5 items-center py-1 px-1.5">
                                {BOTTOM_NAV.map(item => {
                                    const isActive = view === item.view || (item.view === 'home' && view === 'dating' && false);
                                    return (
                                        <button
                                            key={item.view}
                                            onClick={() => setView(item.view)}
                                            className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl transition-colors w-full ${
                                                isActive ? 'text-brand-600' : 'text-stone-800'
                                            }`}
                                        >
                                            <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                                                <Icon name={item.icon} className="w-4.5 h-4.5" />
                                                {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-600" />}
                                            </div>
                                            <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>
                    </main>
                </div>
                <PremiumModal />
            </DiningProvider>
        </ConversationProvider>
    );
}
