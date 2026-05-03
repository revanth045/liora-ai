import React, { useEffect, useState } from 'react';
import { View, ChatMessage } from '../../../../types';
import { useSession } from '../../../auth/useSession';
import { useUserProfile } from '../../../../hooks/useUserProfile';
import {
    db_getAllRestaurants, db_listAllOrders, db_listAllActivePromotions,
    type DemoRestaurant, type DemoOrder, type DemoPromotion,
} from '../../../demoDb';
import { Icon } from '../../../../components/Icon';
import imgAiChef from '@assets/Happy_robot_chef_in_action_1776234347274.png';
import imgOffers from '@assets/offers_1776233841155.png';
import imgNearby from '@assets/Nearby_1776233850952.png';
import imgCalorie from '@assets/calorie_1776233856996.png';
import imgAiWaiter from '@assets/Aiwaiter_1776233866008.png';
import imgAiChat from '@assets/AiChat_1776233876053.png';
import imgOrders from '@assets/orders_1776233886335.png';
import imgRestaurants from '@assets/restaurants_1776233894365.png';

interface HomeProps {
    favorites: ChatMessage[];
    addFavorite: (msg: ChatMessage) => void;
    removeFavorite: (id: string) => void;
    setView: (view: View) => void;
}

function timeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

const QUICK_ACTIONS: { img: string; label: string; view: View }[] = [
    { img: imgRestaurants, label: 'Restaurants', view: 'restaurants' },
    { img: imgOrders,      label: 'My Orders',   view: 'orders'      },
    { img: imgAiChat,      label: 'AI Chat',     view: 'ai_chat'     },
    { img: imgAiWaiter,    label: 'AI Waiter',   view: 'ai_waiter'   },
    { img: imgAiChef,      label: 'AI Chef',     view: 'chef_mode'   },
    { img: imgCalorie,     label: 'Calorie Log', view: 'calorie_log' },
    { img: imgNearby,      label: 'Nearby',      view: 'nearby'      },
    { img: imgOffers,      label: 'Deals',       view: 'offers'      },
];

