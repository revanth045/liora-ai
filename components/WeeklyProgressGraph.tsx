import React from 'react';
import { CalorieLogResult } from '../types';

interface WeeklyProgressGraphProps {
    logs: { [date: string]: CalorieLogResult };
    goal: number;
}

const formatDate = (date: Date): string => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
};

export const WeeklyProgressGraph: React.FC<WeeklyProgressGraphProps> = ({ logs, goal }) => {
    const today = new Date();
    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = formatDate(date);
        const log = logs[dateStr];
        return {
            date: dateStr,
            dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
            calories: log ? log.totals.calories : 0,
        };
    }).reverse();

    const loggedDays = last7DaysData.filter(d => d.calories > 0);
    const daysWithLog = loggedDays.length;

    let summaryText = "";
    if (daysWithLog >= 3) {
        const averageIntake = Math.round(loggedDays.reduce((acc, day) => acc + day.calories, 0) / daysWithLog);
        const daysOver = loggedDays.filter(d => d.calories > goal * 1.1).length;
        const daysOnTarget = loggedDays.filter(d => d.calories >= goal * 0.9 && d.calories <= goal * 1.1).length;
        
        if (daysOnTarget > daysWithLog / 2) {
            summaryText = `Great consistency! You've met your goal on ${daysOnTarget} of the last ${daysWithLog} logged days.`;
        } else if (daysOver > daysWithLog / 2) {
            summaryText = `You were over your goal on ${daysOver} of the last ${daysWithLog} logged days. Your average was ${averageIntake.toLocaleString()} kcal.`;
        } else {
             const trend = loggedDays[daysWithLog - 1].calories - loggedDays[0].calories;
             if (Math.abs(trend) > 200) {
                summaryText = `Your intake shows a ${trend > 0 ? 'rising' : 'falling'} trend this week. Your average was ${averageIntake.toLocaleString()} kcal.`;
             } else {
                summaryText = `You've logged ${daysWithLog} days this week with an average of ${averageIntake.toLocaleString()} kcal.`;
             }
        }
    } else if (daysWithLog > 0) {
        summaryText = `Keep logging to see your weekly trends!`;
    }


    if (daysWithLog === 0) {
        return (
            <div className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-sm text-center text-stone-600 min-h-[224px] flex flex-col items-center justify-center">
                <h3 className="font-lora text-lg text-stone-800 mb-4 w-full">Last 7 Days Progress</h3>
                <p>Not enough data to show a graph. Start logging your meals!</p>
            </div>
        );
    }
    
    const maxCalories = Math.max(goal, ...last7DaysData.map(d => d.calories)) * 1.1;
    const goalPercentage = (goal / maxCalories) * 100;

    // SVG trend line calculation
    const numDays = last7DaysData.length;
    const points = last7DaysData.map((dayData, index) => {
        const xPercentage = (index + 0.5) / numDays * 100;
        const yValue = dayData.calories > 0 ? (dayData.calories / maxCalories) : 0;
        const yPercentage = (1 - yValue) * 100;
        return `${xPercentage},${yPercentage}`;
    }).join(' ');

    const circlePoints = last7DaysData.map((dayData, index) => {
        if (dayData.calories <= 0) return null;
        const xPercentage = (index + 0.5) / numDays * 100;
        const yValue = (dayData.calories / maxCalories);
        const yPercentage = (1 - yValue) * 100;
        return { x: `${xPercentage}%`, y: `${yPercentage}%` };
    }).filter(Boolean);

    return (
        <div className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-sm">
            <h3 className="font-lora text-lg text-stone-800 mb-2">Last 7 Days Progress</h3>
            {summaryText && <p className="text-sm text-stone-600 mb-4">{summaryText}</p>}

            <div className="relative h-48 w-full">
                {/* Goal Line */}
                <div
                    className="absolute left-0 w-full border-t-2 border-dashed border-gray-400 z-10"
                    style={{ bottom: `${goalPercentage}%` }}
                >
                    <span className="absolute -right-2 -mt-2.5 text-xs text-stone-600 bg-cream-50 border border-cream-200 px-1 rounded">{goal} kcal</span>
                </div>
                
                {/* Bars */}
                <div className="absolute inset-0 flex justify-around items-end gap-2">
                    {last7DaysData.map(dayData => {
                        const barHeight = dayData.calories > 0 ? (dayData.calories / maxCalories) * 100 : 0;
                        let barColor = 'bg-gray-300/50';
                        if (dayData.calories > 0) {
                            if (dayData.calories > goal * 1.1) barColor = 'bg-red-400/70';
                            else if (dayData.calories < goal * 0.9) barColor = 'bg-blue-400/70';
                            else barColor = 'bg-green-400/70';
                        }
                        return (
                            <div key={dayData.date} className="flex-1 h-full flex items-end justify-center group">
                                <div
                                    className={`w-3/4 max-w-[40px] rounded-t-md transition-all duration-300 ${barColor}`}
                                    style={{ height: `${barHeight}%` }}
                                >
                                    {dayData.calories > 0 && (
                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {dayData.calories.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Trend Line SVG */}
                <svg className="absolute inset-0 overflow-visible z-20 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline
                        fill="none"
                        stroke="rgba(44, 62, 80, 0.4)"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                    />
                    {circlePoints.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="rgba(44, 62, 80, 0.7)" vectorEffect="non-scaling-stroke"/>
                    ))}
                </svg>
            </div>

            {/* Day Labels */}
            <div className="w-full flex justify-around items-end gap-2 border-t border-cream-200 pt-1 mt-1">
                 {last7DaysData.map(dayData => (
                    <div key={dayData.date} className="flex-1 text-center">
                        <span className="text-xs text-stone-600 font-semibold">{dayData.dayLabel}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-stone-600">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400/70"></span> Under Goal</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400/70"></span> Met Goal</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400/70"></span> Over Goal</div>
            </div>
        </div>
    );
};