import React, { useState, useMemo } from 'react';
import { Icon } from '../../../../components/Icon';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { usePastOrders } from '../../../../hooks/usePastOrders';
import { useCalorieData } from '../../../../hooks/useCalorieData';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSession } from '../../../auth/useSession';
import { Spinner } from '../../../../components/Spinner';
import { View, PastOrder } from '../../../../types';
import { getAuth } from '../../../auth';
import { db_listHotels, db_listBookings, type DemoHotelBooking, type DemoHotel } from '../../../hotelDb';

interface UserProfileProps {
    setView: (view: View) => void;
}

// ---------------------------------------------------------------------------
// Helpers — coercion + insight derivation
// ---------------------------------------------------------------------------

const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return (v as unknown[]).map(String).join(', ');
  if (v !== null && typeof v === 'object') {
    const vals = Object.values(v as Record<string, unknown>).filter(x => typeof x === 'string' || typeof x === 'number');
    return vals.map(String).join(', ');
  }
  return v == null ? '' : String(v);
};

const parseMoney = (s: string): number => {
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
};

/** Tiny dictionary mapping menu-item keywords to a cuisine bucket. Used to
 *  compute the customer's *real* top cuisines from the names of dishes they've
 *  actually ordered, instead of just the cuisines they ticked at onboarding. */
const CUISINE_KEYWORDS: Array<{ cuisine: string; words: string[] }> = [
  { cuisine: 'Italian',  words: ['pizza','pasta','risotto','lasagn','tiramisu','bruschetta','burrata','margherita','rigatoni','spaghetti','carbonar','ravioli','panna cotta','prosciutto','focaccia'] },
  { cuisine: 'Japanese', words: ['sushi','ramen','tempura','sashimi','miso','udon','teriyaki','katsu','onigiri','wagyu','dashi','yakitori'] },
  { cuisine: 'Mexican',  words: ['taco','burrito','quesadilla','enchilada','nacho','guacamole','salsa','fajita','churro','tostada'] },
  { cuisine: 'Indian',   words: ['curry','tikka','masala','biryani','naan','samosa','dosa','tandoor','paneer','korma','vindaloo','chutney'] },
  { cuisine: 'Chinese',  words: ['dumpling','dim sum','noodle','wonton','chow mein','szechuan','peking','kung pao','bao','char siu'] },
  { cuisine: 'Thai',     words: ['pad thai','tom yum','green curry','red curry','satay','som tam','massaman'] },
  { cuisine: 'French',   words: ['croissant','baguette','escargot','coq au vin','ratatouille','crème','souffl','confit','foie','bordelaise'] },
  { cuisine: 'Mediterranean', words: ['hummus','falafel','shawarma','kebab','tabbouleh','tzatziki','baba ganoush','pita','gyro','dolma'] },
  { cuisine: 'American', words: ['burger','steak','bbq','ribs','wings','mac and cheese','fries','hot dog','sandwich','milkshake'] },
  { cuisine: 'Seafood',  words: ['lobster','shrimp','prawn','oyster','salmon','tuna','sea bass','cod','crab','scallop'] },
  { cuisine: 'Dessert',  words: ['cake','brownie','ice cream','gelato','cheesecake','pie','tart','pudding','mousse'] },
  { cuisine: 'Coffee',   words: ['espresso','latte','cappuccino','americano','macchiato','cold brew','flat white'] },
];

const detectCuisine = (itemName: string): string | null => {
  const n = itemName.toLowerCase();
  for (const { cuisine, words } of CUISINE_KEYWORDS) {
    if (words.some(w => n.includes(w))) return cuisine;
  }
  return null;
};

const greetingFor = (name: string): { hello: string; emoji: string; sub: string } => {
  const h = new Date().getHours();
  const first = (name || '').trim().split(/\s+/)[0] || 'there';
  if (h < 5)  return { hello: `Up late, ${first}?`,    emoji: '🌙', sub: 'Midnight cravings calling? We\'ve got you.' };
  if (h < 11) return { hello: `Good morning, ${first}`,emoji: '☀️', sub: 'Let\'s find something delicious for today.' };
  if (h < 14) return { hello: `Hungry already, ${first}?`, emoji: '🥐', sub: 'Lunch is calling — your usual or something new?' };
  if (h < 17) return { hello: `Afternoon, ${first}`,   emoji: '☕', sub: 'A coffee, a pastry, or planning dinner?' };
  if (h < 21) return { hello: `Evening, ${first}`,     emoji: '🍷', sub: 'Time to unwind with something memorable.' };
  return       { hello: `Welcome back, ${first}`,      emoji: '🌃', sub: 'A late bite or a stay nearby?' };
};

