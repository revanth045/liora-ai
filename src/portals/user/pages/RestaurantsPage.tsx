import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../../../components/Icon';
import {
    db_getAllRestaurants, db_listMenu, db_listChefSpecials, db_addOrder,
    db_addTableAlert,
    type DemoRestaurant, type DayHours, type DemoMenuItem, type DemoChefSpecial,
} from '../../../demoDb';
import { sbAddOrder, sbAddTableAlert } from '../../../lib/supabaseDb';
import { uid } from '../../../../utils/uid';
import { useSession } from '../../../auth/useSession';
import { useUserProfile } from '../../../../hooks/useUserProfile';

// --- Types --------------------------------------------------------------------
interface Restaurant {
    id: string;
    name: string;
    cuisine: string;
    zip: string;
    address?: string;
    phone?: string;
    website?: string;
    priceRange: '$' | '$$' | '$$$' | '$$$$';
    rating: number;
    features: string[];
    description?: string;
    hours?: string;
    imageEmoji: string;
    addedAt: number;
    isPartner?: boolean;
}

// --- Cart ---------------------------------------------------------------------
interface CartItem {
    id: string;
    name: string;
    priceCents: number;
    qty: number;
    emoji: string;
}

// --- Constants ----------------------------------------------------------------
const CUISINES = [
    'American', 'Italian', 'Mexican', 'Japanese', 'Chinese', 'Indian',
    'Mediterranean', 'Thai', 'French', 'Greek', 'Korean', 'Vietnamese',
    'Middle Eastern', 'Caribbean', 'Spanish', 'Steakhouse', 'Seafood',
    'Vegetarian/Vegan', 'Pizza', 'Burgers', 'Other',
];

const ALL_FEATURES = [
    'WiFi', 'Outdoor Seating', 'Takeout', 'Delivery', 'Dine-in',
    'Parking', 'Reservations', 'Live Music', 'Happy Hour',
    'Pet Friendly', 'Vegetarian Options', 'Vegan Options',
    'Gluten-Free Options', 'Bar', 'Private Dining', 'Catering',
];

const EMOJIS = ['🏃‍♂️', '🛎️', '🍝', '🌮', '🍝', '🥗', '🍣', '🥩', '🍔', '🍝', '🥗', '🍝', '🍕', '🥗', '🧂', '🥨', '🍝', '🥗', '🥂', '🧂'];

const RKEY = 'liora_public_restaurants';

// --- Portal restaurant bridge -------------------------------------------------
function formatDayHours(hours: DayHours[]): string {
    const ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const open = hours
        .map((h, i) => h.closed ? null : `${ABBR[i]} ${h.open}-${h.close}`)
        .filter(Boolean);
    return open.join(' · ');
}

function portalRestaurantToDisplay(r: DemoRestaurant): Restaurant {
    const zipMatch = r.address?.match(/\b\d{5}\b/);
    return {
        id: r.id,
        name: r.name,
        cuisine: r.cuisine || 'Other',
        zip: zipMatch ? zipMatch[0] : '',
        address: r.address || '',
        phone: r.phone || '',
        website: r.website || '',
        priceRange: '$$',
        rating: 0,
        features: ['Dine-in'],
        description: r.bio || '',
        hours: r.hours ? formatDayHours(r.hours) : '',
        imageEmoji: '🍽️',
        addedAt: Date.now(),
        isPartner: true,
    };
}

// --- Storage helpers ----------------------------------------------------------
function readRestaurants(): Restaurant[] {
    try { return JSON.parse(localStorage.getItem(RKEY) || '[]'); } catch { return []; }
}
function writeRestaurants(list: Restaurant[]) {
    localStorage.setItem(RKEY, JSON.stringify(list));
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function getAll(): Restaurant[] {
    return readRestaurants();
}

// --- Sub-components -----------------------------------------------------------
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-brand-400' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="text-xs font-semibold text-stone-600 ml-1">{rating.toFixed(1)}</span>
        </div>
    );
}

function FeatureTag({ label }: { label: string }) {
    const icons: Record<string, string> = {
        'WiFi': 'wifi', 'Outdoor Seating': 'leaf', 'Takeout': 'shopping-bag', 'Delivery': 'truck',
        'Dine-in': 'restaurant_menu', 'Parking': 'car', 'Reservations': 'calendar',
        'Live Music': 'music', 'Happy Hour': 'sparkles', 'Pet Friendly': 'heart',
        'Vegetarian Options': 'leaf', 'Vegan Options': 'leaf', 'Gluten-Free Options': 'check',
        'Bar': 'wine', 'Private Dining': 'star', 'Catering': 'briefcase',
    };
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest-900/8 text-forest-900 text-xs font-medium border border-forest-900/10">
            <Icon name={icons[label] || 'check'} className="w-3 h-3" />
            {label}
        </span>
    );
}

