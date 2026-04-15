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
const HomePage = lazy(() => import('./pages/Home'));
const NearbyPage = lazy(() => import('./pages/Nearby'));
const DateNightPage = lazy(() => import('./pages/DateNight'));
const PlannerPage = lazy(() => import('./pages/Planner'));
const FitnessHub = lazy(() => import('./pages/FitnessHub'));
const HotelsPage = lazy(() => import('./pages/Hotels'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const AiWaiterPage = lazy(() => import('./pages/AiWaiterPage'));
const ChefModePage = lazy(() => import('./pages/ChefModePage'));
const AiChatPage = lazy(() => import('./pages/AiChatPage'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AccountPage = lazy(() => import('./pages/Account'));
const FavoritesPage = lazy(() => import('./pages/Favorites'));
const SupportPage = lazy(() => import('./pages/Support'));
const CalorieLogPage = lazy(() => import('./pages/CalorieLogPage'));
const OnboardingPage = lazy(() => import('./pages/Onboarding'));
const DatingHub = lazy(() => import('./pages/DatingHub'));
const OffersPage = lazy(() => import('./pages/Offers'));
const OrdersPage = lazy(() => import('./pages/Orders'));
const RestaurantsPage = lazy(() => import('./pages/RestaurantsPage'));

const PageSpinner = () => (
    <div className="flex items-center justify-center h-full py-20">
        <Spinner />
    </div>
);

// Simple page wrapper with padding
function SimplePageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            {children}
        </div>
    );
}

// Full-page wrapper (no padding â ” for immersive views)
function FullPageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
        </div>
    );
}

// Mobile bottom nav items
const BOTTOM_NAV = [
    { icon: 'home', label: 'Home', view: 'home' as View },
    { icon: 'map-pin', label: 'Restaurants', view: 'restaurants' as View },
    { icon: 'sparkles', label: 'AI Chat', view: 'ai_chat' as View },
    { icon: 'user-circle', label: 'Account', view: 'account' as View },
];