const fmtMoney = (n: number): string =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(n < 10 ? 2 : 0)}`;

const daysSince = (ts: number): number => Math.floor((Date.now() - ts) / 86400000);

// ---------------------------------------------------------------------------
// Insight derivation — single useMemo will call this with all raw data
// ---------------------------------------------------------------------------

interface DerivedInsights {
  totalVisits: number;
  totalSpent: number;
  avgPerVisit: number;
  memberDays: number;
  firstOrderDate: number | null;
  topCuisines: Array<{ cuisine: string; count: number; pct: number }>;
  topRestaurant: { name: string; visits: number; lastVisit: number } | null;
  weeklySpend: number[];                          // last 8 weeks, oldest → newest
  timeOfDay: { lunch: number; dinner: number; lateNight: number };
  totalStays: number;
  totalNights: number;
  topHotel: { hotel: DemoHotel; bookings: number } | null;
  upcomingStay: DemoHotelBooking | null;
  cuisinesTriedCount: number;
  newCuisineSuggestion: string | null;
  missedRestaurant: { name: string; daysAgo: number } | null;
  wellness: { loggedDays: number; avgCalories: number; goal: number; pctOnGoal: number } | null;
  achievements: Array<{ id: string; label: string; icon: string; earned: boolean; progress: string }>;
}

const deriveInsights = (
  pastOrders: PastOrder[],
  bookings: Array<DemoHotelBooking & { hotel: DemoHotel }>,
  profileCuisines: string[],
  calorieLogs: Record<string, { totals: { calories: number } }>,
  calorieGoal: number,
): DerivedInsights => {
  // ----- Orders ------
  const totalVisits = pastOrders.length;
  const totalSpent = pastOrders.reduce((s, o) => s + parseMoney(o.total), 0);
  const avgPerVisit = totalVisits ? totalSpent / totalVisits : 0;

  // Find oldest order date for "member since"
  const orderTimes = pastOrders.map(o => new Date(o.date).getTime()).filter(t => !isNaN(t));
  const firstOrderDate = orderTimes.length ? Math.min(...orderTimes) : null;
  const memberDays = firstOrderDate ? daysSince(firstOrderDate) : 0;

  // Top cuisines from actual ordered item names
  const cuisineCounts = new Map<string, number>();
  pastOrders.forEach(o => {
    o.items?.forEach(it => {
      const c = detectCuisine(it.name);
      if (c) cuisineCounts.set(c, (cuisineCounts.get(c) || 0) + 1);
    });
  });
  const totalCuisineHits = Array.from(cuisineCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const topCuisines = Array.from(cuisineCounts.entries())
    .map(([cuisine, count]) => ({ cuisine, count, pct: Math.round((count / totalCuisineHits) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Top restaurant by visit count
  const restCounts = new Map<string, { visits: number; lastVisit: number }>();
  pastOrders.forEach(o => {
    const cur = restCounts.get(o.restaurantName) || { visits: 0, lastVisit: 0 };
    cur.visits += 1;
    const t = new Date(o.date).getTime();
    if (!isNaN(t) && t > cur.lastVisit) cur.lastVisit = t;
    restCounts.set(o.restaurantName, cur);
  });
  const topRestEntry = Array.from(restCounts.entries()).sort((a, b) => b[1].visits - a[1].visits)[0];
  const topRestaurant = topRestEntry ? { name: topRestEntry[0], ...topRestEntry[1] } : null;

  // Weekly spend — last 8 weeks
  const weekMs = 7 * 86400000;
  const weeklySpend = Array(8).fill(0) as number[];
  pastOrders.forEach(o => {
    const t = new Date(o.date).getTime();
    if (isNaN(t)) return;
    const weeksAgo = Math.floor((Date.now() - t) / weekMs);
    if (weeksAgo >= 0 && weeksAgo < 8) weeklySpend[7 - weeksAgo] += parseMoney(o.total);
  });

  // Time-of-day pattern (uses hour from order date if present)
  const timeOfDay = { lunch: 0, dinner: 0, lateNight: 0 };
  pastOrders.forEach(o => {
    const d = new Date(o.date);
    if (isNaN(d.getTime())) return;
    const h = d.getHours();
    if (h >= 11 && h < 16) timeOfDay.lunch += 1;
    else if (h >= 16 && h < 22) timeOfDay.dinner += 1;
    else timeOfDay.lateNight += 1;
  });

  // ----- Hotel stays ------
  const totalStays = bookings.length;
  const totalNights = bookings.reduce((s, b) => s + (b.nightsCount || 0), 0);
  const hotelCounts = new Map<string, number>();
  bookings.forEach(b => hotelCounts.set(b.hotel.id, (hotelCounts.get(b.hotel.id) || 0) + 1));
  const topHotelId = Array.from(hotelCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const topHotel = topHotelId
    ? { hotel: bookings.find(b => b.hotel.id === topHotelId[0])!.hotel, bookings: topHotelId[1] }
    : null;
  const upcomingStay = bookings
    .filter(b => new Date(b.checkIn).getTime() > Date.now() && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0] || null;

  // ----- Discovery suggestion ------
  const triedCuisines = new Set(cuisineCounts.keys());
  const cuisinesTriedCount = triedCuisines.size;
  const candidates = (profileCuisines || []).filter(c => !triedCuisines.has(c));
  const fallbackPool = ['Japanese','Thai','Mediterranean','French','Indian','Mexican'].filter(c => !triedCuisines.has(c));
  const newCuisineSuggestion = candidates[0] || fallbackPool[0] || null;

  // Restaurant the customer hasn't been back to in a while
  const missedEntry = Array.from(restCounts.entries())
    .map(([name, info]) => ({ name, daysAgo: daysSince(info.lastVisit), visits: info.visits }))
    .filter(r => r.visits >= 2 && r.daysAgo >= 14)
    .sort((a, b) => b.daysAgo - a.daysAgo)[0];
  const missedRestaurant = missedEntry ? { name: missedEntry.name, daysAgo: missedEntry.daysAgo } : null;

  // ----- Wellness ------
  const logEntries = Object.entries(calorieLogs);
  const wellness = logEntries.length
    ? (() => {
        const cals = logEntries.map(([, v]) => v.totals?.calories || 0);
        const avg = cals.reduce((a, b) => a + b, 0) / cals.length;
        const onGoal = cals.filter(c => c > 0 && c <= calorieGoal).length;
        return {
          loggedDays: logEntries.length,
          avgCalories: Math.round(avg),
          goal: calorieGoal,
          pctOnGoal: Math.round((onGoal / logEntries.length) * 100),
        };
      })()
    : null;

  // ----- Achievements ------
  const achievements = [
    { id: 'first_bite',  label: 'First Bite',       icon: 'utensils-crossed', earned: totalVisits >= 1,  progress: `${Math.min(totalVisits, 1)}/1 visits` },
    { id: 'regular',     label: 'The Regular',       icon: 'repeat',           earned: totalVisits >= 5,  progress: `${Math.min(totalVisits, 5)}/5 visits` },
    { id: 'connoisseur', label: 'Connoisseur',       icon: 'crown',            earned: totalVisits >= 20, progress: `${Math.min(totalVisits, 20)}/20 visits` },
    { id: 'explorer',    label: 'Globe Trotter',     icon: 'compass',          earned: cuisinesTriedCount >= 5, progress: `${Math.min(cuisinesTriedCount, 5)}/5 cuisines` },
    { id: 'date_night',  label: 'Date Night Pro',    icon: 'heart',            earned: totalStays >= 1,   progress: `${Math.min(totalStays, 1)}/1 stay` },
    { id: 'wellness',    label: 'Mindful Eater',     icon: 'sparkles',         earned: wellness ? wellness.loggedDays >= 7 : false, progress: wellness ? `${Math.min(wellness.loggedDays, 7)}/7 days` : '0/7 days' },
  ];

  return {
    totalVisits, totalSpent, avgPerVisit, memberDays, firstOrderDate,
    topCuisines, topRestaurant, weeklySpend, timeOfDay,
    totalStays, totalNights, topHotel, upcomingStay,
    cuisinesTriedCount, newCuisineSuggestion, missedRestaurant,
    wellness, achievements,
  };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UserProfile: React.FC<UserProfileProps> = ({ setView }) => {
  const { profile, updateAiPreferences, isLoading: profileLoading } = useUserProfile();
  const { pastOrders, isLoading: ordersLoading } = usePastOrders();
  const { isPremium } = useSubscription();
  const { logs: calorieLogs, goal: calorieGoal } = useCalorieData();
  const session = useSession();
  const userEmail = session?.user?.email ?? null;
  const [activeTab, setActiveTab] = useState<'foryou' | 'activity' | 'prefs' | 'account'>('foryou');

  const auth = getAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [secMsg, setSecMsg] = useState('');
  const [secErr, setSecErr] = useState('');

  // Pull all hotel bookings belonging to this guest (across every hotel)
  const myBookings = useMemo(() => {
    if (!userEmail) return [];
    const all = db_listHotels();
    const out: Array<DemoHotelBooking & { hotel: DemoHotel }> = [];
    all.forEach(h => {
      db_listBookings(h.id)
        .filter(b => (b.guestEmail || '').toLowerCase() === userEmail.toLowerCase())
        .forEach(b => out.push({ ...b, hotel: h }));
    });
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }, [userEmail]);

  const insights = useMemo(() => {
    const profCuisines = Array.isArray(profile?.profile?.cuisines) ? (profile!.profile.cuisines as string[]) : [];
    return deriveInsights(pastOrders, myBookings, profCuisines, calorieLogs, calorieGoal);
  }, [pastOrders, myBookings, profile, calorieLogs, calorieGoal]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErr(''); setSecMsg('');
    if (newPassword !== confirmPassword) { setSecErr('Passwords do not match'); return; }
    if (!auth.updatePassword) { setSecErr('Password update not supported'); return; }
    setSecLoading(true);
    try {
      await auth.updatePassword(newPassword);
      setSecMsg('Password updated successfully');
      setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setSecErr(err.message || 'Failed to update password');
    } finally { setSecLoading(false); }
  };

  const handleResetEmail = async () => {
    setSecErr(''); setSecMsg('');
    const email = userEmail || (profile as any)?.profile?.email;
    if (!auth.resetPassword || !email) { setSecErr('Password reset not supported'); return; }
    setSecLoading(true);
    try {
      await auth.resetPassword(email);
      setSecMsg(`Reset link sent to ${email}`);
    } catch (err: any) {
      setSecErr(err.message || 'Failed to send reset email');
    } finally { setSecLoading(false); }
  };

  if (profileLoading) {
    return <div className="h-full flex items-center justify-center"><Spinner /></div>;
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-cream-50 rounded-full flex items-center justify-center mx-auto text-stone-800">
          <Icon name="user-circle" size={40} />
        </div>
        <h2 className="text-2xl font-lora font-bold text-stone-800">Your DNA is unmapped</h2>
        <p className="text-stone-600">Complete your onboarding to unlock your personalized Liora insights.</p>
        <button
          onClick={() => setView('account')}
          className="px-8 py-3 bg-stone-800 text-white rounded-xl font-bold shadow-lg hover:bg-stone-700 transition-all"
        >
          Create Profile
        </button>
      </div>
    );
  }

  const name = toStr(profile.profile.name);
  const city = toStr(profile.profile.city);
  const greet = greetingFor(name);
  const isFresh = insights.totalVisits === 0 && insights.totalStays === 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* ============ PERSONALIZED HERO ============ */}
      <div className="bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-400 to-amber-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-lora font-bold border-4 border-amber-200/30 shadow-2xl flex-shrink-0">
            {name.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 w-full">
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] mb-2">{greet.emoji} {greet.sub}</p>
            <h1 className="font-lora text-3xl md:text-4xl font-bold leading-tight">{greet.hello}.</h1>
            {city && (
              <p className="text-white/70 font-medium flex items-center gap-1.5 mt-2">
                <Icon name="location_on" size={14} />
                {city}{insights.memberDays > 0 ? ` · Liora member for ${insights.memberDays} days` : ''}
              </p>
            )}
            <p className="text-white/85 text-sm md:text-base leading-relaxed mt-5 italic max-w-2xl">
              "{toStr(profile.summary) || 'Your dining story is just getting started.'}"
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                {isPremium ? '✦ Epicurean Gold' : 'Epicurean Basic'}
              </span>
              {(Array.isArray(profile.profile.cuisines) ? profile.profile.cuisines : []).slice(0, 3).map(c => (
                <span key={String(c)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {String(c)}
                </span>
              ))}
              <button
                onClick={() => setView('account')}
                className="px-3 py-1.5 bg-brand-400 text-stone-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-500 transition-all"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ STAT RIBBON (always real numbers) ============ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Restaurant Visits',  value: String(insights.totalVisits),                         icon: 'utensils-crossed', accent: 'text-brand-500' },
          { label: 'Money on Memories',  value: insights.totalSpent ? fmtMoney(insights.totalSpent) : '—', icon: 'sparkles',         accent: 'text-amber-600'  },
          { label: 'Cuisines Unlocked',  value: String(insights.cuisinesTriedCount),                  icon: 'compass',          accent: 'text-emerald-600' },
          { label: 'Hotel Stays',        value: String(insights.totalStays),                          icon: 'heart',            accent: 'text-rose-500'   },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={s.icon} size={14} className={s.accent} />
              <span className="text-[9px] font-bold text-stone-600 uppercase tracking-[0.2em]">{s.label}</span>
            </div>
            <div className="font-lora text-3xl font-bold text-stone-800">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ============ TABS ============ */}
      <div className="flex gap-8 border-b border-cream-200 overflow-x-auto scrollbar-hide px-2">
        {[
          { id: 'foryou',   label: 'For You'      },
          { id: 'activity', label: 'Activity'     },
          { id: 'prefs',    label: 'Preferences'  },
          { id: 'account',  label: 'Account'      },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap relative ${
              activeTab === tab.id ? 'text-stone-800' : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 animate-page-slide" />}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">

        {/* ==================================================================== */}
        {/* TAB 1 — FOR YOU (insight dashboard)                                 */}
        {/* ==================================================================== */}
        {activeTab === 'foryou' && (
          <div className="space-y-6 animate-page-slide">

            {isFresh && (
              <div className="bg-gradient-to-br from-brand-50 to-amber-50 border border-amber-200 p-8 rounded-[2rem] text-center">
                <div className="inline-flex w-14 h-14 bg-white rounded-2xl items-center justify-center text-amber-600 shadow-sm mb-4">
                  <Icon name="sparkles" size={26} />
                </div>
                <h3 className="font-lora text-2xl font-bold text-stone-800 mb-2">Your story starts here</h3>
                <p className="text-stone-600 text-sm max-w-md mx-auto mb-5">
                  Place your first order or book a stay and Liora will start learning what makes a perfect night for you — your top cuisines, favourite venues, and the rhythm of your week.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => setView('restaurants')} className="px-6 py-3 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-all">Explore Restaurants</button>
                  <button onClick={() => setView('hotels')}      className="px-6 py-3 bg-white border border-stone-200 text-stone-800 rounded-xl text-sm font-bold hover:bg-cream-50 transition-all">Browse Hotels</button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">

              {/* Top cuisines — REAL data from items eaten */}
              <div className="bg-white p-7 rounded-[2rem] border border-cream-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-lora text-xl font-bold text-stone-800">Your Flavour Print</h3>
                  <Icon name="insights" size={18} className="text-stone-500" />
                </div>
                {insights.topCuisines.length > 0 ? (
                  <div className="space-y-5">
                    {insights.topCuisines.map((c, i) => (
                      <div key={c.cuisine}>
                        <div className="flex justify-between text-xs font-bold text-stone-700 mb-2">
                          <span className="flex items-center gap-2">
                            {i === 0 && <span className="text-amber-500">★</span>}
                            {c.cuisine}
                          </span>
                          <span className="text-stone-500">{c.count} {c.count === 1 ? 'dish' : 'dishes'}</span>
                        </div>
                        <div className="w-full h-2 bg-cream-50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              i === 0 ? 'bg-gradient-to-r from-brand-400 to-amber-500' :
                              i === 1 ? 'bg-stone-700' :
                              i === 2 ? 'bg-emerald-600' : 'bg-rose-400'
                            }`}
                            style={{ width: `${Math.max(c.pct, 8)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-500 text-sm py-4">We'll map your true flavour print after a few orders. Until then, your stated favourites are: <strong className="text-stone-700">{(Array.isArray(profile.profile.cuisines) ? profile.profile.cuisines : []).join(', ') || '—'}</strong>.</p>
                )}
              </div>

              {/* Most loved restaurant */}
              <div className={`p-7 rounded-[2rem] shadow-sm border ${insights.topRestaurant ? 'bg-gradient-to-br from-amber-50 to-brand-50 border-amber-200' : 'bg-white border-cream-200'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-lora text-xl font-bold text-stone-800">Most Loved</h3>
                  <Icon name="heart" size={18} className="text-rose-500" />
                </div>
                {insights.topRestaurant ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 mb-2">Your home table</p>
                    <h4 className="font-lora text-2xl font-bold text-stone-800 leading-tight mb-3">{insights.topRestaurant.name}</h4>
                    <p className="text-stone-700 text-sm">
                      <strong className="text-stone-900">{insights.topRestaurant.visits} visits</strong> · last seen {daysSince(insights.topRestaurant.lastVisit)} days ago
                    </p>
                    <button onClick={() => setView('restaurants')} className="mt-5 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-700 transition-all">
                      Reorder favourites
                    </button>
                  </>
                ) : (
                  <p className="text-stone-500 text-sm py-4">No favourite venue yet — visit a place twice and it'll claim this spot.</p>
                )}
              </div>

              {/* Spending rhythm — last 8 weeks */}
              {insights.totalSpent > 0 && (
                <div className="bg-white p-7 rounded-[2rem] border border-cream-200 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-lora text-xl font-bold text-stone-800">Spending Rhythm</h3>
                    <Icon name="trending-up" size={18} className="text-emerald-600" />
                  </div>
                  <p className="text-stone-500 text-xs mb-5">Last 8 weeks · avg <strong className="text-stone-700">{fmtMoney(insights.avgPerVisit)}</strong> per visit</p>
                  <div className="flex items-end gap-1.5 h-28">
                    {(() => {
                      const max = Math.max(...insights.weeklySpend, 1);
                      return insights.weeklySpend.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end h-full">
                            <div
                              className={`w-full rounded-t-lg transition-all duration-700 ${v > 0 ? 'bg-gradient-to-t from-stone-800 to-stone-600' : 'bg-cream-100'}`}
                              style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
                              title={v > 0 ? fmtMoney(v) : 'No activity'}
                            />
                          </div>
                          <span className="text-[8px] text-stone-400 font-bold">{i === 7 ? 'now' : `${7 - i}w`}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Time of day rhythm */}
              {(insights.timeOfDay.lunch + insights.timeOfDay.dinner + insights.timeOfDay.lateNight) > 0 && (
                <div className="bg-white p-7 rounded-[2rem] border border-cream-200 shadow-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-lora text-xl font-bold text-stone-800">When You Dine</h3>
                    <Icon name="clock" size={18} className="text-stone-500" />
                  </div>
                  {(() => {
                    const total = insights.timeOfDay.lunch + insights.timeOfDay.dinner + insights.timeOfDay.lateNight;
                    const slots = [
                      { label: 'Lunch',      key: 'lunch'     as const, icon: '☀️', val: insights.timeOfDay.lunch,     accent: 'bg-amber-400'  },
                      { label: 'Dinner',     key: 'dinner'    as const, icon: '🍷', val: insights.timeOfDay.dinner,    accent: 'bg-stone-800'  },
                      { label: 'Late Night', key: 'lateNight' as const, icon: '🌙', val: insights.timeOfDay.lateNight, accent: 'bg-indigo-500' },
                    ];
                    const top = slots.slice().sort((a, b) => b.val - a.val)[0];
                    return (
                      <>
                        <p className="text-sm text-stone-700 mb-5">You're a <strong className="font-bold">{top.label.toLowerCase()} person</strong> — {Math.round((top.val / total) * 100)}% of your visits.</p>
                        <div className="space-y-3">
                          {slots.map(s => (
                            <div key={s.key}>
                              <div className="flex justify-between text-xs font-bold text-stone-600 mb-1.5">
                                <span>{s.icon} {s.label}</span>
                                <span>{s.val}</span>
                              </div>
                              <div className="w-full h-1.5 bg-cream-50 rounded-full overflow-hidden">
                                <div className={`h-full ${s.accent} rounded-full transition-all duration-1000`} style={{ width: `${Math.max((s.val / total) * 100, 4)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Date Night chemistry */}
              {insights.totalStays > 0 && (
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-7 rounded-[2rem] border border-rose-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-lora text-xl font-bold text-stone-800">Date Night Chemistry</h3>
                    <span className="text-rose-500">✨</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">Stays Booked</p>
                      <p className="font-lora text-3xl font-bold text-stone-800">{insights.totalStays}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">Total Nights</p>
                      <p className="font-lora text-3xl font-bold text-stone-800">{insights.totalNights}</p>
                    </div>
                  </div>
                  {insights.topHotel && (
                    <p className="text-sm text-stone-700">Your go-to is <strong className="font-bold">{insights.topHotel.hotel.name}</strong>{insights.topHotel.bookings > 1 ? ` (${insights.topHotel.bookings} stays)` : ''}.</p>
                  )}
                  {insights.upcomingStay && (
                    <div className="mt-5 p-4 bg-white/70 rounded-2xl border border-rose-100">
                      <p className="text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">Coming up</p>
                      <p className="font-bold text-stone-800 text-sm">{(insights.upcomingStay as any).hotel?.name || ''}</p>
                      <p className="text-xs text-stone-600">{new Date(insights.upcomingStay.checkIn).toLocaleDateString()} · {insights.upcomingStay.nightsCount} {insights.upcomingStay.nightsCount === 1 ? 'night' : 'nights'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Wellness */}
              {insights.wellness && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-7 rounded-[2rem] border border-emerald-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-lora text-xl font-bold text-stone-800">Wellness Pulse</h3>
                    <Icon name="sparkles" size={18} className="text-emerald-600" />
                  </div>
                  <p className="text-sm text-stone-700 mb-4">Across <strong>{insights.wellness.loggedDays}</strong> logged days you average <strong>{insights.wellness.avgCalories.toLocaleString()}</strong> kcal — and you stay on goal <strong>{insights.wellness.pctOnGoal}%</strong> of the time.</p>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${insights.wellness.pctOnGoal}%` }} />
                  </div>
                  <button onClick={() => setView('calorie_log')} className="mt-5 text-[10px] font-bold text-emerald-700 uppercase tracking-widest hover:underline">Open Calorie Log →</button>
                </div>
              )}

              {/* Personalized recommendations */}
              {(insights.newCuisineSuggestion || insights.missedRestaurant) && (
                <div className="md:col-span-2 bg-stone-800 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <Icon name="sparkles" size={180} className="absolute -right-8 -bottom-8 text-white/5 pointer-events-none" />
                  <h3 className="font-lora text-2xl font-bold mb-6 relative z-10">Picked just for you</h3>
                  <div className="grid md:grid-cols-2 gap-4 relative z-10">
                    {insights.newCuisineSuggestion && (
                      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-400 mb-2">Try next</p>
                        <h4 className="font-lora text-xl font-bold mb-2">{insights.newCuisineSuggestion}</h4>
                        <p className="text-white/70 text-xs leading-relaxed mb-4">A flavour you've told us you love but haven't ordered yet. Ready for the leap?</p>
                        <button onClick={() => setView('restaurants')} className="text-[10px] font-bold text-brand-400 uppercase tracking-widest hover:text-brand-300">Find {insights.newCuisineSuggestion} →</button>
                      </div>
                    )}
                    {insights.missedRestaurant && (
                      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-rose-400 mb-2">We miss you at</p>
                        <h4 className="font-lora text-xl font-bold mb-2">{insights.missedRestaurant.name}</h4>
                        <p className="text-white/70 text-xs leading-relaxed mb-4">It's been {insights.missedRestaurant.daysAgo} days. Your usual table is waiting.</p>
                        <button onClick={() => setView('restaurants')} className="text-[10px] font-bold text-rose-400 uppercase tracking-widest hover:text-rose-300">Reserve again →</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-white p-7 rounded-[2rem] border border-cream-200 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-lora text-xl font-bold text-stone-800">Milestones</h3>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  {insights.achievements.filter(a => a.earned).length}/{insights.achievements.length} unlocked
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {insights.achievements.map(a => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      a.earned
                        ? 'bg-gradient-to-br from-amber-50 to-brand-50 border-amber-300 shadow-sm'
                        : 'bg-cream-50/50 border-cream-200 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${a.earned ? 'bg-white text-amber-600' : 'bg-white text-stone-400'}`}>
                      <Icon name={a.icon} size={18} />
                    </div>
                    <p className="font-bold text-stone-800 text-xs leading-tight mb-1">{a.label}</p>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">{a.progress}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2 — ACTIVITY (orders + stays combined)                          */}
        {/* ==================================================================== */}
        {activeTab === 'activity' && (
          <div className="space-y-8 animate-page-slide">
            {/* Hotel stays */}
            {myBookings.length > 0 && (
              <div>
                <div className="flex justify-between items-center px-2 mb-4">
                  <h3 className="font-lora text-xl font-bold text-stone-800">Hotel Stays</h3>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{myBookings.length} booked</span>
                </div>
                <div className="grid gap-3">
                  {myBookings.map(b => {
                    const upcoming = new Date(b.checkIn).getTime() > Date.now();
                    return (
                      <div key={b.id} className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 flex-shrink-0 border border-rose-100">
                          <Icon name="hotel" size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-800 truncate">{b.hotel.name}</h4>
                          <p className="text-xs text-stone-500 font-medium">
                            {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} · {b.nightsCount} {b.nightsCount === 1 ? 'night' : 'nights'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-stone-800">{fmtMoney(b.totalCents / 100)}</p>
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            upcoming ? 'text-rose-600' : b.status === 'completed' ? 'text-emerald-600' : 'text-stone-500'
                          }`}>
                            {upcoming ? 'Upcoming' : b.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past orders */}
            <div>
              <div className="flex justify-between items-center px-2 mb-4">
                <h3 className="font-lora text-xl font-bold text-stone-800">Past Orders</h3>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{pastOrders.length} completed</span>
              </div>
              {ordersLoading ? <Spinner /> : pastOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-[2rem] border border-cream-200 text-center">
                  <Icon name="receipt" size={42} className="mx-auto text-stone-400 mb-4" />
                  <p className="text-stone-600 font-medium">Your digital receipt book is empty.</p>
                  <button onClick={() => setView('restaurants')} className="mt-4 text-brand-500 font-bold underline text-sm">Explore restaurants</button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {pastOrders.map(order => (
                    <div key={order.id} className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                      <div className="w-14 h-14 bg-cream-50 rounded-2xl flex items-center justify-center text-stone-700 flex-shrink-0 border border-cream-200">
                        <Icon name="restaurant" size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-stone-800 truncate">{order.restaurantName}</h4>
                        <p className="text-xs text-stone-500 font-medium">{new Date(order.date).toLocaleDateString()} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-800">{order.total}</p>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Paid</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3 — PREFERENCES (dietary at-a-glance + AI persona)              */}
        {/* ==================================================================== */}
        {activeTab === 'prefs' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-page-slide">

            {/* At-a-glance dietary card */}
            <div className="bg-white p-7 rounded-[2rem] border border-cream-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-lora text-xl font-bold text-stone-800">What's on Your Plate</h3>
                <button onClick={() => setView('account')} className="text-[10px] font-bold text-stone-600 uppercase tracking-widest hover:text-stone-800">Edit</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Diet',     value: toStr(profile.profile.diet)   || 'No restrictions' },
                  { label: 'Budget',   value: toStr(profile.profile.budget) || '$$' },
                  { label: 'Spice',    value: typeof profile.profile.spice === 'number' ? `${'🌶'.repeat(Math.max(1, Math.min(5, profile.profile.spice)))}` : '🌶🌶🌶' },
                  { label: 'Vibe',     value: toStr(profile.profile.vibe)   || 'Cozy & casual' },
                ].map(card => (
                  <div key={card.label} className="p-4 bg-cream-50/50 rounded-2xl border border-cream-200/60">
                    <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">{card.label}</p>
                    <p className="font-bold text-stone-800 text-sm">{card.value}</p>
                  </div>
                ))}
              </div>

              {(Array.isArray(profile.profile.allergens) && profile.profile.allergens.length > 0) && (
                <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest mb-2">Watch out for</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.profile.allergens.map((a: string) => (
                      <span key={a} className="px-3 py-1 bg-white text-red-700 text-xs font-bold rounded-full border border-red-200">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI persona */}
            <div className="bg-white p-7 rounded-[2rem] border border-cream-200 shadow-sm">
              <h3 className="font-lora text-xl font-bold text-stone-800 mb-2">Liora's Voice</h3>
              <p className="text-stone-500 text-sm mb-6">How your AI concierge should talk to you.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-3">Tone</label>
                  <div className="grid grid-cols-3 gap-2 bg-cream-50 p-1.5 rounded-2xl">
                    {(['direct','friendly','playful'] as const).map(tone => (
                      <button key={tone} onClick={() => updateAiPreferences({ tone })}
                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                          profile.aiPreferences?.tone === tone ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                        }`}>{tone}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-3">Style</label>
                  <div className="grid grid-cols-3 gap-2 bg-cream-50 p-1.5 rounded-2xl">
                    {(['classic','adventurous','healthy'] as const).map(style => (
                      <button key={style} onClick={() => updateAiPreferences({ style })}
                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                          profile.aiPreferences?.style === style ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                        }`}>{style}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4 — ACCOUNT (security)                                          */}
        {/* ==================================================================== */}
        {activeTab === 'account' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-page-slide">
            <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
              <h3 className="font-lora text-2xl font-bold text-stone-800 mb-2">Account Security</h3>
              <p className="text-stone-500 text-sm mb-8">Signed in as <strong className="text-stone-800">{userEmail || 'guest'}</strong></p>

              {secErr && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                  <Icon name="x" className="w-5 h-5 flex-shrink-0" />{secErr}
                </div>
              )}
              {secMsg && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                  <Icon name="check" className="w-5 h-5 flex-shrink-0" />{secMsg}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-2">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password"
                    className="w-full px-4 py-3.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 text-sm" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-2">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
                    className="w-full px-4 py-3.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 text-sm" required />
                </div>
                <button type="submit" disabled={secLoading || !newPassword || !confirmPassword}
                  className="w-full py-4 rounded-xl font-bold text-sm bg-stone-800 text-white hover:bg-stone-700 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {secLoading ? <Spinner /> : null}{secLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-cream-100">
                <h4 className="font-bold text-stone-800 text-sm mb-2">Forgot your password?</h4>
                <p className="text-stone-500 text-xs leading-relaxed mb-5">
                  We'll send a secure reset link to your registered email.
                </p>
                <button type="button" onClick={handleResetEmail} disabled={secLoading}
                  className="px-6 py-3 rounded-xl font-bold text-xs border border-cream-200 text-stone-700 bg-white hover:bg-cream-50 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {secLoading ? <Spinner /> : <Icon name="mail" size={16} />}Send Reset Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-24" />
    </div>
  );
};

export default UserProfile;
