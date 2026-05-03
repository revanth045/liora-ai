
import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';

// Mock Data
const TIERS = [
  { id: 'bronze', name: 'Club Member', spendReq: 0, color: 'bg-orange-100 text-orange-800 border-orange-200', members: 1240, perks: ['Earn 1pt per $1', 'Birthday Dessert'] },
  { id: 'silver', name: 'Silver Spoon', spendReq: 500, color: 'bg-cream-100/50 text-stone-700 border-cream-200', members: 342, perks: ['Earn 1.25pt per $1', 'Priority Booking'] },
  { id: 'gold', name: 'Gold Plate', spendReq: 1500, color: 'bg-yellow-50 text-yellow-800 border-yellow-200', members: 86, perks: ['Earn 1.5pt per $1', 'Chef\'s Table Access', 'Free Delivery'] },
];

const REWARDS = [
  { id: 1, title: '$10 Off Bill', cost: 100, redemptions: 452, active: true },
  { id: 2, title: 'Free Appetizer', cost: 150, redemptions: 210, active: true },
  { id: 3, title: 'Bottle of House Wine', cost: 400, redemptions: 45, active: true },
  { id: 4, title: 'Chef\'s Tasting Menu (2)', cost: 2000, redemptions: 12, active: true },
];

export default function LoyaltyProgram({ restaurant }: { restaurant: import('../../../demoDb').DemoRestaurant }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'members'>('overview');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-page-slide">
      
      {/* Header & KPI Cards */}
      <div className="flex justify-between items-end">
        <div>
           <h1 className="font-lora text-3xl text-[#1A1D21] mb-1 font-bold">Loyalty & Rewards</h1>
           <p className="text-stone-600 font-medium">Turn guests into regulars with AI-driven retention.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-5 py-2.5 bg-white border border-cream-200 rounded-xl text-sm font-bold text-stone-800 hover:bg-cream-50 transition-all">View as User</button>
           <button className="px-5 py-2.5 bg-cream-100 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-cream-200 transition-all">New Campaign</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-8 border-b border-cream-200">
        {[
          { id: 'overview', label: 'Dashboard' },
          { id: 'config', label: 'Tiers & Rules' },
          { id: 'members', label: 'Member List' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === tab.id ? 'border-cream-200 text-stone-800' : 'border-transparent text-stone-600 hover:text-stone-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- DASHBOARD VIEW --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-cream-200 shadow-sm">
               <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-2">Loyalty Sales</p>
               <h3 className="text-3xl font-lora font-bold text-stone-800">$12,450</h3>
               <p className="text-xs text-green-600 mt-2 font-bold">+18% vs non-members</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-cream-200 shadow-sm">
               <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-2">Total Members</p>
               <h3 className="text-3xl font-lora font-bold text-stone-800">1,668</h3>
               <p className="text-xs text-green-600 mt-2 font-bold">+42 this week</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-cream-200 shadow-sm">
               <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-2">Points Issued</p>
               <h3 className="text-3xl font-lora font-bold text-stone-800">84.2k</h3>
               <p className="text-xs text-stone-600 mt-2 font-medium">Value: ~$840.00</p>
            </div>
            <div className="bg-cream-100 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
               <div className="relative z-10">
                 <p className="text-brand-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Icon name="auto_awesome" size={14} /> AI Insight
                 </p>
                 <p className="text-sm font-medium leading-relaxed">
                   "Your <strong>Silver Spoon</strong> members haven't visited in 21 days on average. Launch a 'Double Points' week?"
                 </p>
                 <button className="mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/20 transition-all">
                   Launch Campaign
                 </button>
               </div>
               <Icon name="loyalty" size={96} className="absolute -right-4 -bottom-6 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>

          {/* Active Rewards Table */}
          <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-cream-200 flex justify-between items-center bg-white/30">
              <h3 className="font-lora text-xl font-bold text-stone-800">Top Redemptions</h3>
              <button className="text-[10px] font-bold uppercase tracking-widest text-brand-400 hover:underline">Manage Rewards</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-cream-100/80 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Reward Name</th>
                    <th className="px-6 py-5">Cost (Pts)</th>
                    <th className="px-6 py-5">Redeemed</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {REWARDS.map(r => (
                    <tr key={r.id} className="hover:bg-cream-50/20 transition-colors">
                      <td className="px-8 py-5 font-bold text-stone-800">{r.title}</td>
                      <td className="px-6 py-5 text-sm text-stone-600 font-medium">{r.cost} pts</td>
                      <td className="px-6 py-5 font-mono text-sm font-bold text-stone-800">{r.redemptions}</td>
                      <td className="px-6 py-5">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-green-100">Active</span>
                      </td>
                      <td className="px-8 py-5 text-right text-xs font-bold text-green-600">
                        <Icon name="trending_up" size={14} className="inline mr-1" /> +12%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TIERS CONFIGURATION --- */}
      {activeTab === 'config' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map(tier => (
              <div key={tier.id} className={`p-8 rounded-[2rem] border-2 flex flex-col h-full bg-white transition-all hover:shadow-lg ${tier.color.replace('bg-', 'border-').replace('text-', 'border-opacity-50 ')}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl shadow-sm ${tier.color}`}>
                    <Icon name={tier.id === 'gold' ? 'workspace_premium' : tier.id === 'silver' ? 'military_tech' : 'stars'} size={32} />
                  </div>
                  <button className="p-2 text-stone-600 hover:bg-cream-50 rounded-xl transition-all"><Icon name="edit" size={20} /></button>
                </div>
                
                <h3 className="text-2xl font-lora font-bold text-stone-800 mb-1">{tier.name}</h3>
                <p className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-8">Spend ${tier.spendReq}+ / year</p>
                
                <div className="flex-1 space-y-4 mb-10">
                  {tier.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-medium text-stone-600">
                      <Icon name="check_circle" size={18} className="text-green-500" />
                      {perk}
                    </div>
                  ))}
                  <button className="text-[10px] text-stone-600 font-bold uppercase tracking-widest hover:text-brand-400 flex items-center gap-2 pt-2">
                    <Icon name="plus" size={14} /> Add Perk
                  </button>
                </div>

                <div className="pt-6 border-t border-cream-200 text-center">
                  <span className="text-3xl font-lora font-bold text-stone-800">{tier.members}</span>
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-[0.2em] block mt-1">Active Members</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-cream-50 p-10 rounded-[2.5rem] border border-[#e9ae1e]/30 text-center relative overflow-hidden">
             <h3 className="font-lora text-2xl text-stone-800 mb-3 font-bold">Need Help Designing Tiers?</h3>
             <p className="text-stone-600 max-w-lg mx-auto mb-8 font-medium leading-relaxed">
               Liora can analyze your last 12 months of transaction history to recommend the perfect tier thresholds to maximize member conversion.
             </p>
             <button className="px-8 py-4 bg-cream-100 text-white rounded-2xl font-bold flex items-center gap-3 mx-auto shadow-xl hover:bg-cream-200 transition-all active:scale-95">
               <Icon name="auto_awesome" size={20} className="text-brand-400" />
               Run Retention Analysis
             </button>
             <Icon name="insights" size={200} className="absolute -left-12 -bottom-12 text-brand-500 pointer-events-none" />
          </div>
        </div>
      )}

    </div>
  );
};
