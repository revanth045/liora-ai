
import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';

// Mock Data for "Liora Match"
const MATCHES = [
  {
    id: 1,
    name: 'Sarah, 28',
    bio: 'Foodie who loves omakase and jazz bars. Looking for someone to explore the city with.',
    matchScore: 94,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    sharedInterests: ['Sushi', 'Live Jazz', 'Hiking']
  },
  {
    id: 2,
    name: 'James, 31',
    bio: 'Architect. I judge a first date by their coffee order. Let‚ ôs find the best espresso martini.',
    matchScore: 88,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    sharedInterests: ['Architecture', 'Coffee', 'Design']
  }
];

const TOOLS = [
  { id: 'icebreakers', label: 'Icebreaker Generator', icon: 'chat', color: 'bg-blue-100 text-blue-600' },
  { id: 'bio', label: 'Profile Bio Polish', icon: 'edit', color: 'bg-purple-100 text-purple-600' },
  { id: 'redflags', label: 'Red Flag Checker', icon: 'flag', color: 'bg-red-100 text-red-600' },
  { id: 'reply', label: 'Smart Reply Assist', icon: 'send', color: 'bg-green-100 text-green-600' },
];

export const DatingHub = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-400 to-brand-400 flex items-center justify-center shadow-lg">
          <Icon name="favorite" size={36} className="text-white" />
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl font-semibold text-stone-800 mb-3">
          Dating &amp; Connections
        </h1>

        {/* Message */}
        <p className="text-stone-600 text-base leading-relaxed mb-4">
          Good food brings people together‚ ¶ what if it also sparks something more?&nbsp;   
        </p>
        <p className="text-stone-400 text-sm leading-relaxed mb-8">
          We&apos;re going live soon ‚ î get ready to discover delicious moments and maybe even a little romance.
        </p>

        {/* Coming Soon badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-900 text-cream-50 text-sm font-semibold shadow-sm">
          <Icon name="sparkles" className="w-4 h-4 text-brand-400" />
          Coming Soon
        </div>

        {/* Subtle footer note */}
        <p className="mt-6 text-xs text-stone-300">Stay tuned ‚ î something delicious is cooking   ΩÔ∏è</p>
      </div>
    </div>
  );
};

export default DatingHub;
