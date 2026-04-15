import React from 'react';
import { View } from '../../../../types';

export const HotelsHub = ({ onNavigate }: { onNavigate: (tab: View) => void }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="max-w-xl mx-auto w-full">

        {/* Floating emoji row */}
        <div className="flex justify-center gap-4 mb-8 text-4xl select-none">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>ğ  ¨</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>â ¨</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>ğ  â€¢</span>
          <span className="animate-bounce" style={{ animationDelay: '450ms' }}>ğ   </span>
          <span className="animate-bounce" style={{ animationDelay: '600ms' }}>ğ   ï¸</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-cream-200 rounded-3xl shadow-sm p-8 md:p-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-forest-900 text-cream-50 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <span>ğ   </span> Coming Soon
          </div>

          <h1 className="text-3xl md:text-4xl font-lora font-bold text-stone-800 leading-tight">
            Curated Escapes
          </h1>

          <p className="text-stone-500 leading-relaxed text-base">
            Shh&hellip; our secret hideaways aren&rsquo;t fully revealed yet&nbsp;ğ   
          </p>

          <div className="w-full h-px bg-cream-200 my-2" />

          <p className="text-stone-500 leading-relaxed">
            But don&rsquo;t worry&mdash;we&rsquo;re about to go live, tying up the best hotels just for you,
            with a little AI magic to make every stay feel like a love story&nbsp;â ¨
          </p>

          <p className="text-stone-500 leading-relaxed">
            We can&rsquo;t wait to see you back&mdash;your next dreamy escape
            (and maybe a little adventure of the heart&nbsp;ğ  â€¢) is just around the corner!
          </p>

          {/* Decorative tag row */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              { emoji: 'ğ   ï¸', label: 'Beach Retreats' },
              { emoji: 'ğ   ï¸', label: 'Mountain Hideaways' },
              { emoji: 'ğ   ', label: 'City Stays' },
              { emoji: 'ğ  ¿', label: 'Wellness Resorts' },
              { emoji: 'ğ   ', label: 'Luxury Suites' },
            ].map(({ emoji, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-50 border border-cream-200 rounded-full text-xs font-semibold text-stone-500"
              >
                {emoji} {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

