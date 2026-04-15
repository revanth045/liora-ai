import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';



export default function CreatorHub() {
  const [activeTab, setActiveTab] = useState<'dash' | 'builder' | 'wallet'>('dash');
  
  // Builder State
  const [guideTitle, setGuideTitle] = useState('');
  const [guideItems, setGuideItems] = useState<string[]>([]);

  return (
    <div className="h-full flex flex-col bg-cream-50">
      
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-lora font-bold text-stone-800 mb-1">Creator Studio</h1>
            <p className="text-stone-400 font-medium">Curate experiences, inspire others, earn rewards.</p>
          </div>
          <button 
            onClick={() => setActiveTab('builder')}
            className="px-6 py-3 bg-cream-100 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-cream-200 transition-all active:scale-95"
          >
            <Icon name="add" size={20} /> Create New Guide
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-6 border-b border-cream-200 overflow-x-auto scrollbar-hide">
          {[
            { id: 'dash', label: 'Dashboard', icon: 'dashboard' },
            { id: 'builder', label: 'My Guides', icon: 'edit_note' },
            { id: 'wallet', label: 'Perks & Wallet', icon: 'account_balance_wallet' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-2 text-sm font-bold tracking-wide transition-all relative whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-stone-800' 
                  : 'text-stone-400 hover:text-stone-800'
              }`}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cream-100" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
        
        {/* --- DASHBOARD VIEW --- */}
        {activeTab === 'dash' && (
          <div className="space-y-8 animate-page-slide">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3 text-stone-400">
                  <Icon name="visibility" size={18} /> 
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Views</span>
                </div>
                <div className="text-3xl font-lora font-bold text-stone-800">0</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3 text-stone-400">
                  <Icon name="bookmark" size={18} /> 
                  <span className="text-[10px] font-bold uppercase tracking-widest">Guide Saves</span>
                </div>
                <div className="text-3xl font-lora font-bold text-stone-800">0</div>
              </div>
              <div className="bg-cream-100 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 text-white/70">
                    <Icon name="monetization_on" size={18} /> 
                    <span className="text-[10px] font-bold uppercase tracking-widest">Earnings</span>
                    </div>
                    <div className="text-3xl font-lora font-bold">$0.00</div>
                </div>
                <Icon name="sparkles" size={100} className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none" />
              </div>
            </div>

            {/* Recent Performance */}
            <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-cream-200 flex justify-between items-center bg-white/30">
                <h3 className="font-lora text-xl font-bold text-stone-800">Top Performing Content</h3>
              </div>
              <div className="p-12 text-center text-stone-400">
                <Icon name="edit_note" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No guides published yet.</p>
                <p className="text-xs mt-1">Create your first guide to start earning.</p>
              </div>
            </div>
          </div>
        )}

        {/* --- BUILDER VIEW --- */}
        {activeTab === 'builder' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-page-slide">
            <div className="bg-white p-8 rounded-3xl border border-cream-200 shadow-sm space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Guide Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. The Best Pizza in Manhattan"
                  className="w-full p-4 bg-cream-50/50 rounded-2xl text-2xl font-lora font-bold text-stone-800 outline-none placeholder-stone-400 border border-transparent focus:border-cream-200/10 transition-all"
                  value={guideTitle}
                  onChange={(e) => setGuideTitle(e.target.value)}
                />
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Cover Image</label>
                 <div className="h-40 bg-cream-50/50 rounded-2xl border-2 border-dashed border-cream-200 flex flex-col items-center justify-center text-stone-400 cursor-pointer hover:border-cream-200 hover:text-stone-800 transition-all group">
                   <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                     <Icon name="add_photo_alternate" size={24} />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Upload Cover Image</span>
                 </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-cream-200 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-lora text-xl font-bold text-stone-800">Curated Spots</h3>
                 <button className="text-[10px] font-bold text-brand-400 uppercase tracking-widest flex items-center gap-2 hover:underline">
                   <Icon name="add" size={14} /> Add Place
                 </button>
               </div>
               
               {guideItems.length === 0 ? (
                 <div className="text-center py-12 text-stone-400 text-sm italic bg-cream-100/50 rounded-2xl border border-dashed border-cream-200">
                   No places added yet. Search for restaurants to build your list.
                 </div>
               ) : (
                 <div className="space-y-4">
                    {/* Render items would go here */}
                 </div>
               )}
               
               {/* Search Simulation */}
               <div className="relative mt-6">
                 <input 
                   type="text" 
                   placeholder="Search for a restaurant..." 
                   className="w-full p-4 pl-12 bg-cream-50/50 rounded-2xl text-sm outline-none border border-transparent focus:border-cream-200/10 font-medium"
                 />
                 <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="flex-1 py-4 border border-cream-200 text-stone-400 font-bold rounded-2xl hover:bg-white hover:text-stone-800 transition-all uppercase text-[10px] tracking-[0.2em]">Save Draft</button>
              <button className="flex-1 py-4 bg-cream-100 text-white font-bold rounded-2xl shadow-lg hover:bg-cream-200 transition-all uppercase text-[10px] tracking-[0.2em] active:scale-95">Publish Guide</button>
            </div>
          </div>
        )}

        {/* --- WALLET VIEW --- */}
        {activeTab === 'wallet' && (
          <div className="space-y-8 animate-page-slide max-w-4xl mx-auto">
             {/* Balance Card */}
             <div className="bg-gradient-to-br from-[#18181b] to-cream-100 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                   <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Available Balance</p>
                   <h2 className="text-5xl font-lora font-bold mb-8">$0.00</h2>
                   <div className="flex flex-wrap gap-4">
                        <button className="px-8 py-3 bg-white text-stone-800 rounded-xl text-sm font-bold shadow-lg hover:bg-cream-50 transition-all active:scale-95">
                            Cash Out
                        </button>
                        <button className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-bold backdrop-blur-md hover:bg-white/20 transition-all">
                            Transaction History
                        </button>
                   </div>
                </div>
                <Icon name="account_balance_wallet" size={240} className="absolute -right-16 -bottom-16 text-white/5 pointer-events-none" />
             </div>

             <div className="space-y-6">
                <h3 className="font-lora text-2xl text-stone-800 font-bold px-1">Exclusive Creator Perks</h3>
                <div className="bg-white rounded-3xl border border-cream-200 p-12 text-center text-stone-400">
                  <Icon name="card_giftcard" size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No perks available yet.</p>
                  <p className="text-xs mt-1">Perks unlock as you publish and grow your audience.</p>
                </div>
             </div>
          </div>
        )}

      </div>
      <div className="h-20" />
    </div>
  );
};