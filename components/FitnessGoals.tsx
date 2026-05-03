
import React, { useState } from 'react';
import { Icon } from './Icon';

interface FitnessGoalsProps {
    goals: { calories: number; protein: number; carbs: number; fats: number };
    onUpdate: (goals: any) => void;
}

export const FitnessGoals: React.FC<FitnessGoalsProps> = ({ goals, onUpdate }) => {
  const [localGoals, setLocalGoals] = useState(goals);

  const handleSave = () => {
      onUpdate(localGoals);
      alert("Goals updated successfully!");
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-cream-200 space-y-8 animate-fade-in">
      <div>
          <h2 className="font-lora text-2xl font-bold text-stone-800">Set Your Targets</h2>
          <p className="text-sm text-stone-600">Customize your daily intake goals.</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl border border-cream-200">
          <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-2">Daily Calorie Goal</label>
          <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={localGoals.calories} 
                onChange={(e) => setLocalGoals({...localGoals, calories: Number(e.target.value)})}
                className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-stone-800"
              />
              <span className="text-lg font-semibold text-stone-600">kcal</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {[
              { label: 'Protein', key: 'protein', unit: 'g', color: 'text-blue-600' },
              { label: 'Carbs', key: 'carbs', unit: 'g', color: 'text-green-600' },
              { label: 'Fats', key: 'fats', unit: 'g', color: 'text-red-600' }
          ].map(macro => (
            <div key={macro.key} className="bg-cream-100/80 p-3 rounded-xl border border-cream-200/60">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${macro.color}`}>{macro.label}</label>
              <div className="flex items-baseline gap-1">
                  <input 
                    type="number" 
                    value={(localGoals as any)[macro.key]} 
                    onChange={(e) => setLocalGoals({...localGoals, [macro.key]: Number(e.target.value)})}
                    className="w-full text-lg font-bold bg-transparent border-none focus:ring-0 p-0 text-stone-800" 
                  />
                  <span className="text-xs font-medium text-stone-600">{macro.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <button 
            onClick={handleSave}
            className="w-full py-4 bg-brand-400 text-white rounded-xl font-bold shadow-md hover:bg-cream-200 transition-all flex items-center justify-center gap-2"
        >
            <Icon name="sparkles" className="w-5 h-5 text-brand-400" />
            Apply Targets
        </button>
      </div>

      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
          <Icon name="support" className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-stone-600 leading-relaxed">
              <strong>Tip:</strong> Balanced macros help maintain steady energy levels throughout the day. Need help calculating? Ask Liora in the AI Concierge!
          </p>
      </div>
    </div>
  );
};
