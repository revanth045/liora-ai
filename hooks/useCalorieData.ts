import { useState, useEffect, useCallback } from 'react';
import { CalorieLogResult } from '../types';

const LOG_STORAGE_KEY = 'liora-calorie-logs';
const GOAL_STORAGE_KEY = 'liora-calorie-goal';

type CalorieLogStore = {
    [date: string]: CalorieLogResult;
};

export const useCalorieData = () => {
    const [logs, setLogs] = useState<CalorieLogStore>({});
    const [goal, setGoal] = useState<number>(2000);

    useEffect(() => {
        try {
            const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
            if (storedLogs) {
                setLogs(JSON.parse(storedLogs));
            }
            const storedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
            if (storedGoal) {
                setGoal(JSON.parse(storedGoal));
            }
        } catch (e) {
            console.error("Failed to load calorie data from localStorage", e);
        }
    }, []);

    const saveLog = useCallback((date: string, result: CalorieLogResult) => {
        setLogs(prevLogs => {
            const newLogs = { ...prevLogs, [date]: result };
            try {
                localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(newLogs));
            } catch (e) {
                console.error("Failed to save calorie log to localStorage", e);
            }
            return newLogs;
        });
    }, []);
    
    const deleteLog = useCallback((date: string) => {
        setLogs(prevLogs => {
            const newLogs = { ...prevLogs };
            delete newLogs[date];
            try {
                localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(newLogs));
            } catch (e) {
                console.error("Failed to delete calorie log from localStorage", e);
            }
            return newLogs;
        });
    }, []);

    const saveGoal = useCallback((newGoal: number) => {
        setGoal(newGoal);
        try {
            localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(newGoal));
        } catch (e) {
            console.error("Failed to save calorie goal to localStorage", e);
        }
    }, []);

    return { logs, goal, saveLog, saveGoal, deleteLog };
};