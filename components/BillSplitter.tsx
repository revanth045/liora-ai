import React, { useState } from 'react';
import { Icon } from './Icon';

interface BillSplitterProps {
    total?: number;
    onClose: () => void;
}

export const BillSplitter: React.FC<BillSplitterProps> = ({ total = 145.50, onClose }) => {
  const [splitType, setSplitType] = useState<'equal' | 'item'>('equal');
  const [people, setPeople] = useState(2);

  return (
    <div className="bg-white rounded-3xl border border-cream-200 shadow-2xl overflow-hidden max-w-sm w-full mx-auto animate-fade-in relative z-50">
      <div className="bg-cream-100 p-5 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                <Icon name="pie_chart" size={20} className="text-brand-400" />
            </div>
            <h3 className="font-lora text-lg font-bold">Smart Split</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><Icon name="close" size={20} /></button>
      </div>

      <div className="p-6 space-y-8">
        {/* Toggle */}
        <div className="flex bg-cream-50 p-1 rounded-2xl border border-cream-200/50">
          <button 
            onClick={() => setSplitType('equal')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${splitType === 'equal' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
          >
            Equal
          </button>
          <button 
            onClick={() => setSplitType('item')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${splitType === 'item' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
          >
            By Item
          </button>
        </div>

        {/* Content */}
        {splitType === 'equal' ? (
          <div className="text-center space-y-8 py-4">
            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => setPeople(Math.max(1, people - 1))} 
                className="w-12 h-12 rounded-2xl border border-cream-200 flex items-center justify-center text-stone-800 hover:bg-cream-50 transition-colors shadow-sm active:scale-95"
              >
                <Icon name="remove" size={24} />
              </button>
              <div className="w-20">
                <span className="block text-4xl font-lora font-bold text-stone-800">{people}</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Guests</span>
              </div>
              <button 
                onClick={() => setPeople(people + 1)} 
                className="w-12 h-12 rounded-2xl border border-cream-200 flex items-center justify-center text-stone-800 hover:bg-cream-50 transition-colors shadow-sm active:scale-95"
              >
                <Icon name="plus" size={24} />
              </button>
            </div>

            <div className="p-8 bg-cream-50/50 rounded-[2rem] border border-cream-200/50 relative overflow-hidden group">
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em] mb-2 relative z-10">Per Person</p>
              <p className="text-5xl font-lora font-bold text-stone-800 relative z-10">${(total / people).toFixed(2)}</p>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-cream-100/50 rounded-3xl border border-dashed border-cream-200">
            <Icon name="drag_handle" size={40} className="mx-auto mb-4 text-stone-400" />
            <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Interactive Item Split</p>
            <p className="text-xs text-stone-400 mt-2 px-6">Drag items to guest avatars to assign. Coming in the next update!</p>
          </div>
        )}

        <button 
            onClick={() => { alert("Payment requests sent!"); onClose(); }}
            className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold shadow-xl shadow-yellow-900/10 hover:bg-brand-500 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
        >
          Send Payment Requests
        </button>
      </div>
    </div>
  );
};