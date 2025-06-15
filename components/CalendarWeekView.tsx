
import React, { useMemo } from 'react';
import { CalendarEvent, ClinicHoliday, StaffMember } from '../types';
import { format } from 'date-fns';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameDay } from 'date-fns/isSameDay';
import { parseISO } from 'date-fns/parseISO';
import { isValid } from 'date-fns/isValid';
import { isWithinInterval } from 'date-fns/isWithinInterval'; // Keep if used, though not in error list
import { ja } from 'date-fns/locale/ja';
import { EVENT_COLORS } from '../constants';

interface CalendarWeekViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    holidays: ClinicHoliday[];
    onDayClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    allStaff: StaffMember[];
}

const getEventColor = (event: CalendarEvent, index: number): string => {
    if (event.color) return event.color;
    if (event.isHoliday) return '#ef4444'; // Red for holidays
    return EVENT_COLORS[index % EVENT_COLORS.length];
};

const formatTime = (isoString: string): string => {
    try {
        const dateObj = parseISO(isoString);
        if (!isValid(dateObj)) return '';
        return format(dateObj, 'HH:mm');
    } catch {
        return '';
    }
};

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
    currentDate, events, holidays, onDayClick, onEventClick, allStaff
}) => {
    const weekDaysLabels = ["日", "月", "火", "水", "木", "金", "土"];
    const daysInWeek = useMemo(() => {
        const start = startOfWeek(currentDate, { locale: ja });
        const end = endOfWeek(currentDate, { locale: ja });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const getEventsForDay = (day: Date): CalendarEvent[] => {
        return events.filter(event => {
            const eventStart = parseISO(event.start);
            const eventEnd = parseISO(event.end);
            if (!isValid(eventStart) || !isValid(eventEnd)) return false;
            
            // For all-day events, check if the day is the start day of the event
            if (event.allDay) {
                return isSameDay(day, eventStart);
            }
            // For timed events, check if the day is within the event's start and end date (inclusive of start day)
            // This logic might need refinement for multi-day timed events to show them correctly across days
             return isSameDay(day, eventStart) || (day >= eventStart && day <= eventEnd);

        }).sort((a,b) => (a.allDay ? -1 : 1) - (b.allDay ? -1 : 1) || parseISO(a.start).getTime() - parseISO(b.start).getTime());
    };

    return (
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 flex-1 overflow-y-auto custom-scrollbar">
            {weekDaysLabels.map((label, index) => (
                <div key={label} className="text-center py-2 text-xs font-medium text-gray-500 bg-gray-100 border-b border-gray-200">
                    {label}
                    <span className="block text-lg font-normal text-gray-700">
                        {format(daysInWeek[index], 'd')}
                    </span>
                </div>
            ))}
            {daysInWeek.map((day, dayIdx) => {
                const dayDateStr = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                const isHoliday = holidays.some(h => h.date === dayDateStr);
                const dayEvents = getEventsForDay(day);

                return (
                    <div
                        key={day.toString()}
                        className={`p-1.5 flex flex-col bg-white min-h-[10rem] sm:min-h-[12rem] overflow-hidden hover:bg-blue-50 transition-colors duration-150 ease-in-out cursor-pointer
                                    ${isHoliday ? '!bg-red-100 hover:!bg-red-200' : ''}
                                    ${isToday && !isHoliday ? 'bg-blue-50' : ''}`}
                        onClick={() => onDayClick(day)}
                        role="gridcell"
                        aria-label={`${format(day, 'MMMM d, yyyy')} ${isHoliday ? '休診日' : ''}`}
                    >
                        {/* Day number is now in the header part */}
                        {isHoliday && <span className="text-xxs text-red-600 font-semibold self-start mb-0.5">休診日</span>}
                        
                        <div className="space-y-0.5 overflow-y-auto custom-scrollbar flex-1">
                            {dayEvents.map((event, eventIdx) => (
                                <button
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                    className={`block w-full text-left p-1 rounded text-xxs leading-tight truncate
                                                ${event.isHoliday ? 'bg-red-200 text-red-800' : 'text-white'}`}
                                    style={!event.isHoliday ? { backgroundColor: getEventColor(event, eventIdx) } : {}}
                                    title={`${event.allDay ? '' : formatTime(event.start) +'-'+formatTime(event.end)+' '}${event.title} ${event.staffId ? '('+allStaff.find(s=>s.id === event.staffId)?.name+')' : ''}`}
                                >
                                    {event.allDay && <span className="font-semibold">[終日] </span>}
                                    {!event.allDay && <span className="font-semibold">{formatTime(event.start)}</span>}
                                    {' '}{event.title}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CalendarWeekView;