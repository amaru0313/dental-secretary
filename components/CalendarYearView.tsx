
import React, { useMemo } from 'react';
import { CalendarYearViewProps, CalendarEvent } from '../types';
import { format } from 'date-fns/format';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';
import { startOfMonth } from 'date-fns/startOfMonth';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isSameDay } from 'date-fns/isSameDay';
import { parseISO } from 'date-fns/parseISO';
import { isValid } from 'date-fns/isValid';
import { getDate } from 'date-fns/getDate';
import { ja } from 'date-fns/locale/ja';
import { getMonthsForYearView } from '../utils';

const CalendarYearView: React.FC<CalendarYearViewProps> = ({
    currentDate, events, holidays, onMonthDayClick, onEventClick, allStaff
}) => {
    const yearMonths = useMemo(() => getMonthsForYearView(currentDate), [currentDate]);
    const weekDayLabels = ["日", "月", "火", "水", "木", "金", "土"];

    const MiniMonthCalendar: React.FC<{ month: Date }> = ({ month }) => {
        const monthStart = startOfMonth(month);
        const daysInView = useMemo(() => {
            const start = startOfWeek(monthStart, { locale: ja });
            const end = endOfWeek(endOfMonth(monthStart), { locale: ja });
            return eachDayOfInterval({ start, end });
        }, [monthStart]);

        return (
            <div className="bg-white p-2 rounded shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-center text-blue-600 mb-1.5">
                    {format(month, 'MMMM', { locale: ja })}
                </h3>
                <div className="grid grid-cols-7 gap-px text-center">
                    {weekDayLabels.map(label => (
                        <div key={label} className="text-xxs text-gray-500 font-medium">{label}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px mt-1">
                    {daysInView.map(day => {
                        const dayDateStr = format(day, 'yyyy-MM-dd');
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());
                        const isHoliday = holidays.some(h => h.date === dayDateStr);
                        const hasEvent = events.some(e => {
                            const eventStart = parseISO(e.start);
                            return isValid(eventStart) && isSameDay(day, eventStart);
                        });

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onMonthDayClick(day)}
                                className={`h-5 w-full flex items-center justify-center rounded text-xxs transition-colors
                                            ${!isCurrentMonth ? 'text-gray-300 hover:bg-gray-100' : 'hover:bg-blue-100'}
                                            ${isToday ? 'bg-blue-500 text-white font-bold hover:bg-blue-600' : ''}
                                            ${isHoliday && isCurrentMonth ? '!bg-red-200 !text-red-700 hover:!bg-red-300' : ''}
                                            `}
                                aria-label={format(day, 'yyyy年M月d日')}
                            >
                                {isCurrentMonth ? getDate(day) : ''}
                                {isCurrentMonth && hasEvent && !isToday && !isHoliday && (
                                    <span className="absolute mt-2.5 w-1 h-1 bg-green-500 rounded-full"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar bg-gray-100 rounded-md">
            {yearMonths.map(monthDate => (
                <MiniMonthCalendar key={monthDate.toISOString()} month={monthDate} />
            ))}
        </div>
    );
};

export default CalendarYearView;