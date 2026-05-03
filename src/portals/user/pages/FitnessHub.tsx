import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';
// icons used: bolt, play_circle, fitness_center, restaurant_menu, self_improvement,
//             directions_run, monitor_heart, local_fire_department, star, thumb_up,
//             check_circle, smart_toy
import { View } from '../../../../types';

interface FitnessHubProps {
    setView?: (view: View) => void;
}

const CATEGORIES = [
    {
        icon: 'fitness_center',
        label: 'Workouts',
        desc: 'Tailored routines for every level',
        color: 'from-rose-500 to-pink-600',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-600',
        emoji: '🏋️',
        coming: false,
    },
    {
        icon: 'restaurant_menu',
        label: 'Nutrition',
        desc: 'Fuel your body with smart meal plans',
        color: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-600',
        emoji: '🥗',
        coming: false,
    },
    {
        icon: 'self_improvement',
        label: 'Mindfulness',
        desc: 'Guided meditation & stress relief',
        color: 'from-violet-500 to-purple-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-600',
        emoji: '🧘',
        coming: true,
    },
    {
        icon: 'directions_run',
        label: 'Cardio',
        desc: 'Running, cycling & HIIT sessions',
        color: 'from-green-500 to-emerald-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        emoji: '🏃',
        coming: true,
    },
    {
        icon: 'monitor_heart',
        label: 'Health Tracking',
        desc: 'Sync with your wearables & apps',
        color: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        emoji: '❤️',
        coming: true,
    },
    {
        icon: 'local_fire_department',
        label: 'Calorie Log',
        desc: 'Track every meal with AI precision',
        color: 'from-red-500 to-rose-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-600',
        emoji: '🔥',
        coming: false,
    },
];

const STATS = [
    { value: '12K+', label: 'Workouts Logged', icon: 'fitness_center', color: 'text-rose-500' },
    { value: '4.8★', label: 'User Rating',      icon: 'star',           color: 'text-amber-500' },
    { value: '200+', label: 'Meal Plans',        icon: 'restaurant_menu', color: 'text-green-500' },
    { value: '98%',  label: 'Satisfaction',      icon: 'thumb_up',       color: 'text-blue-500' },
];

const DAILY_TIPS = [
    { tip: 'Drink 8 glasses of water today 💧', tag: 'Hydration' },
    { tip: 'A 20-min walk burns ~100 calories 🚶', tag: 'Movement' },
    { tip: 'Sleep 7–9 hours for optimal recovery 😴', tag: 'Recovery' },
];

