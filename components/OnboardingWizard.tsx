import React, { useState } from 'react';
import { Icon } from './Icon';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

export const OnboardingWizard = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [focus, setFocus] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Mock "AI Thinking" delay to feel more personalized
  const nextStep = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setStep(prev => prev + 1);
    }, 800);
  };

  const handleFinish = () => {
    // Simulate final AI calibration
    setStep(4);
    setTimeout(() => {
      onComplete({ name, preferences, focus });
    }, 2500);
  };

  const togglePref = (pref: string) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center items-center p-6 font-sans">
      
      <div className="max-w-md w-full space-y-8">
        
        {/* Liora Avatar */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-cream-100 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-400/10 animate-bounce-slow">
            <span className="font-lora text-3xl font-bold">L</span>
          </div>
        </div>

        {/* Step 0: Name Intake */}
        {step === 0 && !isTyping && (
          <div className="space-y-6 animate-page-slide">
            <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-cream-200">
              <p className="text-stone-800 text-lg font-medium">
                Hi, I'm Liora. I'm here to curate your dining and social life. <br/><br/>
                First, what should I call you?
              </p>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name && nextStep()}
                placeholder="Type your name..."
                className="flex-1 p-4 rounded-2xl border border-cream-200 focus:outline-none focus:border-cream-200 text-stone-800 bg-white shadow-inner"
                autoFocus
              />
              <button 
                onClick={nextStep}
                disabled={!name}
                className="p-4 bg-cream-100 text-white rounded-2xl disabled:opacity-50 hover:bg-cream-200 transition-colors shadow-lg active:scale-95"
              >
                <Icon name="arrow_forward" size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Dietary Preferences */}
        {step === 1 && !isTyping && (
          <div className="space-y-6 animate-page-slide">
            <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-cream-200">
              <p className="text-stone-800 text-lg font-medium">
                Nice to meet you, <span className="font-bold capitalize">{name}</span>. 👋 <br/><br/>
                To personalize the Food Hub, do you have any dietary preferences I should know about?
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {['Vegetarian', 'Vegan', 'Keto', 'Gluten-Free', 'No Restrictions'].map(diet => (
                <button
                  key={diet}
                  onClick={() => togglePref(diet)}
                  className={`p-4 rounded-2xl text-sm font-bold transition-all border ${
                    preferences.includes(diet)
                      ? 'bg-cream-100 text-white shadow-lg border-cream-200'
                      : 'bg-white border-cream-200 text-stone-400 hover:border-cream-200'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
            <button 
              onClick={nextStep}
              className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-500 transition-all shadow-md active:scale-95"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Goal/Focus Selection */}
        {step === 2 && !isTyping && (
          <div className="space-y-6 animate-page-slide">
             <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-cream-200">
              <p className="text-stone-800 text-lg font-medium">
                Got it. And what is your primary focus right now? <br/>
                I'll adjust your dashboard accordingly.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'social', label: 'Exploring & Dining', icon: 'restaurant_menu' },
                { id: 'dating', label: 'Dating & Connections', icon: 'favorite' },
                { id: 'wellness', label: 'Health & Wellness', icon: 'spa' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setFocus(opt.id); handleFinish(); }}
                  className="w-full p-4 bg-white border border-cream-200 rounded-2xl flex items-center gap-4 hover:border-cream-200 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-cream-50 rounded-xl flex items-center justify-center text-stone-800 group-hover:bg-cream-100 group-hover:text-white transition-colors">
                    <Icon name={opt.icon} size={24} />
                  </div>
                  <span className="font-bold text-stone-800 text-lg">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Global Typing State */}
        {isTyping && (
          <div className="flex gap-2 items-center text-stone-400 animate-fade-in p-6 bg-cream-50 border border-cream-200 rounded-2xl border border-dashed border-cream-200">
             <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></div>
             <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
             <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
             <span className="ml-2 text-sm font-bold uppercase tracking-widest">Liora is thinking...</span>
          </div>
        )}

        {/* Step 4: Final Calibration */}
        {step === 4 && (
          <div className="text-center space-y-6 animate-fade-in">
             <div className="relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-cream-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-cream-200 border-t-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Icon name="auto_awesome" size={32} className="text-brand-400" />
               </div>
             </div>
             <div>
               <h3 className="text-3xl font-lora text-stone-800 mb-2 font-bold">Calibrating...</h3>
               <p className="text-stone-400 font-medium">Curating local gems for {name}...<br/>Aligning wellness goals...</p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};