export default function UserShell() {
    const [view, setView_internal] = useState<View>('home');
    const viewRef = useRef<View>('home'); // always current, avoids stale-closure
    const [viewHistory, setViewHistory] = useState<View[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const setView = useCallback((next: View) => {
        if (next === viewRef.current) return; // skip duplicate
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

    // Logo click: always reset to home and clear history stack
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

    // Show onboarding on first visit
    const [showOnboarding, setShowOnboarding] = useState(false);
    useEffect(() => {
        if (!profileLoading && session) {
            const needsOnboarding = localStorage.getItem('liora-needs-onboarding') === 'true';
            if (!profile || needsOnboarding) {
                setShowOnboarding(true);
            }
        }
    }, [profileLoading, profile, session]);

    const handleProfileCreated = () => {
        localStorage.removeItem('liora-needs-onboarding');
        setShowOnboarding(false);
        setView('home');
    };

    const handleDemoClick = () => {
        // Trigger a demo flow
        setView('home');
    };

    // Full-page views (no sidebar/header)
    const fullPageViews: View[] = ['onboarding', 'checkout'];
    const isFullPage = fullPageViews.includes(view) || showOnboarding;

    if (isFullPage || showOnboarding) {
        return (
            <ConversationProvider>
                <DiningProvider>
                    <div className="min-h-screen bg-cream-50 text-stone-800 overflow-y-auto">
                        <div className="max-w-2xl mx-auto px-4 py-8">
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
            case 'home':
                return (
                    <FullPageWrapper>
                        <HomePage favorites={favorites} addFavorite={addFavorite} removeFavorite={removeFavorite} setView={setView} />
                    </FullPageWrapper>
                );
            case 'nearby':
                return (
                    <SimplePageWrapper>
                        <NearbyPage favorites={favorites} addFavorite={addFavorite} removeFavorite={removeFavorite} setView={setView} />
                    </SimplePageWrapper>
                );
            case 'date_night':
                return (
                    <SimplePageWrapper>
                        <DateNightPage />
                    </SimplePageWrapper>
                );
            case 'dating':
                return (
                    <SimplePageWrapper>
                        <DatingHub setView={setView} />
                    </SimplePageWrapper>
                );
            case 'planner':
                return (
                    <SimplePageWrapper>
                        <PlannerPage />
                    </SimplePageWrapper>
                );
            case 'fitness':
                return (
                    <SimplePageWrapper>
                        <FitnessHub setView={setView} />
                    </SimplePageWrapper>
                );

            case 'hotels':
                return (
                    <SimplePageWrapper>
                        <HotelsPage onNavigate={setView} />
                    </SimplePageWrapper>
                );
            case 'ai_waiter':
                return (
                    <FullPageWrapper>
                        <AiWaiterPage />
                    </FullPageWrapper>
                );
            case 'chef_mode':
            case 'chef':
                return (
                    <FullPageWrapper>
                        <ChefModePage />
                    </FullPageWrapper>
                );
            case 'ai_chat':
                return (
                    <FullPageWrapper>
                        <AiChatPage />
                    </FullPageWrapper>
                );
            case 'profile':
                return (
                    <SimplePageWrapper>
                        <UserProfile setView={setView} />
                    </SimplePageWrapper>
                );
            case 'account':
            case 'login':
                return (
                    <SimplePageWrapper>
                        <AccountPage setView={setView} />
                    </SimplePageWrapper>
                );
            case 'favorites':
                return (
                    <SimplePageWrapper>
                        <FavoritesPage favorites={favorites} removeFavorite={removeFavorite} />
                    </SimplePageWrapper>
                );
            case 'support':
                return (
                    <SimplePageWrapper>
                        <SupportPage />
                    </SimplePageWrapper>
                );
            case 'calorie_log':
                return (
                    <SimplePageWrapper>
                        <CalorieLogPage />
                    </SimplePageWrapper>
                );
            case 'offers':
                return (
                    <SimplePageWrapper>
                        <OffersPage />
                    </SimplePageWrapper>
                );
            case 'orders':
                return (
                    <SimplePageWrapper>
                        <OrdersPage />
                    </SimplePageWrapper>
                );
            case 'restaurants':
                return (
                    <SimplePageWrapper>
                        <RestaurantsPage setView={setView} />
                    </SimplePageWrapper>
                );
            default:
                return (
                    <SimplePageWrapper>
                        <HomePage favorites={favorites} addFavorite={addFavorite} removeFavorite={removeFavorite} setView={setView} />
                    </SimplePageWrapper>
                );
        }
    };

    return (
        <ConversationProvider>
            <DiningProvider>
                <div className="flex h-screen bg-cream-50 text-stone-800 overflow-hidden">
                    {/* Sidebar */}
                    <Sidebar
                        view={view}
                        setView={setView}
                        onDemoClick={handleDemoClick}
                        isSidebarOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />

                    {/* Mobile backdrop */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* Main content */}
                    <main className="flex-1 flex flex-col min-w-0 relative">
                        <Header setView={setView} onMenuClick={() => setIsSidebarOpen(true)} canGoBack={canGoBack} onBack={goBack} onHomeClick={resetToHome} />

                        {/* Trial banner */}
                        {isPremium && isTrial && daysLeftInTrial !== null && daysLeftInTrial <= 3 && (
                            <div className="mx-4 mt-2 p-2.5 rounded-xl bg-brand-400/10 border border-brand-400/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon name="sparkles" className="w-4 h-4 text-brand-400" />
                                    <span className="text-xs text-stone-600">
                                        <strong className="text-brand-400">{daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''}</strong> left in trial
                                    </span>
                                </div>
                                <button onClick={() => openModal('pricing')} className="text-xs font-semibold text-brand-400 hover:text-brand-300">
                                    Upgrade
                                </button>
                            </div>
                        )}

                        <Suspense fallback={<PageSpinner />}>
                            {renderPage()}
                        </Suspense>

                        {/* Mobile bottom nav */}
                        <nav className="md:hidden flex-shrink-0 bg-white border border-cream-200 shadow-sm border-t border-cream-100 safe-area-bottom">
                            <div className="flex justify-around py-2">
                                {BOTTOM_NAV.map(item => {
                                    const isActive = view === item.view || (item.view === 'dating' && view === 'date_night');
                                    return (
                                        <button
                                            key={item.view}
                                            onClick={() => setView(item.view)}
                                            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                                                isActive ? 'text-brand-400' : 'text-stone-400'
                                            }`}
                                        >
                                            <Icon name={item.icon} className="w-5 h-5" />
                                            <span className="text-[10px] font-medium">{item.label}</span>
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
