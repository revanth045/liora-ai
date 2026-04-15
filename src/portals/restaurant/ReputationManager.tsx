import React, { useState } from 'react';
import { Icon } from '../../../components/Icon';
import type { DemoRestaurant } from '../../demoDb';

const REVIEWS = [
  { id: 1, user: 'Sarah J.', rating: 5, date: '2h ago', text: 'The Wagyu Burger was incredible! The AI waiter service was super fast and knew exactly which wine to pair with my meal. Will be back!', source: 'Liora App', status: 'unread' },
  { id: 2, user: 'Mike T.', rating: 3, date: 'Yesterday', text: 'Food was good, but the music was way too loud. Hard to have a conversation. The staff was friendly though.', source: 'Google', status: 'unread' },
  { id: 3, user: 'Emily R.', rating: 5, date: '2 days ago', text: 'Loved the atmosphere. The truffle fries are a must-try. Liora makes ordering so easy.', source: 'Liora App', status: 'replied' },
];

export default function RestoReputation({ restaurant }: { restaurant: DemoRestaurant }) {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide pb-24">
      
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
           <div>
             <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Overall Rating</p>
             <h3 className="text-4xl font-lora font-bold text-stone-800">4.8 <span className="text-sm text-stone-400 font-sans font-normal">/ 5.0</span></h3>
           </div>
           <div className="flex text-yellow-400 gap-0.5">
             {[1,2,3,4,5].map(s => <Icon key={s} name="star-solid" size={20} />)}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm group hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sentiment Analysis</p>
             <Icon name="insights" size={16} className="text-green-500" />
           </div>
           <div className="flex items-center gap-4">
             <span className="text-lg font-bold text-green-600">85% Positive</span>
             <div className="flex-1 h-2.5 bg-cream-100/50 rounded-full overflow-hidden shadow-inner">
               <div className="w-[85%] h-full bg-green-500 rounded-full shadow-sm"></div>
             </div>
           </div>
           <p className="text-[10px] text-stone-400 font-bold mt-3 uppercase tracking-widest">Top Keyword: <span className="text-stone-800">"Service"</span></p>
        </div>

        <div className="bg-cream-50 p-8 rounded-[2rem] border border-[#e9ae1e]/30 flex items-center gap-4 relative overflow-hidden">
           <div className="p-3 bg-white rounded-2xl text-brand-400 shadow-sm z-10"><Icon name="auto_awesome" size={24} /></div>
           <div className="z-10">
             <p className="font-bold text-stone-800 text-sm mb-1">Auto-Reply is ACTIVE</p>
             <p className="text-xs text-stone-400 leading-relaxed">Liora is drafting replies for all 5-star reviews instantly.</p>
           </div>
           <Icon name="sparkles" size={120} className="absolute -right-6 -bottom-6 text-brand-400/5 pointer-events-none" />
        </div>
      </div>

      {/* Reviews Feed Section */}
      <div className="bg-white rounded-[2.5rem] border border-cream-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="px-8 py-5 border-b border-cream-200 bg-cream-100/50 flex gap-8">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: 'unread', label: 'Unanswered' },
            { id: 'critical', label: 'Critical' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all ${
                activeTab === tab.id 
                  ? 'text-stone-800 border-b-2 border-cream-200' 
                  : 'text-stone-400 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed List */}
        <div className="divide-y divide-cream-200">
          {REVIEWS.filter(r => activeTab === 'all' || (activeTab === 'unread' && r.status === 'unread') || (activeTab === 'critical' && r.rating < 4)).map(review => (
            <div key={review.id} className="p-8 hover:bg-cream-50/20 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cream-50 rounded-2xl flex items-center justify-center text-stone-400 font-lora font-bold text-xl border border-cream-200 shadow-sm group-hover:bg-white transition-colors">
                    {review.user.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-lg mb-0.5">{review.user}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex text-brand-400">
                        {[...Array(5)].map((_, i) => (
                          <Icon key={i} name={i < review.rating ? "star-solid" : "star"} size={14} className={i >= review.rating ? 'opacity-20' : ''} />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{review.source} ââ ¬¢ {review.date}</span>
                    </div>
                  </div>
                </div>
                {review.status === 'unread' && (
                  <span className="bg-cream-100 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg animate-pulse-subtle">New</span>
                )}
              </div>
              
              <p className="text-stone-400 text-sm mb-6 pl-16 leading-relaxed max-w-3xl">"{review.text}"</p>
              
              {review.status === 'unread' && (
                <div className="pl-16 flex flex-wrap gap-3">
                  <button className="px-6 py-2.5 bg-cream-100 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-cream-200 transition-all shadow-md active:scale-95">
                    <Icon name="auto_awesome" size={16} className="text-brand-400" /> Generate AI Reply
                  </button>
                  <button className="px-6 py-2.5 bg-white border border-cream-200 text-stone-800 rounded-xl text-xs font-bold hover:bg-cream-50 transition-all active:scale-95">
                    Reply Manually
                  </button>
                  <button className="p-2.5 text-stone-400 hover:text-red-500 transition-colors" title="Flag Review">
                    <Icon name="flag" size={18} />
                  </button>
                </div>
              )}
              
              {review.status === 'replied' && (
                <div className="ml-16 mt-4 p-5 bg-cream-100/80 rounded-2xl border border-dashed border-cream-200 flex items-start gap-3">
                    <Icon name="check" size={16} className="text-green-500 mt-1" />
                    <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">AI Replied (2 days ago)</p>
                        <p className="text-xs text-stone-400 italic">"Thank you so much Emily! We're thrilled you enjoyed the truffle fries and our new Liora integration..."</p>
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}