const CUISINE_EMOJI: Record<string, string> = {
    italian: '🍝', japanese: '🍣', indian: '🍝', mexican: '🌮',
    chinese: '🥡', american: '🍝', thai: '🍝', mediterranean: '🥗',
    french: '🥗', korean: '🍲', default: '🍽️',
};
function cuisineEmoji(cuisine?: string) {
    if (!cuisine) return CUISINE_EMOJI.default;
    return CUISINE_EMOJI[cuisine.toLowerCase()] ?? CUISINE_EMOJI.default;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
    preparing: { label: 'Preparing', cls: 'bg-blue-100 text-blue-700' },
    ready: { label: 'Ready!', cls: 'bg-green-100 text-green-700' },
    delivered: { label: 'Delivered', cls: 'bg-stone-100 text-stone-500' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-500' },
};

export default function HomePage({ setView }: HomeProps) {
    const session = useSession();
    const { profile } = useUserProfile();
    const [restaurants, setRestaurants] = useState<DemoRestaurant[]>([]);
    const [myOrders, setMyOrders] = useState<DemoOrder[]>([]);
    const [promos, setPromos] = useState<DemoPromotion[]>([]);

    const userEmail = session?.user?.email ?? null;
    const userName = profile?.profile?.name || session?.user?.name || 'there';

    useEffect(() => {
        setRestaurants(db_getAllRestaurants().filter(r => r.name));
        setPromos(db_listAllActivePromotions().slice(0, 4));
    }, []);

    useEffect(() => {
        if (!userEmail) return;
        const all = db_listAllOrders();
        setMyOrders(
            all.filter(o => o.customerEmail === userEmail).slice(0, 5)
        );
    }, [userEmail]);

    const activeOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');

    return (
        <div className="min-h-screen bg-cream-50 pb-28">

            {/* -- Hero Banner -- */}
            <div className="relative overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 px-6 pt-10 pb-16">
                <div className="relative z-10 max-w-2xl">
                    <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-1 animate-fade-in" style={{ animationDelay: '80ms', opacity: 0, animationFillMode: 'forwards' }}>{timeGreeting()}</p>
                    <h1 className="text-3xl font-lora font-bold text-white mb-2 animate-fade-in" style={{ animationDelay: '160ms', opacity: 0, animationFillMode: 'forwards' }}>
                        Welcome back, {userName.split(' ')[0]} 🍝
                    </h1>
                    <p className="text-white/60 text-sm animate-fade-in" style={{ animationDelay: '240ms', opacity: 0, animationFillMode: 'forwards' }}>What are you in the mood for today?</p>

                    {/* Search bar → opens restaurants */}
                    <button
                        onClick={() => setView('restaurants')}
                        className="mt-5 w-full flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3.5 text-white/60 text-sm hover:bg-white/20 hover:border-amber-400/40 hover:text-white/80 transition-all text-left group animate-fade-in"
                        style={{ animationDelay: '320ms', opacity: 0, animationFillMode: 'forwards' }}
                    >
                        <Icon name="search" size={18} className="group-hover:text-amber-400 transition-colors" />
                        <span>Search restaurants, cuisines...</span>
                        <Icon name="arrow_forward" size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-amber-400 transition-all group-hover:translate-x-0.5" />
                    </button>
                </div>
                {/* Decorative blobs */}
                <div className="absolute -top-12 -right-12 w-52 h-52 bg-amber-400/8 rounded-full pointer-events-none" />
                <div className="absolute top-20 -right-6 w-32 h-32 bg-amber-400/10 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-forest-700/30 rounded-full pointer-events-none" />
            </div>

            {/* -- Active Order Alert -- */}
            {activeOrders.length > 0 && (
                <div className="mx-4 -mt-6 relative z-20">
                    <button
                        onClick={() => setView('orders')}
                        className="w-full bg-white border border-amber-200 rounded-2xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-98"
                    >
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            <Icon name="local_fire_department" size={22} className="text-amber-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-stone-800">
                                {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''} in progress
                            </p>
                            <p className="text-xs text-stone-400 mt-0.5">Tap to track your order status</p>
                        </div>
                        <Icon name="chevron_right" size={18} className="text-stone-400" />
                    </button>
                </div>
            )}

            <div className="px-4 mt-6 space-y-8">

                {/* -- Quick Actions -- */}
                <section className="animate-slide-up stagger-1">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Quick Access</h2>
                    <div className="grid grid-cols-4 gap-3">
                        {QUICK_ACTIONS.map((action, i) => (
                            <button
                                key={action.view}
                                onClick={() => setView(action.view)}
                                className="flex flex-col items-center gap-2 py-3 px-1 bg-white rounded-2xl border border-cream-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-amber-200 transition-all active:scale-95 group"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                    <img src={action.img} alt={action.label} className="w-12 h-12 object-contain" />
                                </div>
                                <span className="text-[10px] font-bold text-stone-600 text-center leading-tight group-hover:text-amber-700 transition-colors">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* -- Restaurants Near You -- */}
                {restaurants.length > 0 && (
                    <section className="animate-slide-up stagger-2">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Restaurants</h2>
                            <button onClick={() => setView('restaurants')} className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors">See all →</button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                            {restaurants.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setView('restaurants')}
                                    className="shrink-0 w-44 bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-amber-200 transition-all active:scale-95 text-left group"
                                >
                                    <div className="h-20 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300 origin-center">
                                        {cuisineEmoji(r.cuisine)}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-sm font-bold text-stone-800 truncate group-hover:text-amber-700 transition-colors">{r.name || 'Restaurant'}</p>
                                        <p className="text-[10px] text-stone-400 capitalize mt-0.5">{r.cuisine || 'Various cuisines'}</p>
                                        {r.address && (
                                            <p className="text-[9px] text-stone-300 mt-1 truncate">{r.address}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                            {/* Add a "browse more" card */}
                            <button
                                onClick={() => setView('restaurants')}
                                className="shrink-0 w-44 bg-forest-900 rounded-2xl flex flex-col items-center justify-center gap-2 text-white hover:bg-forest-800 transition-colors active:scale-95 min-h-[130px]"
                            >
                                <Icon name="restaurant" size={28} className="text-amber-400" />
                                <span className="text-xs font-bold">Browse All</span>
                            </button>
                        </div>
                    </section>
                )}

                {/* -- Active Deals -- */}
                {promos.length > 0 && (
                    <section className="animate-slide-up stagger-3">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Deals & Offers</h2>
                            <button onClick={() => setView('offers')} className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors">See all →</button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                            {promos.map(p => (
                                <div
                                    key={p.id}
                                    className="shrink-0 w-52 bg-gradient-to-br from-forest-900 to-forest-800 rounded-2xl p-4 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-default"
                                >
                                    <div className="text-amber-400 text-2xl font-lora font-bold mb-1">
                                        {p.type === 'percent' ? `${p.value}% OFF` : p.type === 'flat' ? fmt(p.value * 100) + ' OFF' : 'BOGO'}
                                    </div>
                                    <p className="text-sm font-bold leading-snug">{p.title}</p>
                                    {p.code && (
                                        <div className="mt-2 bg-white/10 rounded-lg px-2 py-1 text-[10px] font-mono tracking-wider text-amber-300">
                                            {p.code}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* -- Recent Orders -- */}
                {myOrders.length > 0 && (
                    <section className="animate-slide-up stagger-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Recent Orders</h2>
                            <button onClick={() => setView('orders')} className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors">View all →</button>
                        </div>
                        <div className="space-y-2">
                            {myOrders.slice(0, 3).map(order => {
                                const st = STATUS_LABEL[order.status] ?? { label: order.status, cls: 'bg-stone-100 text-stone-500' };
                                const rName = restaurants.find(r => r.id === order.restaurantId)?.name || 'Restaurant';
                                return (
                                    <button
                                        key={order.id}
                                        onClick={() => setView('orders')}
                                        className="w-full bg-white rounded-2xl border border-cream-200 shadow-sm px-4 py-3 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-200 transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                                            🍽️
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-stone-800 truncate group-hover:text-amber-700 transition-colors">{rName}</p>
                                            <p className="text-[11px] text-stone-400 truncate">
                                                {order.items.map(i => i.name).join(', ')}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                            <p className="text-xs text-stone-400 mt-1">{fmt(order.totalCents)}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* -- AI Assistant CTA (empty state / always shown) -- */}
                <section className="animate-slide-up stagger-5">
                    <button
                        onClick={() => setView('ai_chat')}
                        className="w-full bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-6 flex items-center gap-4 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:from-violet-500 hover:to-violet-700 transition-all active:scale-95 group"
                    >
                        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 text-2xl group-hover:scale-110 group-hover:bg-white/20 transition-all">
                            <Icon name="smart_toy" size={28} className="text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-white font-lora font-bold text-lg">Ask Liora anything</p>
                            <p className="text-white/70 text-sm mt-0.5">Your personal AI dining assistant</p>
                        </div>
                        <Icon name="arrow_forward" size={20} className="text-white/60 ml-auto shrink-0 group-hover:translate-x-1 group-hover:text-white transition-all" />
                    </button>
                </section>

            </div>
        </div>
    );
}