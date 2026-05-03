import React, { useEffect, useState } from 'react';
import { View, ChatMessage } from '../../../../types';
import { useSession } from '../../../auth/useSession';
import { useUserProfile } from '../../../../hooks/useUserProfile';
import {
    db_getAllRestaurants, db_listAllOrders, db_listAllActivePromotions,
    type DemoRestaurant, type DemoOrder, type DemoPromotion,
} from '../../../demoDb';
import { Icon } from '../../../../components/Icon';
import { useSettings } from '../../../context/SettingsContext';
import { t } from '../../../lib/i18n';

import imgRestaurants from '../../../assets/quick_actions/restaurants_1776233894365.png';
import imgOrders from '../../../assets/quick_actions/orders_1776233886335.png';
import imgAiChat from '../../../assets/quick_actions/AiChat_1776233876053.png';
import imgAiWaiter from '../../../assets/quick_actions/Aiwaiter_1776233866008.png';
import imgAiChef from '../../../assets/quick_actions/Happy_robot_chef_in_action_1776233731026.png';
import imgFitness from '../../../assets/quick_actions/calorie_1776233856996.png';
import imgOffers from '../../../assets/quick_actions/offers_1776233841155.png';
import imgHotels from '../../../assets/quick_actions/Nearby_1776233850952.png';

interface HomeProps {
    favorites: ChatMessage[];
    addFavorite: (msg: ChatMessage) => void;
    removeFavorite: (id: string) => void;
    setView: (view: View) => void;
}

function timeGreetingKey() {
    const h = new Date().getHours();
    if (h < 12) return 'greet.morning';
    if (h < 17) return 'greet.afternoon';
    return 'greet.evening';
}
const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const QUICK_ACTIONS: { img: string; label: string; view: View; tint: string }[] = [
    { img: imgRestaurants, label: 'Restaurants', view: 'restaurants', tint: 'from-amber-50 to-orange-100' },
    { img: imgOrders,      label: 'My Orders',   view: 'orders',      tint: 'from-orange-50 to-amber-100' },
    { img: imgAiChat,      label: 'AI Concierge',view: 'ai_chat',     tint: 'from-violet-50 to-fuchsia-100' },
    { img: imgAiWaiter,    label: 'AI Waiter',   view: 'ai_waiter',   tint: 'from-sky-50 to-cyan-100' },
    { img: imgAiChef,      label: 'AI Chef',     view: 'chef_mode',   tint: 'from-teal-50 to-emerald-100' },
    { img: imgFitness,     label: 'Fitness',     view: 'fitness',     tint: 'from-emerald-50 to-green-100' },
    { img: imgOffers,      label: 'Offers',      view: 'offers',      tint: 'from-fuchsia-50 to-pink-100' },
    { img: imgHotels,      label: 'Hotels',      view: 'hotels',      tint: 'from-indigo-50 to-blue-100' },
];

