import React, { useState, useEffect } from 'react';
import { CalorieLog } from '../../../../components/CalorieLog';
import { Calendar } from '../../../../components/Calendar';
import { useCalorieData } from '../../../../hooks/useCalorieData';
import { CalorieLogResult } from '../../../../types';
import { WeeklyProgressGraph } from '../../../../components/WeeklyProgressGraph';

const formatDate = (date: Date): string => {
    // Adjust for timezone offset to prevent off-by-one day errors
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
};

export default function CalorieLogPage() {
    const { logs, goal, saveLog, saveGoal, deleteLog } = useCalorieData();
    const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
    const [displayDate, setDisplayDate] = useState(new Date());
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(goal);
    
    const selectedLog = logs[selectedDate] || null;

    const handleMonthChange = (direction: 'prev' | 'next') => {
        setDisplayDate(current => {
            const newDate = new Date(current);
            newDate.setDate(1); // Avoid issues with different month lengths
            newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
            return newDate;
        });
    };
    
    const handleSaveLog = (result: CalorieLogResult) => {
        saveLog(selectedDate, result);
    };
    
    const handleDeleteLog = () => {
        if (window.confirm("Are you sure you want to delete the log for this day?")) {
            deleteLog(selectedDate);
        }
    };
    
    const handleGoalSave = () => {
        saveGoal(tempGoal);
        setIsEditingGoal(false);
    };
    
    useEffect(() => {
        setTempGoal(goal);
    }, [goal]);

    return (
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
                <WeeklyProgressGraph logs={logs} goal={goal} />

                 <div className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-sm">
                    <h3 className="font-lora text-lg text-stone-800 mb-2">Daily Calorie Goal</h3>
                    {isEditingGoal ? (
                        <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                value={tempGoal} 
                                onChange={(e) => setTempGoal(Number(e.target.value))}
                                className="w-full p-2 border border-cream-200 rounded-md shadow-sm focus:ring-brand-400/30 bg-white text-stone-800"
                             />
                             <button onClick={handleGoalSave} className="bg-brand-400 text-white font-bold py-2 px-3 rounded-lg hover:bg-opacity-90">Save</button>
                             <button onClick={() => setIsEditingGoal(false)} className="bg-cream-200/60 text-stone-600 font-bold py-2 px-3 rounded-lg hover:bg-cream-200/60">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-bold text-stone-800">{goal.toLocaleString()} <span className="text-base font-normal text-stone-600">kcal</span></p>
                            <button onClick={() => setIsEditingGoal(true)} className="text-stone-600 hover:text-stone-800">Edit</button>
                        </div>
                    )}
                </div>

                <Calendar 
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    logs={logs}
                    goal={goal}
                    onMonthChange={handleMonthChange}
                    displayDate={displayDate}
                />
            </div>
            <div className="lg:col-span-2">
                 <CalorieLog 
                    key={selectedDate} // Force re-mount when date changes
                    date={selectedDate}
                    existingLog={selectedLog}
                    onSave={handleSaveLog}
                    onDelete={handleDeleteLog}
                />
            </div>
        </div>
    );
}