export default function FitnessHub({ setView }: FitnessHubProps) {
    const [activeTip, setActiveTip] = useState(0);

    return (
        <div className="min-h-full bg-cream-50 pb-24">

            {/* Hero Banner */}
            <div
                className="relative overflow-hidden px-6 pt-10 pb-14"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
            >
                <div className="relative z-10 max-w-xl">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 animate-fade-in"
                        style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', animationDelay: '60ms', opacity: 0, animationFillMode: 'forwards' }}
                    >
                        <Icon name="bolt" size={12} /> Fitness & Wellness Hub
                    </div>
                    <h1
                        className="text-3xl font-lora font-bold text-white mb-2 animate-fade-in"
                        style={{ animationDelay: '140ms', opacity: 0, animationFillMode: 'forwards' }}
                    >
                        Move. Nourish. <span style={{ color: '#f87171' }}>Thrive.</span>
                    </h1>
                    <p
                        className="text-white/60 text-sm leading-relaxed animate-fade-in"
                        style={{ animationDelay: '220ms', opacity: 0, animationFillMode: 'forwards' }}
                    >
                        Your AI-powered fitness companion — workouts, meal plans, and wellness insights all in one place.
                    </p>

                    {/* CTA row */}
                    <div
                        className="flex gap-3 mt-6 animate-fade-in"
                        style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}
                    >
                        {setView && (
                            <button
                                onClick={() => setView('calorie_log')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                                style={{ background: '#f87171' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#ef4444')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#f87171')}
                            >
                                <Icon name="local_fire_department" size={16} /> Log Calories
                            </button>
                        )}
                        <button
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white border border-white/20 hover:bg-white/10 hover:-translate-y-0.5 transition-all"
                        >
                            <Icon name="play_circle" size={16} /> Start Workout
                        </button>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'rgba(248,113,113,0.07)' }} />
                <div className="absolute top-20 -right-4 w-28 h-28 rounded-full pointer-events-none" style={{ background: 'rgba(248,113,113,0.05)' }} />
                <div className="absolute bottom-0 right-16 text-6xl opacity-10 pointer-events-none select-none">💪</div>
            </div>

            <div className="px-4 mt-6 space-y-8 max-w-2xl mx-auto">

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 animate-slide-up stagger-1">
                    {STATS.map((s, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-cream-200 shadow-sm p-3 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group"
                        >
                            <Icon name={s.icon} size={18} className={`mx-auto mb-1.5 ${s.color} group-hover:scale-110 transition-transform`} />
                            <p className={`font-lora font-bold text-base ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider leading-tight mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Daily Tip Carousel */}
                <section className="animate-slide-up stagger-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Daily Tip</h2>
                    <div
                        className="rounded-2xl p-5 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
                    >
                        <div className="flex items-start gap-4 relative z-10">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                                style={{ background: 'rgba(248,113,113,0.2)' }}
                            >
                                💡
                            </div>
                            <div className="flex-1">
                                <span
                                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block"
                                    style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}
                                >
                                    {DAILY_TIPS[activeTip].tag}
                                </span>
                                <p className="text-white text-sm font-medium leading-relaxed">{DAILY_TIPS[activeTip].tip}</p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 mt-4 justify-center relative z-10">
                            {DAILY_TIPS.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTip(i)}
                                    className="transition-all duration-200"
                                    style={{
                                        width: activeTip === i ? '20px' : '6px',
                                        height: '6px',
                                        borderRadius: '99px',
                                        background: activeTip === i ? '#f87171' : 'rgba(255,255,255,0.25)',
                                    }}
                                />
                            ))}
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 pointer-events-none select-none">🏋️</div>
                    </div>
                </section>

                {/* Category cards */}
                <section className="animate-slide-up stagger-3">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Explore Categories</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {CATEGORIES.map((cat, i) => (
                            <button
                                key={i}
                                onClick={() => cat.label === 'Calorie Log' && setView ? setView('calorie_log') : undefined}
                                className={`relative text-left bg-white rounded-2xl border ${cat.border} shadow-sm p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 active:scale-95 group overflow-hidden ${cat.coming ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {cat.coming && (
                                    <span className="absolute top-3 right-3 text-[8px] font-bold uppercase tracking-widest bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
                                        Soon
                                    </span>
                                )}
                                <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform duration-200`}>
                                    {cat.emoji}
                                </div>
                                <p className={`font-bold text-sm text-stone-800 group-hover:${cat.text} transition-colors`}>{cat.label}</p>
                                <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">{cat.desc}</p>
                                <div className={`absolute -bottom-4 -right-4 text-6xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none select-none`}>
                                    {cat.emoji}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Today's Plan */}
                <section className="animate-slide-up stagger-4">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Today's Plan</h2>
                    <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                        {[
                            { time: '7:00 AM', activity: 'Morning Run',        detail: '30 min · ~300 cal',  icon: 'directions_run',  done: true  },
                            { time: '12:30 PM', activity: 'Healthy Lunch',     detail: 'Grilled Salmon Bowl', icon: 'restaurant_menu', done: false },
                            { time: '6:00 PM', activity: 'Strength Training',  detail: '45 min · Full Body',  icon: 'fitness_center',  done: false },
                            { time: '9:00 PM', activity: 'Stretch & Wind Down', detail: '15 min · Yoga',     icon: 'self_improvement', done: false },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-4 px-5 py-3.5 border-b border-cream-100 last:border-0 hover:bg-cream-50/60 hover:pl-6 transition-all duration-150 group cursor-default ${item.done ? 'opacity-50' : ''}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${item.done ? 'bg-green-100' : 'bg-cream-100'}`}>
                                    <Icon name={item.done ? 'check_circle' : item.icon} size={18} className={item.done ? 'text-green-500' : 'text-stone-500'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold transition-colors ${item.done ? 'line-through text-stone-400' : 'text-stone-800 group-hover:text-rose-600'}`}>{item.activity}</p>
                                    <p className="text-[11px] text-stone-400">{item.detail}</p>
                                </div>
                                <span className="text-[10px] font-bold text-stone-400 flex-shrink-0">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Coming Soon Banner */}
                <section className="animate-slide-up stagger-5">
                    <div
                        className="rounded-3xl p-6 flex items-center gap-4 group hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
                    >
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform"
                            style={{ background: 'rgba(255,255,255,0.15)' }}
                        >
                            🤖
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-lora font-bold text-base leading-snug">AI Personal Trainer</p>
                            <p className="text-white/70 text-xs mt-0.5">Custom workouts, form corrections & live coaching — launching soon.</p>
                        </div>
                        <div
                            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
                        >
                            Soon
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
