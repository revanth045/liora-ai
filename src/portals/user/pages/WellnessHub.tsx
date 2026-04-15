import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';

const CRAVING_TIPS: Record<string, string> = {
  Sugar: "Often a sign of a dopamine dip or dehydration. Try a large bg-cream-50 border border-cream-200 of water and wait 10 mins.",
  Salt: "Could be stress-related (adrenal function) or electrolyte imbalance. Try coconut water.",
  Crunchy: "Often linked to frustration or anger. Try carrots, apples, or a stress ball.",
  Comfort: "Emotional need for safety. A warm blanket or tea might soothe you more than food."
};

export const WellnessHub = () => {
  const [hungerLevel, setHungerLevel] = useState(50); // 0 = Starving, 100 = Stuffed
  const [emotionalState, setEmotionalState] = useState<string | null>(null);
  const [activeCraving, setActiveCraving] = useState<string | null>(null);

  const getHungerLabel = (val: number) => {
    if (val < 20) return "Empty / Starving";
    if (val < 40) return "Lightly Hungry";
    if (val < 60) return "Neutral / Satisfied";
    if (val < 80) return "Full";
    return "Stuffed / Bloated";
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-lora text-stone-800">Nourish & Thrive</h1>
          <p className="text-stone-400">Align your body and mind before you eat.</p>
        </div>
        <div className="w-10 h-10 bg-cream-200/60 rounded-full flex items-center justify-center text-stone-800">
          <Icon name="sparkles" className="w-5 h-5" />
        </div>
      </div>

      {/* Hero: The Somatic Check-In */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-200">
        <h2 className="font-lora text-xl text-stone-800 mb-6">Check Your Signals</h2>
        
        {/* Physical Hunger Slider */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <label className="text-sm font-bold text-stone-400 uppercase tracking-wider">Physical Hunger</label>
            <span className="text-sm font-medium text-stone-800">{getHungerLabel(hungerLevel)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={hungerLevel} 
            onChange={(e) => setHungerLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-cream-50 rounded-lg appearance-none cursor-pointer accent-[#e9ae1e]"
          />
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>Starving</span>
            <span>Neutral</span>
            <span>Stuffed</span>
          </div>
        </div>

        {/* Emotional Driver */}
        <div>
          <label className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 block">What is driving you?</label>
          <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pb-2 overscroll-x-contain touch-pan-x">
            {['True Hunger', 'Boredom', 'Stress', 'Sadness', 'Celebration'].map((mood) => (
              <button
                key={mood}
                onClick={() => setEmotionalState(mood)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  emotionalState === mood 
                    ? 'bg-brand-400 text-white shadow-md' 
                    : 'bg-cream-50 text-stone-800 hover:bg-cream-200/60'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Feedback */}
        {emotionalState && emotionalState !== 'True Hunger' && (
          <div className="mt-6 p-4 bg-cream-50 rounded-xl flex items-start gap-3 animate-page-slide">
            <Icon name="sparkles" className="w-5 h-5 text-brand-400 mt-1" />
            <div>
              <p className="text-stone-800 font-medium">Pause for a moment.</p>
              <p className="text-sm text-stone-400 mt-1 leading-relaxed">
                You identified <strong>{emotionalState}</strong> as your driver. 
                Food might not solve this feeling. Would you like to try a 2-minute breathing exercise instead?
              </p>
              <button className="mt-3 text-xs font-bold text-stone-800 underline">Start Breathing Exercise</button>
            </div>
          </div>
        )}
      </div>

      {/* Toolkit Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Craving Decoder */}
        <div className="col-span-2 bg-brand-400 text-white p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Icon name="menu" className="w-20 h-20" />
          </div>
          <h3 className="font-lora text-lg mb-2 flex items-center gap-2">
            <Icon name="search" className="w-5 h-5" /> Craving Decoder
          </h3>
          <p className="text-white/80 text-sm mb-4">What do you really want?</p>
          
          {!activeCraving ? (
            <div className="flex flex-wrap gap-2">
              {Object.keys(CRAVING_TIPS).map(k => (
                <button 
                  key={k}
                  onClick={() => setActiveCraving(k)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs backdrop-blur-sm font-semibold transition-colors"
                >
                  {k}
                </button>
              ))}
            </div>
          ) : (
            <div className="animate-page-slide">
              <p className="text-sm font-bold text-white mb-2">💡 Decoding "{activeCraving}":</p>
              <p className="text-xs text-white/90 leading-relaxed font-medium">{CRAVING_TIPS[activeCraving]}</p>
              <button 
                onClick={() => setActiveCraving(null)} 
                className="mt-4 text-[10px] uppercase font-bold text-white/60 hover:text-white flex items-center gap-1"
              >
                <Icon name="x" className="w-3 h-3" /> Reset Decoder
              </button>
            </div>
          )}
        </div>

        {/* Mini Tools */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-cream-200">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <Icon name="sparkles" className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-stone-800 text-sm">Hydration Check</h4>
          <p className="text-[10px] text-stone-400 mt-1 font-medium">Thirst often masks itself as hunger.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-cream-200">
          <div className="w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
            <Icon name="clipboard-list" className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-stone-800 text-sm">Post-Meal Log</h4>
          <p className="text-[10px] text-stone-400 mt-1 font-medium">How did that last meal make you feel?</p>
        </div>
      </div>

      {/* The Pattern (History) */}
      <div>
        <h3 className="font-lora text-lg text-stone-800 mb-4">Your Pattern</h3>
        <div className="space-y-3">
          {[
            { time: '2:30 PM', food: 'Pasta Carbonara', feel: 'Sluggish', icon: 'sentiment_neutral' },
            { time: '10:00 AM', food: 'Greek Yogurt Bowl', feel: 'Energized', icon: 'sparkles' },
          ].map((entry, i) => (
            <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-cream-200 shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.feel === 'Energized' ? 'bg-green-100 text-green-700' : 'bg-cream-100/50 text-stone-400'}`}>
                <Icon name={entry.icon === 'sparkles' ? 'sparkles' : 'user-circle'} className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-stone-800 text-sm">{entry.food}</span>
                  <span className="text-[10px] font-bold text-stone-400">{entry.time}</span>
                </div>
                <p className="text-xs text-stone-400">Result: <span className="font-bold text-stone-800">{entry.feel}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Affirmation */}
      <div className="text-center py-6 opacity-70">
        <Icon name="sparkles" className="w-6 h-6 text-brand-400 mx-auto mb-2 opacity-40" />
        <p className="font-lora italic text-stone-800 text-sm">"I trust my body to tell me what it needs."</p>
      </div>
    </div>
  );
};
