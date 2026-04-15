import React from 'react';
import { Icon } from '../../../../components/Icon';

export default function DateNightPage() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-400 to-brand-400 flex items-center justify-center shadow-lg">
                    <Icon name="favorite" size={36} className="text-white" />
                </div>
                <h1 className="font-display text-2xl font-semibold text-stone-800 mb-3">
                    Date Night Planner
                </h1>
                <p className="text-stone-600 text-base leading-relaxed mb-4">
                    Good food brings people togetherâ ¦ what if it also sparks something more?&nbsp;ð   
                </p>
                <p className="text-stone-400 text-sm leading-relaxed mb-8">
                    We&apos;re going live soon â ” get ready to discover delicious moments and maybe even a little romance.
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-900 text-cream-50 text-sm font-semibold shadow-sm">
                    <Icon name="sparkles" className="w-4 h-4 text-brand-400" />
                    Coming Soon
                </div>
                <p className="mt-6 text-xs text-stone-300">Stay tuned â ” something delicious is cooking ð  ½️</p>
            </div>
        </div>
    );
}