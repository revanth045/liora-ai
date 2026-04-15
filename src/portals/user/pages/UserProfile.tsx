import React, { useState, useMemo } from 'react';
import { Icon } from '../../../../components/Icon';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { usePastOrders } from '../../../../hooks/usePastOrders';
import { useSubscription } from '../../../hooks/useSubscription';
import { Spinner } from '../../../../components/Spinner';
import { View } from '../../../../types';
import { getAuth } from '../../../auth';

interface UserProfileProps {
    setView: (view: View) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ setView }) => {
  const { profile, updateAiPreferences, isLoading: profileLoading } = useUserProfile();
  const { pastOrders, isLoading: ordersLoading } = usePastOrders();
  const { isPremium, plan } = useSubscription();
  const [activeTab, setActiveTab] = useState('dna');
  
  const auth = getAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [secMsg, setSecMsg] = useState('');
  const [secErr, setSecErr] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErr('');
    setSecMsg('');
    if (newPassword !== confirmPassword) {
      setSecErr('Passwords do not match');
      return;
    }
    if (!auth.updatePassword) {
      setSecErr('Password update not supported');
      return;
    }
    setSecLoading(true);
    try {
      await auth.updatePassword(newPassword);
      setSecMsg('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecErr(err.message || 'Failed to update password');
    } finally {
      setSecLoading(false);
    }
  };

  const handleResetEmail = async () => {
    setSecErr('');
    setSecMsg('');
    if (!auth.resetPassword || !profile?.profile?.email) {
      setSecErr('Password reset not supported');
      return;
    }
    setSecLoading(true);
    try {
      await auth.resetPassword(profile.profile.email);
      setSecMsg(`Reset link sent to ${profile.profile.email}`);
    } catch (err: any) {
      setSecErr(err.message || 'Failed to send reset email');
    } finally {
      setSecLoading(false);
    }
  };

  // Safe primitive coercion helper — handles AI returning objects/arrays instead of strings
  const toProfileStr = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return (v as unknown[]).map(String).join(', ');
    if (v !== null && typeof v === 'object') {
      const vals = Object.values(v as Record<string, unknown>).filter(x => typeof x === 'string' || typeof x === 'number');
      return vals.map(String).join(', ');
    }
    return v == null ? '' : String(v);
  };

  // DNA Calculation Engine
  const dnaStats = useMemo(() => {
    if (!profile) return null;
    const p = profile.profile;
    
    // Adventurous: 20% base + 15% per cuisine (max 100)
    const cuisineArr = Array.isArray(p.cuisines) ? p.cuisines : [];
    const adventurous = Math.min(20 + cuisineArr.length * 15, 100);
    
    // Health: based on diet string
    const dietStr = toProfileStr(p.diet).toLowerCase();
    const health = (dietStr.includes('vegan') || dietStr.includes('veg')) ? 95 : 60;
    
    // Fine Dining: based on budget
    const budgetScores: Record<string, number> = { '$': 20, '$$': 50, '$$$': 85, '$$$$': 100 };
    const budgetStr = toProfileStr(p.budget);
    const fineDining = budgetScores[budgetStr] || 50;

    // Spice: directly from the number
    const spice = typeof p.spice === 'number' ? p.spice * 20 : 50;

    return [
      { label: 'Adventurous', val: adventurous, color: 'bg-cream-100' },
      { label: 'Health Focused', val: health, color: 'bg-green-600' },
      { label: 'Fine Dining', val: fineDining, color: 'bg-brand-500' },
      { label: 'Spice Tolerance', val: spice, color: 'bg-red-500' },
    ];
  }, [profile]);

  if (profileLoading) {
    return (
        <div className="h-full flex items-center justify-center">
            <Spinner />
        </div>
    );
  }

  // Fallback if no profile exists yet
  if (!profile) {
      return (
          <div className="max-w-2xl mx-auto p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-cream-50 rounded-full flex items-center justify-center mx-auto text-stone-800">
                  <Icon name="user-circle" size={40} />
              </div>
              <h2 className="text-2xl font-lora font-bold text-stone-800">Your DNA is unmapped</h2>
              <p className="text-stone-400">Complete your onboarding to unlock your personalized Dining DNA and AI insights.</p>
              <button 
                onClick={() => setView('account')} 
                className="px-8 py-3 bg-stone-800 text-white rounded-xl font-bold shadow-lg hover:bg-stone-700 transition-all"
              >
                  Create Profile
              </button>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-cream-200 shadow-sm flex flex-col md:flex-row items-start gap-8 relative overflow-hidden">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-400 to-amber-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-lora font-bold border-4 border-amber-200 shadow-2xl flex-shrink-0 relative z-10">
          {toProfileStr(profile.profile.name).charAt(0) || 'U'}
        </div>
        <div className="flex-1 relative z-10 w-full">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="font-lora text-3xl text-stone-800 font-bold">{toProfileStr(profile.profile.name)}</h1>
              <p className="text-stone-400 font-medium flex items-center gap-1.5 mt-1">
                  <Icon name="location_on" size={14} />
                  {toProfileStr(profile.profile.city) || 'Location unset'}
              </p>
            </div>
            <button 
                onClick={() => setView('account')}
                className="px-5 py-2.5 border border-cream-200 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-800 hover:bg-cream-50 transition-all active:scale-95 shadow-sm"
            >
              Edit Profile
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-8">
            <div className="px-4 py-2 bg-cream-50 rounded-xl border border-cream-200/50">
              <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-0.5">Dietary</span>
              <span className="font-bold text-stone-800 text-xs">{(() => { const d = toProfileStr(profile.profile.diet); return d && d !== 'None' ? d : 'No Restrictions'; })()}</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-cream-200/50">
              <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-0.5">Liora Level</span>
              <span className="font-bold text-brand-400 text-xs">Epicurean {isPremium ? 'Gold' : 'Basic'}</span>
            </div>
             <div className="px-4 py-2 bg-stone-800 rounded-xl shadow-lg border border-stone-700">
              <span className="block text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mb-0.5">Experience Points</span>
              <span className="font-bold text-brand-400 text-xs">1,240 XP</span>
            </div>
          </div>
        </div>
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cream-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl pointer-events-none"></div>
      </div>

      {/* Navigation */}
      <div className="flex gap-8 border-b border-cream-200 overflow-x-auto scrollbar-hide px-2">
        {[
          { id: 'dna', label: 'Dining DNA' },
          { id: 'history', label: 'Order History' },
          { id: 'payments', label: 'Payments' },
          { id: 'settings', label: 'AI Settings' },
          { id: 'security', label: 'Security' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap relative ${
              activeTab === tab.id
                ? 'text-stone-800' 
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cream-100 animate-page-slide" />}
          </button>
        ))}
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="min-h-[400px]">
        {/* TAB 1: DINING DNA */}
        {activeTab === 'dna' && (
            <div className="grid md:grid-cols-2 gap-6 animate-page-slide">
                {/* Taste Graph */}
                <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-lora text-xl text-stone-800 font-bold">Taste Profile</h3>
                        <Icon name="insights" size={20} className="text-stone-400" />
                    </div>
                    <div className="space-y-7">
                    {dnaStats?.map(stat => (
                        <div key={stat.label}>
                            <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2.5">
                                <span>{stat.label}</span>
                                <span className="text-stone-800">{stat.val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-cream-50 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full ${stat.color} rounded-full transition-all duration-[1500ms] ease-out shadow-sm`} style={{ width: `${stat.val}%` }}></div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>

                {/* AI Observations */}
                <div className="bg-stone-800 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xl border border-cream-100">
                            <Icon name="psychology" size={28} className="text-brand-400" />
                        </div>
                        <h3 className="font-lora text-2xl font-bold">Liora Insights</h3>
                    </div>
                    <p className="text-white/80 text-lg leading-relaxed mb-10 font-medium italic">
                        "{typeof profile.summary === 'string' ? profile.summary : String(profile.summary ?? '')}"
                    </p>
                    <button 
                        onClick={() => setView('account')}
                        className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.3em] border border-[#e9ae1e]/40 px-6 py-3 rounded-2xl hover:bg-brand-500 hover:text-stone-800 transition-all active:scale-95 shadow-lg"
                    >
                        Refine Preferences
                    </button>
                    </div>
                    <Icon name="sparkles" size={220} className="absolute -right-16 -bottom-16 text-white/5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />
                </div>

                {/* Cuisines Grid */}
                <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
                    <h3 className="font-lora text-xl text-stone-800 font-bold mb-6">Your Flavor Palette</h3>
                    <div className="flex flex-wrap gap-3">
                        {(Array.isArray(profile.profile.cuisines) ? profile.profile.cuisines : []).map(c => (
                            <span key={String(c)} className="px-5 py-2.5 bg-white border border-cream-200 text-stone-800 font-bold text-xs rounded-xl shadow-sm hover:border-[#e9ae1e] transition-all cursor-default">
                                {String(c)}
                            </span>
                        ))}
                        <button onClick={() => setView('account')} className="px-5 py-2.5 bg-cream-100/80 border border-dashed border-cream-200 text-stone-400 font-bold text-xs rounded-xl hover:text-stone-800 transition-all">+ Add New</button>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 2: ORDER HISTORY */}
        {activeTab === 'history' && (
            <div className="space-y-4 animate-page-slide">
                <div className="flex justify-between items-center px-2">
                    <h3 className="font-lora text-xl font-bold text-stone-800">Past Experiences</h3>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{pastOrders.length} Completed</span>
                </div>
                {ordersLoading ? <Spinner /> : pastOrders.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border border-cream-200 text-center">
                        <Icon name="receipt" size={48} className="mx-auto text-stone-400 mb-4" />
                        <p className="text-stone-400 font-medium">Your digital receipt book is empty.</p>
                        <button onClick={() => setView('restaurants')} className="mt-4 text-brand-400 font-bold underline text-sm">Explore Food Hub</button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pastOrders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-cream-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6 group hover:shadow-md transition-all">
                                <div className="flex items-center gap-5 w-full">
                                    <div className="w-14 h-14 bg-cream-50 rounded-2xl flex items-center justify-center text-stone-800 flex-shrink-0 border border-cream-200">
                                        <Icon name="restaurant" size={24} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-stone-800 text-lg truncate">{order.restaurantName}</h4>
                                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{new Date(order.date).toLocaleDateString()} â€¢ {order.items.length} items</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-stone-800 leading-none">{order.total}</p>
                                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Paid</span>
                                    </div>
                                    <button className="p-3 bg-white border border-cream-200 rounded-xl text-stone-800 hover:bg-white hover:border-cream-200 transition-all">
                                        <Icon name="chevron_right" size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* TAB 3: PAYMENTS */}
        {activeTab === 'payments' && (
            <div className="space-y-6 animate-page-slide">
                <div className="bg-gradient-to-br from-[#18181b] to-[#2d3a2e] p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Liora Pay Balance</p>
                        <h2 className="text-5xl font-lora font-bold mb-10">$140.50</h2>
                        <div className="flex gap-4">
                            <button className="px-8 py-3 bg-white text-stone-800 rounded-xl text-sm font-bold shadow-lg hover:bg-cream-100/50 transition-all active:scale-95">Top Up</button>
                            <button className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-bold backdrop-blur-md hover:bg-white/20 transition-all">Manage Auto-Pay</button>
                        </div>
                    </div>
                    <Icon name="account_balance_wallet" size={200} className="absolute -right-12 -bottom-12 text-white/5 pointer-events-none" />
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
                    <h3 className="font-lora text-xl font-bold text-stone-800 mb-6">Saved Methods</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-5 border border-cream-200 rounded-2xl bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-black rounded-md flex items-center justify-center text-[10px] font-bold text-white tracking-widest">VISA</div>
                                <div>
                                    <p className="font-bold text-stone-800">â€¢â€¢â€¢â€¢ 4242</p>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Expires 12/28</p>
                                </div>
                            </div>
                            <span className="bg-green-100 text-green-700 text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Default</span>
                        </div>
                        <button className="w-full py-4 border-2 border-dashed border-cream-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:border-cream-200 hover:text-stone-800 transition-all">+ Add New Payment Method</button>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 4: AI SETTINGS */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-page-slide">
                <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
                    <h3 className="font-lora text-2xl font-bold text-stone-800 mb-8">Persona Calibration</h3>
                    
                    <div className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 ml-1">Liora's Voice Tone</label>
                            <div className="grid grid-cols-3 gap-3 bg-cream-50 p-1.5 rounded-2xl border border-cream-200/50">
                                {['direct', 'friendly', 'playful'].map(tone => (
                                    <button
                                        key={tone}
                                        onClick={() => updateAiPreferences({ tone: tone as any })}
                                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                            profile.aiPreferences?.tone === tone 
                                            ? 'bg-white text-stone-800 shadow-md' 
                                            : 'text-stone-400 hover:text-stone-800'
                                        }`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 ml-1">Recommendation Style</label>
                            <div className="grid grid-cols-3 gap-3 bg-cream-50 p-1.5 rounded-2xl border border-cream-200/50">
                                {['classic', 'adventurous', 'healthy'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => updateAiPreferences({ style: style as any })}
                                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                            profile.aiPreferences?.style === style 
                                            ? 'bg-white text-stone-800 shadow-md' 
                                            : 'text-stone-400 hover:text-stone-800'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 bg-red-50/30 rounded-[2rem] border border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl text-red-500 shadow-sm border border-red-100">
                            <Icon name="trash" size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-stone-800 text-sm">Wipe Memory</p>
                            <p className="text-xs text-stone-400">Reset all AI learning and preferences</p>
                        </div>
                    </div>
                    <button className="text-[10px] font-bold text-red-600 uppercase tracking-widest hover:underline">Reset Now</button>
                </div>
            </div>
        )}
        {/* TAB 5: SECURITY */}
        {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-page-slide">
                <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
                    <h3 className="font-lora text-2xl font-bold text-stone-800 mb-8">Account Security</h3>
                    
                    {secErr && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                            <Icon name="x" className="w-5 h-5 flex-shrink-0" />
                            {secErr}
                        </div>
                    )}
                    {secMsg && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                            <Icon name="check" className="w-5 h-5 flex-shrink-0" />
                            {secMsg}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2 ml-1">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-3.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2 ml-1">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-4 py-3.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm"
                                    required 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={secLoading || !newPassword || !confirmPassword}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-brand-400 text-white hover:bg-brand-500 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {secLoading ? <Spinner /> : null}
                            {secLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-cream-100">
                        <h4 className="font-bold text-stone-800 text-sm mb-2">Forgot your password?</h4>
                        <p className="text-stone-500 text-xs leading-relaxed mb-5">
                            If you signed up with an email and password (or need to set a password for your Google account), we can send a secure reset link to your email.
                        </p>
                        <button 
                            type="button"
                            onClick={handleResetEmail}
                            disabled={secLoading}
                            className="px-6 py-3 rounded-xl font-bold text-xs border border-cream-200 text-stone-700 bg-white hover:bg-cream-50 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {secLoading ? <Spinner /> : <Icon name="mail" size={16} />}
                            Send Reset Link
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
