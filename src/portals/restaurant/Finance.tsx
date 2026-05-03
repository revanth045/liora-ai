import React from 'react';
import { Icon } from '../../../components/Icon';
import type { DemoRestaurant } from '../../demoDb';

export default function RestoFinance({ restaurant }: { restaurant: DemoRestaurant }) {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-page-slide pb-24">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-stone-800 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mb-1">Total Revenue (Feb)</p>
            <h2 className="text-4xl font-lora font-bold text-white">$42,890.00</h2>
            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-bold">
              <Icon name="trending_up" size={16} /> +18.2% <span className="opacity-60 font-normal">vs Jan</span>
            </div>
          </div>
          <Icon name="attach_money" size={160} className="absolute -right-8 -bottom-8 text-white/5 transition-transform duration-700 group-hover:scale-110 pointer-events-none" />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-1">Operating Expenses</p>
            <h2 className="text-4xl font-lora font-bold text-stone-800">$28,450</h2>
          </div>
          <div className="mt-6">
            <div className="w-full bg-cream-50 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div className="bg-orange-500 h-full w-[65%] rounded-full shadow-sm"></div>
            </div>
            <p className="text-[10px] font-bold text-stone-600 mt-2 uppercase tracking-widest">65% of Revenue <span className="text-stone-800">(Target: 60%)</span></p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-1">Net Profit</p>
            <h2 className="text-4xl font-lora font-bold text-green-700">$14,440</h2>
          </div>
          <button className="mt-6 text-[10px] font-bold uppercase tracking-widest text-stone-800 bg-cream-50 px-4 py-2.5 rounded-xl hover:bg-cream-200/60 transition-all flex items-center justify-center gap-2 active:scale-95 border border-cream-200/50">
            <Icon name="download" size={14} /> P&L Statement
          </button>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Revenue Breakdown */}
        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
          <h3 className="font-lora text-xl text-stone-800 mb-8 font-bold">Revenue Sources</h3>
          <div className="space-y-6">
            {[
              { label: 'Dine-In', val: '65%', amt: '$27,878', color: 'bg-cream-100' },
              { label: 'Online / Takeout', val: '25%', amt: '$10,722', color: 'bg-brand-500' },
              { label: 'Bar / Alcohol', val: '10%', amt: '$4,290', color: 'bg-stone-400' },
            ].map((item, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end text-sm mb-2">
                  <span className="font-bold text-stone-800">{item.label}</span>
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">{item.amt} <span className="opacity-50">• {item.val}</span></span>
                </div>
                <div className="w-full bg-cream-50 rounded-full h-4 shadow-inner overflow-hidden">
                  <div 
                    className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out shadow-sm group-hover:opacity-90`} 
                    style={{ width: item.val }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-cream-200 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">Analytics Insights</span>
              <Icon name="sparkles" size={16} className="text-brand-400" />
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-cream-200 flex justify-between items-center bg-cream-100/50">
            <h3 className="font-lora text-xl text-stone-800 font-bold">Recent Payouts</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-brand-400 hover:underline">View All</button>
          </div>
          <div className="divide-y divide-cream-200 flex-1">
            {[
              { date: 'Feb 14', status: 'Paid', amount: '$4,200.00', bank: 'Chase Bank (...9921)' },
              { date: 'Feb 07', status: 'Paid', amount: '$3,850.50', bank: 'Chase Bank (...9921)' },
              { date: 'Jan 31', status: 'Paid', amount: '$4,120.00', bank: 'Chase Bank (...9921)' },
              { date: 'Jan 24', status: 'Paid', amount: '$3,980.20', bank: 'Chase Bank (...9921)' },
            ].map((tx, i) => (
              <div key={i} className="p-5 flex justify-between items-center hover:bg-cream-50/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-cream-50 rounded-xl text-stone-800">
                    <Icon name="sync" size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-sm">Weekly Settlement</p>
                    <p className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">{tx.date} • {tx.bank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-800 text-lg">{tx.amount}</p>
                  <span className="inline-flex items-center gap-1.5 text-[9px] text-green-600 font-bold uppercase bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}