// --- Menu item card (dark food template) -------------------------------------
function MenuItemCard({ item, qty = 0, onAdd, onRemove }: {
    item: DemoMenuItem;
    qty?: number;
    onAdd?: () => void;
    onRemove?: () => void;
}) {
    const price = `$${(item.priceCents / 100).toFixed(2)}`;
    return (
        <div className="flex flex-col items-center bg-[#1c1c1e] border border-white/8 rounded-2xl p-4 gap-3 relative overflow-hidden group">
            {/* circular food image / emoji */}
            <div className="w-20 h-20 rounded-full bg-[#2a2a2d] border-2 border-white/10 flex items-center justify-center text-4xl shadow-lg group-hover:scale-105 transition-transform">
                {item.tags?.find(t => /^\p{Emoji}/u.test(t)) || '🍽️'}
            </div>
            <div className="text-center">
                <p className="font-semibold text-white text-sm leading-snug">{item.name}</p>
                {item.description && (
                    <p className="text-white/40 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                )}
            </div>
            <div className="flex items-center justify-between w-full mt-auto pt-1">
                <span className="text-[#f5c842] font-bold text-base">{price}</span>
                {qty > 0 ? (
                    <div className="flex items-center gap-1.5">
                        <button onClick={onRemove} className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors">
                            <Icon name="minus" className="w-3 h-3" />
                        </button>
                        <span className="text-white font-bold text-sm w-4 text-center">{qty}</span>
                        <button onClick={onAdd} className="w-7 h-7 rounded-full bg-[#f5c842] flex items-center justify-center text-black shadow-md hover:bg-yellow-300 transition-colors">
                            <Icon name="add" className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <button onClick={onAdd} className="w-7 h-7 rounded-full bg-[#f5c842] flex items-center justify-center shadow-md hover:bg-yellow-300 transition-colors">
                        <Icon name="add" className="w-4 h-4 text-black" />
                    </button>
                )}
            </div>
        </div>
    );
}

// --- Chef special card (dark food template) -----------------------------------
const SPECIAL_CATEGORY_LABEL: Record<string, string> = {
    daily_special: "Daily Special",
    seasonal: "Seasonal",
    chef_choice: "Chef's Choice",
};

function ChefSpecialCard({ special, qty = 0, onAdd, onRemove }: {
    special: DemoChefSpecial;
    qty?: number;
    onAdd?: () => void;
    onRemove?: () => void;
}) {
    const price = `$${(special.priceCents / 100).toFixed(2)}`;
    return (
        <div className="flex flex-col items-center bg-[#1c1c1e] border border-[#f5c842]/20 rounded-2xl p-4 gap-3 relative overflow-hidden group">
            {/* Gold corner accent */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#f5c842]/5 rounded-bl-full" />
            {/* circular emoji */}
            <div className="w-20 h-20 rounded-full bg-[#2a2a2d] border-2 border-[#f5c842]/30 flex items-center justify-center text-4xl shadow-lg group-hover:scale-105 transition-transform">
                {special.imageEmoji || '⭐'}
            </div>
            {/* category badge */}
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#f5c842] bg-[#f5c842]/10 px-2.5 py-1 rounded-full border border-[#f5c842]/20">
                {SPECIAL_CATEGORY_LABEL[special.category] || special.category}
            </span>
            <div className="text-center">
                <p className="font-semibold text-white text-sm leading-snug">{special.name}</p>
                {special.description && (
                    <p className="text-white/40 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">{special.description}</p>
                )}
                {special.chefNote && (
                    <p className="text-[#f5c842]/70 text-[11px] mt-1.5 italic line-clamp-2">
                        👨‍🍳 "{special.chefNote}"
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between w-full mt-auto pt-1">
                <span className="text-[#f5c842] font-bold text-base">{price}</span>
                {qty > 0 ? (
                    <div className="flex items-center gap-1.5">
                        <button onClick={onRemove} className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors">
                            <Icon name="minus" className="w-3 h-3" />
                        </button>
                        <span className="text-white font-bold text-sm w-4 text-center">{qty}</span>
                        <button onClick={onAdd} className="w-7 h-7 rounded-full bg-[#f5c842] flex items-center justify-center text-black shadow-md hover:bg-yellow-300 transition-colors">
                            <Icon name="add" className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <button onClick={onAdd} className="w-7 h-7 rounded-full bg-[#f5c842] flex items-center justify-center shadow-md hover:bg-yellow-300 transition-colors">
                        <Icon name="add" className="w-4 h-4 text-black" />
                    </button>
                )}
            </div>
        </div>
    );
}

// --- Full Restaurant Page (replaces modal) -----------------------------------
function RestaurantPage({
    r,
    onBack,
    autoNote,
    userProfile,
    customerName,
    customerEmail,
    onDineIn,
}: {
    r: Restaurant;
    onBack: () => void;
    autoNote: string;
    userProfile?: any;
    customerName: string;
    customerEmail?: string;
    onDineIn?: () => void;
}) {
    const [menuItems, setMenuItems] = React.useState<DemoMenuItem[]>([]);
    const [specials, setSpecials] = React.useState<DemoChefSpecial[]>([]);
    const [activeSection, setActiveSection] = React.useState<string>('specials');
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [showCheckout, setShowCheckout] = React.useState(false);
    const [tableNum, setTableNum] = React.useState('');
    const [specialInstructions, setSpecialInstructions] = React.useState(autoNote);
    const [orderPlaced, setOrderPlaced] = React.useState(false);
    const [placedOrder, setPlacedOrder] = React.useState<ReturnType<typeof db_addOrder> | null>(null);
    const [postOrderNote, setPostOrderNote] = React.useState('');
    const [savedNote, setSavedNote] = React.useState(false);
    const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

    React.useEffect(() => {
        if (r.isPartner) {
            setMenuItems(db_listMenu(r.id).filter(m => m.available));
            setSpecials(db_listChefSpecials(r.id).filter(s => s.isAvailable));
        }
    }, [r.id, r.isPartner]);

    // Group menu items by first tag (category)
    const grouped: Record<string, DemoMenuItem[]> = {};
    for (const item of menuItems) {
        const cat = item.tags?.[0] ?? 'Menu';
        (grouped[cat] = grouped[cat] ?? []).push(item);
    }
    const cats = Object.keys(grouped);

    const sections: string[] = [];
    if (specials.length > 0) sections.push('specials');
    sections.push(...cats);

    const cartTotal = cart.reduce((s, c) => s + c.priceCents * c.qty, 0);
    const cartCount = cart.reduce((s, c) => s + c.qty, 0);

    const addToCart = (id: string, name: string, priceCents: number, emoji: string) => {
        setCart(prev => {
            const existing = prev.find(c => c.id === id);
            if (existing) return prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c);
            return [...prev, { id, name, priceCents, qty: 1, emoji }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => {
            const existing = prev.find(c => c.id === id);
            if (!existing) return prev;
            if (existing.qty === 1) return prev.filter(c => c.id !== id);
            return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
        });
    };

    const getQty = (id: string) => cart.find(c => c.id === id)?.qty ?? 0;

    const scrollToSection = (sec: string) => {
        setActiveSection(sec);
        sectionRefs.current[sec]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const placeOrder = () => {
        if (!tableNum.trim() || cart.length === 0) return;
        const order = db_addOrder({
            restaurantId: r.id,
            customerName: customerName || 'Guest',
            customerEmail: customerEmail,
            tableNumber: tableNum.trim(),
            items: cart.map(c => ({
                menuItemId: c.id,
                name: c.name,
                qty: c.qty,
                priceCents: c.priceCents,
            })),
            status: 'pending',
            totalCents: cartTotal,
            createdAt: Date.now(),
            notes: specialInstructions.trim() || undefined,
            allergens: userProfile?.profile?.allergens && userProfile.profile.allergens.length > 0 ? userProfile.profile.allergens : undefined,
        });

        const alertId = uid();
        const allergensList = (userProfile?.profile?.allergens && userProfile.profile.allergens.length > 0) ? userProfile.profile.allergens.join(', ') : '';
        let notificationMessage = `Order placed with ${cart.length} items (${cart.map(c => `${c.qty}x ${c.name}`).join(', ')})`;
        if (allergensList) notificationMessage += ` | ⚠️ ALLERGY WARNING: ${allergensList}`;

        db_addTableAlert({
            id: alertId,
            restaurantName: r.name,
            tableNumber: tableNum.trim(),
            action: 'New Order',
            message: notificationMessage,
            status: 'active',
            orderId: order.id,
            createdAt: Date.now()
        });

        // Background sync to Supabase
        const payload = {
            ...order,
            updatedAt: Date.now()
        };
        sbAddOrder(payload).catch(e => console.warn('Supabase sync failed:', e));
        sbAddTableAlert({
            id: alertId,
            restaurantName: r.name,
            tableNumber: tableNum.trim(),
            action: 'New Order',
            message: notificationMessage,
        }).catch(e => console.warn('Supabase alert sync failed:', e));

        setPlacedOrder(order);
        setOrderPlaced(true);
        setShowCheckout(false);
        setCart([]);
    };

    const savePostOrderNote = () => {
        if (postOrderNote.trim()) {
            try {
                const raw = localStorage.getItem('liora-user-profile');
                if (raw) {
                    const stored = JSON.parse(raw);
                    if (!stored.profile) stored.profile = {};
                    stored.profile.notes = postOrderNote.trim();
                    localStorage.setItem('liora-user-profile', JSON.stringify(stored));
                }
            } catch { /* silent */ }
        }
        setSavedNote(true);
    };

    // -- Order success screen -------------------------------------------------
    if (orderPlaced && placedOrder) {
        return (
            <div className="fixed inset-0 z-40 bg-[#111113] flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
                <div className="max-w-sm w-full py-8">
                    <div className="w-20 h-20 rounded-full bg-[#f5c842]/10 border-2 border-[#f5c842]/30 flex items-center justify-center text-4xl mx-auto mb-6">
                        🍝
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
                    <p className="text-white/50 text-sm mb-1">Table <span className="text-white font-semibold">{placedOrder.tableNumber}</span> · {r.name}</p>
                    <p className="text-white/40 text-xs mb-6">The kitchen has been notified. We'll have it ready soon.</p>

                    {/* Order summary */}
                    <div className="bg-[#1c1c1e] rounded-2xl p-4 text-left mb-6 space-y-2">
                        {placedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-white/70">{item.qty}× {item.name}</span>
                                <span className="text-[#f5c842] font-semibold">${((item.priceCents * item.qty) / 100).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t border-white/8 pt-2 flex items-center justify-between font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-[#f5c842]">${(placedOrder.totalCents / 100).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Liora post-order dietary follow-up */}
                    {!savedNote ? (
                        <div className="bg-[#1c1c1e] rounded-2xl p-4 text-left mb-5 border border-[#f5c842]/15">
                            <p className="text-[#f5c842] text-[10px] font-bold uppercase tracking-widest mb-1">... Liora Asks</p>
                            <p className="text-white text-sm font-semibold mb-3">Any dietary notes or food preferences we should know for this visit?</p>
                            <textarea
                                value={postOrderNote}
                                onChange={e => setPostOrderNote(e.target.value)}
                                placeholder="e.g. I prefer less spice, please avoid nuts, dairy-free..."
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#111113] border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f5c842]/40 resize-none"
                            />
                            <button
                                onClick={savePostOrderNote}
                                className="w-full mt-3 py-2.5 rounded-xl bg-[#f5c842] text-black text-sm font-bold hover:bg-yellow-300 transition-colors"
                            >
                                Save to my profile
                            </button>
                            <button
                                onClick={() => setSavedNote(true)}
                                className="w-full mt-2 py-2 rounded-xl text-white/40 text-xs hover:text-white/60 transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>
                    ) : (
                        <div className="bg-[#1c1c1e] rounded-2xl p-4 text-center mb-5">
                            <p className="text-white/50 text-sm">- Thanks for your feedback!</p>
                        </div>
                    )}

                    <button
                        onClick={onBack}
                        className="w-full py-3 rounded-xl border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/5 transition-colors"
                    >
                        Back to Restaurants
                    </button>
                </div>
            </div>
        );
    }

    // -- Main full-page restaurant view ---------------------------------------
    return (
        <div className="fixed inset-0 z-40 bg-[#111113] overflow-y-auto">
            {/* Sticky top nav */}
            <div className="sticky top-0 z-10 bg-[#111113]/95 backdrop-blur-sm border-b border-white/8">
                <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
                    <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0">
                        <Icon name="chevron-left" className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                            {r.imageEmoji}
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-bold text-white text-sm leading-tight truncate">{r.name}</h1>
                            <p className="text-white/40 text-[11px]">{r.cuisine}</p>
                        </div>
                    </div>
                    {r.isPartner && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5c842]/15 border border-[#f5c842]/30 text-[9px] font-bold text-[#f5c842] uppercase tracking-wider">
                            <Icon name="verified" className="w-2.5 h-2.5" /> Partner
                        </span>
                    )}
                </div>
            </div>

            {/* Hero */}
            <div className="bg-gradient-to-b from-[#1c1c1e] to-[#111113] px-6 pt-8 pb-10 max-w-3xl mx-auto">
                <div className="flex items-start gap-5">
                    <div className="w-24 h-24 rounded-2xl bg-[#111113] border border-white/10 flex items-center justify-center text-5xl flex-shrink-0 shadow-xl">
                        {r.imageEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-white leading-tight mb-1">{r.name}</h2>
                        <p className="text-white/50 text-sm">{r.cuisine}{r.address ? ` · ${r.address}` : r.zip ? ` · ${r.zip}` : ''}</p>
                        <div className="flex items-center gap-3 mt-2">
                            {r.rating > 0
                                ? <StarRating rating={r.rating} />
                                : <span className="text-[10px] font-bold text-[#f5c842] uppercase tracking-wider">... New on Liora</span>}
                            {r.priceRange && <span className="text-xs font-bold text-white/30">{r.priceRange}</span>}
                        </div>
                        {r.description && <p className="text-white/40 text-xs mt-2 leading-relaxed line-clamp-2">{r.description}</p>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-5">
                    {r.phone && (
                        <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 text-white/40 hover:text-[#f5c842] text-xs transition-colors">
                            <Icon name="phone" className="w-3.5 h-3.5 text-[#f5c842]" /> {r.phone}
                        </a>
                    )}
                    {r.hours && (
                        <span className="flex items-center gap-1.5 text-white/40 text-xs">
                            <Icon name="clock" className="w-3.5 h-3.5 text-[#f5c842]" /> {r.hours}
                        </span>
                    )}
                    {r.features.filter(f => f !== 'Dine-in').slice(0, 3).map(f => (
                        <span key={f} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-[10px] border border-white/8">{f}</span>
                    ))}
                </div>

                {/* Prominent Dine-In CTA */}
                {r.features.includes('Dine-in') && onDineIn && (
                    <button
                        onClick={onDineIn}
                        className="mt-6 w-full flex items-center justify-between gap-3 px-6 py-4 rounded-2xl bg-[#f5c842] hover:bg-yellow-300 active:scale-[0.98] transition-all shadow-lg shadow-[#f5c842]/20 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center flex-shrink-0">
                                <Icon name="qr_code_scanner" className="w-5 h-5 text-black" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-black text-sm leading-tight">Dine In Now</p>
                                <p className="text-black/60 text-xs mt-0.5">Scan QR &amp; order with your AI waiter</p>
                            </div>
                        </div>
                        <Icon name="chevron-right" className="w-5 h-5 text-black/50 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}
            </div>

            {/* Sticky category nav */}
            {sections.length > 0 && (
                <div className="sticky top-[56px] z-10 bg-[#111113]/95 backdrop-blur-sm border-b border-white/8">
                    <div className="px-4 py-2.5 max-w-3xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {sections.map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => scrollToSection(sec)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                                        activeSection === sec
                                            ? 'bg-[#f5c842] text-black'
                                            : 'bg-white/8 text-white/50 hover:text-white hover:bg-white/15'
                                    }`}
                                >
                                    {sec === 'specials' ? '... Specials' : sec}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Menu content */}
            <div className="px-4 py-6 space-y-10 pb-36 max-w-3xl mx-auto">

                {/* No menu */}
                {r.isPartner && menuItems.length === 0 && specials.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🍽️</p>
                        <p className="text-white/50 text-sm">Menu coming soon</p>
                        <p className="text-white/30 text-xs mt-1">The restaurant hasn't published their menu yet.</p>
                    </div>
                )}

                {/* Chef Specials */}
                {specials.length > 0 && (
                    <div ref={el => { sectionRefs.current['specials'] = el; }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-white/8" />
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f5c842]">... Chef Specials</h3>
                            <div className="flex-1 h-px bg-white/8" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {specials.map(s => (
                                <ChefSpecialCard
                                    key={s.id}
                                    special={s}
                                    qty={getQty(s.id)}
                                    onAdd={() => addToCart(s.id, s.name, s.priceCents, s.imageEmoji || '⭐')}
                                    onRemove={() => removeFromCart(s.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu categories */}
                {cats.map(cat => (
                    <div key={cat} ref={el => { sectionRefs.current[cat] = el; }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-white/8" />
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">{cat}</h3>
                            <div className="flex-1 h-px bg-white/8" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {grouped[cat].map(item => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    qty={getQty(item.id)}
                                    onAdd={() => addToCart(item.id, item.name, item.priceCents,
                                        item.tags?.find(t => /^\p{Emoji}/u.test(t)) || '🍽️')}
                                    onRemove={() => removeFromCart(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Non-partner: show info block */}
                {!r.isPartner && <InfoBody r={r} />}
            </div>

            {/* Floating cart bar */}
            {cartCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-20 p-4 pt-8 bg-gradient-to-t from-[#111113] via-[#111113]/95 to-transparent">
                    <div className="max-w-3xl mx-auto">
                        <button
                            onClick={() => setShowCheckout(true)}
                            className="w-full flex items-center justify-between gap-3 py-4 px-5 rounded-2xl bg-[#f5c842] shadow-xl hover:bg-yellow-300 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-black text-xs font-bold">{cartCount}</span>
                                <span className="text-black font-bold text-sm">View Order</span>
                            </span>
                            <span className="text-black font-bold">${(cartTotal / 100).toFixed(2)}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Checkout modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCheckout(false)}>
                    <div
                        className="bg-[#1c1c1e] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h3 className="text-white font-bold text-base">Your Order</h3>
                                <p className="text-white/40 text-xs">{r.name}</p>
                            </div>
                            <button onClick={() => setShowCheckout(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                            {/* Cart items */}
                            <div className="space-y-2">
                                {cart.map(c => (
                                    <div key={c.id} className="flex items-center gap-3 bg-[#111113] rounded-xl p-3">
                                        <span className="text-xl flex-shrink-0">{c.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium leading-snug truncate">{c.name}</p>
                                            <p className="text-[#f5c842] text-xs font-semibold">${((c.priceCents * c.qty) / 100).toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => removeFromCart(c.id)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                                <Icon name="minus" className="w-3 h-3" />
                                            </button>
                                            <span className="text-white font-bold text-sm w-4 text-center">{c.qty}</span>
                                            <button onClick={() => addToCart(c.id, c.name, c.priceCents, c.emoji)} className="w-7 h-7 rounded-full bg-[#f5c842] flex items-center justify-center text-black hover:bg-yellow-300 transition-colors">
                                                <Icon name="add" className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between py-3 border-t border-white/8">
                                <span className="text-white/60 text-sm">Total</span>
                                <span className="text-[#f5c842] font-bold text-lg">${(cartTotal / 100).toFixed(2)}</span>
                            </div>

                            {/* Table number */}
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                                    Table Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={tableNum}
                                    onChange={e => setTableNum(e.target.value)}
                                    placeholder="Enter the number shown on your table"
                                    className="w-full px-4 py-3 rounded-xl bg-[#111113] border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#f5c842]/50"
                                />
                            </div>

                            {/* Special instructions (auto-filled with allergens) */}
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                                    Special Instructions
                                    {autoNote && <span className="ml-1.5 text-[#f5c842]/70 normal-case font-normal">· From your Liora profile</span>}
                                </label>
                                <textarea
                                    value={specialInstructions}
                                    onChange={e => setSpecialInstructions(e.target.value)}
                                    placeholder="Allergies, dietary needs, preferences..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-[#111113] border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#f5c842]/50 resize-none"
                                />
                            </div>
                        </div>

                        <div className="px-5 py-4 border-t border-white/8 flex-shrink-0">
                            <button
                                onClick={placeOrder}
                                disabled={!tableNum.trim()}
                                className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${tableNum.trim() ? 'bg-[#f5c842] text-black hover:bg-yellow-300 shadow-lg' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                            >
                                Place Order · ${(cartTotal / 100).toFixed(2)}
                            </button>
                            {!tableNum.trim() && (
                                <p className="text-white/30 text-xs text-center mt-2">Enter your table number to continue</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoBody({ r }: { r: Restaurant }) {
    return (
        <div className="space-y-5">
            {r.description && (
                <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">About</p>
                    <p className="text-sm text-white/60 leading-relaxed">{r.description}</p>
                </div>
            )}
            {r.features.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Features & Amenities</p>
                    <div className="flex flex-wrap gap-2">
                        {r.features.map(f => (
                            <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/8 text-white/60 text-xs font-medium border border-white/10">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Contact & Hours</p>
                {r.address && (
                    <div className="flex items-start gap-2.5 text-sm text-white/50">
                        <Icon name="map-pin" className="w-4 h-4 text-[#f5c842] mt-0.5 flex-shrink-0" />
                        <span>{r.address}</span>
                    </div>
                )}
                {r.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-white/50">
                        <Icon name="phone" className="w-4 h-4 text-[#f5c842] flex-shrink-0" />
                        <a href={`tel:${r.phone}`} className="hover:text-[#f5c842] transition-colors">{r.phone}</a>
                    </div>
                )}
                {r.website && (
                    <div className="flex items-center gap-2.5 text-sm text-white/50">
                        <Icon name="link" className="w-4 h-4 text-[#f5c842] flex-shrink-0" />
                        <span className="truncate">{r.website}</span>
                    </div>
                )}
                {r.hours && (
                    <div className="flex items-center gap-2.5 text-sm text-white/50">
                        <Icon name="clock" className="w-4 h-4 text-[#f5c842] flex-shrink-0" />
                        <span>{r.hours}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Add Restaurant Modal -----------------------------------------------------
const EMPTY_FORM = {
    name: '', cuisine: 'American', zip: '', address: '', phone: '', website: '',
    priceRange: '$$' as Restaurant['priceRange'], rating: 4.0,
    features: ['Dine-in'] as string[], description: '', hours: '',
    imageEmoji: '🍽️',
};

function AddRestaurantModal({ onClose, onAdded }: { onClose: () => void; onAdded: (r: Restaurant) => void }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState<{ name?: string; zip?: string }>({});

    const toggleFeature = (f: string) => {
        setForm(prev => ({
            ...prev,
            features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f],
        }));
    };

    const validate = () => {
        const e: { name?: string; zip?: string } = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.zip.trim()) e.zip = 'ZIP code is required';
        else if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) e.zip = 'Enter a valid US ZIP code';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const newR: Restaurant = {
            id: uid(), ...form, zip: form.zip.trim(), name: form.name.trim(), addedAt: Date.now(),
        };
        const all = readRestaurants();
        all.unshift(newR);
        writeRestaurants(all);
        onAdded(newR);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-cream-50 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-forest-900 px-5 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-base font-display font-semibold text-cream-50">Add Restaurant</h2>
                        <p className="text-xs text-cream-300">Share a great place with the Liora community</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-cream-200">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
                    {/* Emoji picker */}
                    <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Choose an icon</p>
                        <div className="flex flex-wrap gap-2">
                            {EMOJIS.map(e => (
                                <button
                                    key={e}
                                    onClick={() => setForm(f => ({ ...f, imageEmoji: e }))}
                                    className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${form.imageEmoji === e ? 'bg-brand-400/20 ring-2 ring-brand-400' : 'bg-white border border-cream-200 hover:bg-cream-100'}`}
                                >{e}</button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Restaurant Name <span className="text-red-400">*</span></label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. The Golden Fork"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30 ${errors.name ? 'border-red-300' : 'border-cream-200'}`}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* ZIP + Cuisine row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">ZIP Code <span className="text-red-400">*</span></label>
                            <input
                                value={form.zip}
                                onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
                                placeholder="e.g. 10001"
                                maxLength={10}
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30 ${errors.zip ? 'border-red-300' : 'border-cream-200'}`}
                            />
                            {errors.zip && <p className="text-red-400 text-xs mt-1">{errors.zip}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Cuisine</label>
                            <select
                                value={form.cuisine}
                                onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                            >
                                {CUISINES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Price + Rating row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Price Range</label>
                            <div className="flex gap-1.5">
                                {(['$', '$$', '$$$', '$$$$'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setForm(f => ({ ...f, priceRange: p }))}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${form.priceRange === p ? 'bg-brand-400 text-white border-brand-400' : 'bg-white border-cream-200 text-stone-500 hover:border-brand-400/50'}`}
                                    >{p}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Rating: {form.rating.toFixed(1)} ⭐</label>
                            <input
                                type="range" min={1} max={5} step={0.1}
                                value={form.rating}
                                onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) }))}
                                className="w-full accent-brand-400 mt-2"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Address</label>
                        <input
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            placeholder="123 Main St, City, State ZIP"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                        />
                    </div>

                    {/* Phone + Website row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Phone</label>
                            <input
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="(555) 000-0000"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Website</label>
                            <input
                                value={form.website}
                                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                                placeholder="restaurant.com"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                            />
                        </div>
                    </div>

                    {/* Hours */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Hours</label>
                        <input
                            value={form.hours}
                            onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                            placeholder="e.g. Mon-Sun 11am-10pm"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Tell guests what makes this place special..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none"
                        />
                    </div>

                    {/* Features */}
                    <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Features & Amenities</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_FEATURES.map(f => (
                                <button
                                    key={f}
                                    onClick={() => toggleFeature(f)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.features.includes(f) ? 'bg-forest-900 text-cream-50 border-forest-900' : 'bg-white text-stone-500 border-cream-200 hover:border-forest-900/40'}`}
                                >{f}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-cream-200 flex gap-3 bg-cream-50 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm font-semibold text-stone-500 hover:bg-cream-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold transition-colors shadow-sm">
                        Add Restaurant
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Restaurant Card ----------------------------------------------------------
function RestaurantCard({ r, onClick }: { r: Restaurant; onClick: () => void }) {
    const topFeatures = r.features.slice(0, 4);
    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-white border border-cream-200 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300/60 transition-all duration-200 group"
        >
            <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0 mt-0.5">{r.imageEmoji}</span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-stone-800 text-sm leading-snug group-hover:text-brand-400 transition-colors truncate">{r.name}</h3>
                            {r.isPartner && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-900 text-cream-50 text-[9px] font-bold uppercase tracking-wider">
                                    <Icon name="verified" className="w-2.5 h-2.5" /> Partner
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-bold text-brand-400 flex-shrink-0">{r.priceRange}</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{r.cuisine}{r.zip ? ` · ZIP ${r.zip}` : ''}</p>
                    <div className="mt-1.5">
                        {r.rating > 0 ? <StarRating rating={r.rating} /> : <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">New on Liora</span>}
                    </div>
                    {r.description && (
                        <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">{r.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {r.features.includes('Dine-in') && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-[#f5c842]/15 text-[#8a6f00] font-bold border border-[#f5c842]/40">
                                <Icon name="restaurant_menu" className="w-3 h-3" /> Dine-in
                            </span>
                        )}
                        {topFeatures.filter(f => f !== 'Dine-in').map(f => (
                            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-cream-100/60 text-stone-400 font-medium">{f}</span>
                        ))}
                        {r.features.filter(f => f !== 'Dine-in').length > 3 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-400 font-medium">+{r.features.filter(f => f !== 'Dine-in').length - 3} more</span>
                        )}
                    </div>
                </div>
                <Icon name="chevron-right" className="w-4 h-4 text-stone-300 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-1" />
            </div>
        </button>
    );
}

// --- Main Page ----------------------------------------------------------------
export default function RestaurantsPage({ setView }: { setView?: (v: string) => void }) {
    const [all, setAll] = useState<Restaurant[]>([]);
    const [zipQuery, setZipQuery] = useState('');
    const [cuisineFilter, setCuisineFilter] = useState('All');
    const [showAdd, setShowAdd] = useState(false);
    const [selected, setSelected] = useState<Restaurant | null>(null);

    const session = useSession();
    const { profile } = useUserProfile();

    // Build auto-note from saved allergens/avoid list
    const autoNote = React.useMemo(() => {
        const parts = [
            ...(profile?.profile?.allergens ?? []),
            ...(profile?.profile?.avoid ?? []),
        ].filter(Boolean);
        return parts.length > 0 ? `Allergies/Avoid: ${parts.join(', ')}` : '';
    }, [profile]);

    useEffect(() => {
        // Remove any previously seeded demo restaurants (ids start with 'demo-')
        const existing = readRestaurants();
        const cleaned = existing.filter(r => !r.id.startsWith('demo-'));
        if (cleaned.length !== existing.length) writeRestaurants(cleaned);

        // Merge in any restaurants registered via the restaurant portal
        const portalRestaurants = db_getAllRestaurants()
            .filter(r => r.name) // only include restaurants that have been set up
            .map(portalRestaurantToDisplay);

        // Merge: portal restaurants first, then public ones (deduplicate by id)
        const merged = [
            ...portalRestaurants,
            ...cleaned.filter(r => !portalRestaurants.some(p => p.id === r.id)),
        ];
        setAll(merged);
    }, []);

    const handleAdded = useCallback((r: Restaurant) => {
        setAll(prev => [r, ...prev]);
        setShowAdd(false);
        setSelected(r);
    }, []);

    // When a restaurant is selected, show the full restaurant page (not a modal)
    if (selected) {
        return (
            <RestaurantPage
                r={selected}
                onBack={() => setSelected(null)}
                autoNote={autoNote}
                userProfile={profile}
                customerName={session?.user?.name ?? session?.user?.email ?? 'Guest'}
                customerEmail={session?.user?.email}
                onDineIn={setView ? () => setView('ai_waiter') : undefined}
            />
        );
    }

    const filtered = all.filter(r => {
        const zipMatch = !zipQuery.trim() || r.zip.startsWith(zipQuery.trim());
        const cuisineMatch = cuisineFilter === 'All' || r.cuisine === cuisineFilter;
        return zipMatch && cuisineMatch;
    });

    const availableCuisines = ['All', ...Array.from(new Set(all.map(r => r.cuisine))).sort()];

    return (
        <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 animate-slide-up stagger-1">
                <h1 className="font-display text-2xl font-semibold text-stone-800">Restaurants</h1>
                <p className="text-sm text-stone-500 mt-1">
                    {all.length} place{all.length !== 1 ? 's' : ''} in the Liora directory
                </p>
            </div>

            {/* Search + Add bar */}
            <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Icon name="map-pin" className="w-4 h-4 text-stone-400" />
                    </div>
                    <input
                        type="text"
                        value={zipQuery}
                        onChange={e => setZipQuery(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="Search by ZIP code..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400/50"
                    />
                    {zipQuery && (
                        <button onClick={() => setZipQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600">
                            <Icon name="x" className="w-4 h-4" />
                        </button>
                    )}
                </div>

            </div>

            {/* Cuisine filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-1 px-1 animate-slide-up stagger-2">
                {availableCuisines.map(c => (
                    <button
                        key={c}
                        onClick={() => setCuisineFilter(c)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            cuisineFilter === c
                                ? 'bg-forest-900 text-cream-50 shadow-sm scale-105'
                                : 'bg-white border border-cream-200 text-stone-500 hover:border-amber-400/50 hover:text-amber-700 hover:bg-amber-50/50'
                        }`}
                    >{c}</button>
                ))}
            </div>

            {/* Results */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-4xl mb-4">🍽️</p>
                    <p className="font-semibold text-stone-700">
                        {zipQuery ? `No restaurants found for ZIP ${zipQuery}` : 'No restaurants yet'}
                    </p>
                    <p className="text-sm text-stone-400 mt-1 mb-6">
                        {zipQuery ? 'Try a different ZIP code' : 'No restaurants listed yet — check back soon!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {zipQuery && (
                        <p className="text-xs text-stone-500 font-medium">
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for ZIP {zipQuery}
                        </p>
                    )}
                    {filtered.map(r => (
                        <RestaurantCard key={r.id} r={r} onClick={() => setSelected(r)} />
                    ))}
                </div>
            )}

            {/* Modals */}
            {showAdd && <AddRestaurantModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
        </div>
    );
}
