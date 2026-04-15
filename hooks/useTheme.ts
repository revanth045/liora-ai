import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'liora-theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
                return storedTheme as Theme;
            }
        } catch (e) {
            console.error("Failed to parse theme from localStorage", e);
        }
        return 'system';
    });

    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = () => {
            const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
            root.classList.toggle('dark', isDark);
            document.body.style.colorScheme = isDark ? 'dark' : 'light';
        };

        // Apply theme immediately when the effect runs (on mount or when `theme` changes)
        updateTheme();

        // Listen for system theme changes to update if 'system' is selected
        mediaQuery.addEventListener('change', updateTheme);

        // Cleanup listener on unmount or before the effect re-runs
        return () => {
            mediaQuery.removeEventListener('change', updateTheme);
        };
    }, [theme]); // Re-run this effect whenever the user's theme choice changes

    const setTheme = (newTheme: Theme) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
            setThemeState(newTheme);
        } catch (e) {
            console.error("Failed to save theme to localStorage", e);
        }
    };

    const value = { theme, setTheme };

    return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
