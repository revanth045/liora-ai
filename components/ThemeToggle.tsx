import React from 'react';
import { useTheme, Theme } from '../hooks/useTheme';
import { Icon } from './Icon';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const options: { value: Theme; label: string; icon: string }[] = [
        { value: 'light', label: 'Light', icon: 'sun' },
        { value: 'dark', label: 'Dark', icon: 'moon' },
        { value: 'system', label: 'System', icon: 'desktop' },
    ];

    return (
        <div>
            <div className="flex justify-around bg-cream-100/50 dark:bg-gray-700/50 rounded-full p-1">
                {options.map(option => (
                    <label key={option.value} className="w-full text-center">
                        <input
                            type="radio"
                            name="theme-option"
                            value={option.value}
                            checked={theme === option.value}
                            onChange={() => setTheme(option.value)}
                            className="sr-only"
                        />
                        <span
                            className={`flex items-center justify-center gap-2 w-full py-1.5 rounded-full cursor-pointer text-sm font-semibold transition-colors ${
                                theme === option.value
                                    ? 'bg-white dark:bg-gray-800 shadow text-stone-800 dark:text-gray-100'
                                    : 'text-stone-400 dark:text-stone-400'
                            }`}
                        >
                            <Icon name={option.icon} className="w-4 h-4" />
                            {option.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};
