import React from 'react';
import { CalorieLogResult } from '../types';
import { Icon } from './Icon';

interface CalendarProps {
    selectedDate: string; // YYYY-MM-DD
    onDateSelect: (date: string) => void;
    logs: { [date: string]: CalorieLogResult };
    goal: number;
    onMonthChange: (direction: 'prev' | 'next') => void;
    displayDate: Date;
}

const formatDate = (date: Date): string => {
    // Adjust for timezone offset to prevent off-by-one day errors
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
};

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, logs, goal, onMonthChange, displayDate }) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const renderHeader = () => (
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => onMonthChange('prev')} className="p-2 rounded-full hover:bg-cream-100/80" aria-label="Previous month"><Icon name="chevron-left" className="w-5 h-5" /></button>
            <h3 className="text-lg font-semibold">{monthNames[month]} {year}</h3>
            <button onClick={() => onMonthChange('next')} className="p-2 rounded-full hover:bg-cream-100/80" aria-label="Next month"><Icon name="chevron-right" className="w-5 h-5" /></button>
        </div>
    );

    const renderDaysOfWeek = () => (
        <div className="grid grid-cols-7 text-center text-xs text-stone-600 font-semibold mb-2">
            {daysOfWeek.map(day => <div key={day} aria-hidden="true">{day}</div>)}
        </div>
    );

    const renderCells = () => {
        // FIX: Replaced JSX.Element[] with React.ReactElement[] to resolve "Cannot find namespace 'JSX'" error.
        const cells: React.ReactElement[] = [];
        // Blank cells for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="p-2" aria-hidden="true"></div>);
        }
        // Month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(new Date(year, month, day));
            const log = logs[dateStr];
            const isSelected = dateStr === selectedDate;

            let colorClass = 'bg-cream-50 border border-cream-200 hover:bg-yellow-100/50';
            if (log) {
                const percentage = log.totals.calories / goal;
                if (percentage > 1.1) colorClass = 'bg-red-200/70 hover:bg-red-300/70'; // Over goal
                else if (percentage >= 0.9) colorClass = 'bg-green-200/70 hover:bg-green-300/70'; // Met goal
                else colorClass = 'bg-blue-200/70 hover:bg-blue-300/70'; // Under goal
            }
            
            const selectedClass = isSelected ? 'ring-2 ring-brand-400 ring-offset-2' : '';

            cells.push(
                <div key={day} className={`p-2 text-center rounded-lg cursor-pointer transition-all duration-200 ${colorClass} ${selectedClass}`} onClick={() => onDateSelect(dateStr)}>
                    <span className="text-sm">{day}</span>
                    {log && (
                        <div className="text-xs font-bold mt-1 text-stone-700">
                            {log.totals.calories.toLocaleString()}
                        </div>
                    )}
                </div>
            );
        }
        return <div className="grid grid-cols-7 gap-1">{cells}</div>;
    };

    return (
        <div className="bg-cream-50 border border-cream-200 p-4 rounded-lg shadow-sm">
            {renderHeader()}
            {renderDaysOfWeek()}
            {renderCells()}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                 <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-200"></span> Under Goal</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-200"></span> Met Goal</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-200"></span> Over Goal</div>
            </div>
        </div>
    );
};