const CUISINE_EMOJI: Record<string, string> = {
    italian: '🍝', japanese: '🍣', indian: '🍛', mexican: '🌮',
    chinese: '🥡', american: '🍔', thai: '🥘', mediterranean: '🥗',
    french: '🥐', korean: '🍲', default: '🍽️',
};
const cuisineEmoji = (c?: string) => c ? (CUISINE_EMOJI[c.toLowerCase()] ?? CUISINE_EMOJI.default) : CUISINE_EMOJI.default;

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
    preparing: { label: 'Preparing', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
    ready:     { label: 'Ready!',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
    delivered: { label: 'Delivered', cls: 'bg-stone-100 text-stone-600 dark:bg-stone-700/40 dark:text-stone-600' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-300' },
};

export default function HomePage({ setView }: HomeProps) {
    const session = useSession();
    const { profile } = useUserProfile();
    const settings = useSettings();
    const [restaurants, setRestaurants] = useState<DemoRestaurant[]>([]);
    const [myOrders, setMyOrders] = useState<DemoOrder[]>([]);
    const [promos, setPromos] = useState<DemoPromotion[]>([]);

    const userEmail = session?.user?.email ?? null;
    const userName  = profile?.profile?.name || session?.user?.name || 'there';
    const firstName = userName.split(' ')[0];

    useEffect(() => {
        setRestaurants(db_getAllRestaurants().filter(r => r.name));
        setPromos(db_listAllActivePromotions().slice(0, 6));
    }, []);

    useEffect(() => {
        if (!userEmail) return;
        const all = db_listAllOrders();
        setMyOrders(all.filter(o => o.customerEmail === userEmail).slice(0, 5));
    }, [userEmail]);

    const activeOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');
    const venueName = settings.brand.displayName || 'Liora';

    return (
        <div className="min-h-screen pb-24">
            {/* ============= HERO ============= */}
            <section className="relative overflow-hidden">
                {/* gradient base */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700" />
                {/* photographic overlay */}
                <div
                    className="absolute inset-0 opacity-30 mix-blend-overlay bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=2000&q=80')" }}
                />
                {/* gloss */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-900/40" />

                <div className="relative z-10 px-6 md:px-10 pt-12 pb-20 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">{t(settings.locale, timeGreetingKey())}</span>
                        <span className="w-8 h-px bg-white/40" />
                    </div>
                    <h1 className="font-display text-4xl md:text-6xl font-light text-white leading-[1.05] tracking-tight">
                        <span className="block">Hello, {firstName}.</span>
                        <span className="italic font-extralight text-white/90">What shall we taste today?</span>
                    </h1>

                    {/* search */}
                    <button
                        onClick={() => setView('restaurants')}
                        className="mt-8 w-full md:max-w-xl flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/30 rounded-full px-5 py-4 text-white/85 text-sm hover:bg-white/25 transition-colors text-left shadow-lift"
                    >
                        <Icon name="search" size={18} />
                        <span className="flex-1">{t(settings.locale, 'common.search')}</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/90 hidden sm:inline">tap to explore</span>
                    </button>

                    {/* trust pills */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        {[
                            { ic: 'sparkles', t: 'AI-curated picks' },
                            { ic: 'star', t: '4.9 ⭐ avg rating' },
                            { ic: 'local_offer', t: 'Member offers' },
                        ].map((p, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/85 text-[11px] font-semibold">
                                <Icon name={p.ic} size={12} /> {p.t}
                            </span>
                        ))}
                    </div>
                </div>

                {/* decorative blobs */}
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 -left-10 w-56 h-56 rounded-full bg-brand-300/30 blur-3xl pointer-events-none" />
            </section>

            {/* Active order alert — overlapping card */}
            {activeOrders.length > 0 && (
                <div className="px-4 md:px-10 max-w-5xl mx-auto -mt-10 relative z-20">
                    <button
                        onClick={() => setView('orders')}
                        className="w-full card-elev px-5 py-4 flex items-center gap-4 hover:shadow-lift transition-shadow text-left"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-glow">
                            <Icon name="local_fire_department" size={22} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-stone-900">
                                {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''} cooking now
                            </p>
                            <p className="text-xs text-stone-600 mt-0.5">Tap to track every step in real time</p>
                        </div>
                        <Icon name="chevron_right" size={20} className="text-stone-600" />
                    </button>
                </div>
            )}

            <div className="px-4 md:px-10 max-w-5xl mx-auto mt-8 space-y-12">
                {/* ============= QUICK ACCESS ============= */}
                <section>
                    <SectionHeader eyebrow={t(settings.locale, 'home.quickAccess')} title="Everything you need, one tap away" />
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
                        {QUICK_ACTIONS.map(action => (
                            <button
                                key={action.view}
                                onClick={() => setView(action.view)}
                                className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br ${action.tint} dark:from-surface-100 dark:to-surface-200 border border-cream-200 dark:border-surface-300 hover:shadow-lift hover:-translate-y-0.5 transition-all active:scale-95`}
                            >
                                <div className={`relative w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <img src={action.img} alt={action.label} className="w-11 h-11 object-contain drop-shadow-md relative z-10 rounded-[12px]" />
                                </div>
                                <span className="text-[10px] font-bold text-stone-800 dark:text-stone-700 text-center leading-tight tracking-tight">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ============= RESTAURANTS ============= */}
                {restaurants.length > 0 && (
                    <section>
                        <SectionHeader
                            eyebrow={t(settings.locale, 'home.restaurants')}
                            title="Discover venues near you"
                            cta={{ label: t(settings.locale, 'common.seeAll'), onClick: () => setView('restaurants') }}
                        />
                        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                            {restaurants.slice(0, 8).map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setView('restaurants')}
                                    className="snap-start shrink-0 w-56 card card-hover overflow-hidden text-left"
                                >
                                    <div className="relative h-32 bg-gradient-to-br from-brand-100 to-brand-300 flex items-center justify-center text-5xl">
                                        {cuisineEmoji(r.cuisine)}
                                        <span className="absolute top-2 right-2 tag-gold !text-[9px]">Open</span>
                                    </div>
                                    <div className="p-3.5">
                                        <p className="text-sm font-bold text-stone-900 truncate">{r.name || 'Restaurant'}</p>
                                        <p className="text-[11px] text-stone-600 capitalize mt-0.5 flex items-center gap-1.5">
                                            <span>{r.cuisine || 'Cuisine'}</span>
                                            <span className="text-stone-600">·</span>
                                            <span className="inline-flex items-center gap-0.5"><Icon name="star" size={10} className="text-amber-400"/> 4.{Math.floor(Math.random()*9)+1}</span>
                                        </p>
                                        {r.address && <p className="text-[10px] text-stone-600 mt-1 truncate">{r.address}</p>}
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={() => setView('restaurants')}
                                className="snap-start shrink-0 w-56 rounded-[var(--radius-lg)] section-forest flex flex-col items-center justify-center gap-3 text-cream-50 hover:opacity-90 transition-opacity active:scale-95 p-6"
                            >
                                <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center">
                                    <Icon name="restaurant" size={22} className="text-white" />
                                </div>
                                <span className="text-sm font-display italic">Browse all venues</span>
                                <Icon name="arrow_forward" size={18} />
                            </button>
                        </div>
                    </section>
                )}

                {/* ============= AI CONCIERGE CARD ============= */}
                <section>
                    <button
                        onClick={() => setView('ai_chat')}
                        className="w-full relative overflow-hidden rounded-3xl text-left group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-brand-900" />
                        <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80')" }} />
                        <div className="relative z-10 p-7 md:p-9 flex items-center gap-5">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0 shadow-glow">
                                <Icon name="sparkles" className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300 mb-1.5">Concierge</p>
                                <p className="font-display text-2xl md:text-3xl text-white leading-tight">{t(settings.locale, 'home.askLiora')}</p>
                                <p className="text-white/70 text-sm mt-1.5">{t(settings.locale, 'home.askLioraSub')}</p>
                            </div>
                            <Icon name="arrow_forward" size={22} className="text-white/70 group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                    </button>
                </section>

                {/* ============= DEALS ============= */}
                {promos.length > 0 && (
                    <section>
                        <SectionHeader
                            eyebrow={t(settings.locale, 'home.deals')}
                            title="Saving served warm"
                            cta={{ label: t(settings.locale, 'common.seeAll'), onClick: () => setView('offers') }}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {promos.slice(0, 6).map((p, i) => (
                                <div
                                    key={p.id}
                                    className={`relative overflow-hidden rounded-2xl p-5 text-white ${
                                        i % 3 === 0 ? 'bg-gradient-to-br from-brand-500 to-brand-700' :
                                        i % 3 === 1 ? 'bg-gradient-to-br from-stone-800 to-stone-900' :
                                                      'bg-gradient-to-br from-emerald-700 to-emerald-900'
                                    }`}
                                >
                                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                                    <div className="relative">
                                        <span className="tag bg-white/15 text-white border-white/20">{p.type === 'percent' ? 'Percent off' : p.type === 'flat' ? 'Flat off' : 'BOGO'}</span>
                                        <div className="font-display text-4xl font-light mt-3 leading-none tracking-tight">
                                            {p.type === 'percent' ? `${p.value}%` : p.type === 'flat' ? fmt(p.value * 100) : 'BOGO'}
                                        </div>
                                        <p className="text-sm font-semibold mt-2 leading-snug">{p.title}</p>
                                        {p.code && (
                                            <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-lg px-2.5 py-1 text-[11px] font-mono tracking-widest border border-white/15">
                                                <Icon name="local_offer" size={12} /> {p.code}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ============= RECENT ORDERS ============= */}
                {myOrders.length > 0 && (
                    <section>
                        <SectionHeader
                            eyebrow={t(settings.locale, 'home.recentOrders')}
                            title="Pick up where you left off"
                            cta={{ label: t(settings.locale, 'common.viewAll'), onClick: () => setView('orders') }}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {myOrders.slice(0, 4).map(order => {
                                const st = STATUS_LABEL[order.status] ?? { label: order.status, cls: 'bg-stone-100 text-stone-600' };
                                const rName = restaurants.find(r => r.id === order.restaurantId)?.name || 'Restaurant';
                                return (
                                    <button
                                        key={order.id}
                                        onClick={() => setView('orders')}
                                        className="card card-hover px-4 py-3.5 flex items-center gap-4 text-left"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-300 flex items-center justify-center text-2xl shrink-0">🍽️</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-stone-900 truncate">{rName}</p>
                                            <p className="text-[11px] text-stone-600 truncate mt-0.5">{order.items.map(i => i.name).join(' · ')}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                            <p className="text-xs text-stone-700 font-bold mt-1">{fmt(order.totalCents)}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ============= EDITORIAL FOOTER STRIP ============= */}
                <section className="text-center py-8 border-t border-cream-200">
                    <p className="font-display text-2xl md:text-3xl italic font-light text-stone-700 leading-snug max-w-2xl mx-auto">
                        “Every plate tells a story. <span className="text-brand-600">{venueName}</span> helps you find yours.”
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-600 mt-3">— your AI concierge</p>
                </section>
            </div>
        </div>
    );
}

function SectionHeader({ eyebrow, title, cta }: { eyebrow: string; title: string; cta?: { label: string; onClick: () => void } }) {
    return (
        <div className="flex items-end justify-between mb-4">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600 mb-1">{eyebrow}</p>
                <h2 className="font-display text-xl md:text-2xl text-stone-900 tracking-tight">{title}</h2>
            </div>
            {cta && (
                <button onClick={cta.onClick} className="text-xs font-bold text-stone-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 shrink-0">
                    {cta.label}
                    <Icon name="arrow_forward" size={14} />
                </button>
            )}
        </div>
    );
}
