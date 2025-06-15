
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CalendarDayViewProps, CalendarEvent } from '../types';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { isSameDay } from 'date-fns/isSameDay';
import { isValid } from 'date-fns/isValid';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { getHours } from 'date-fns/getHours';
import { getMinutes } from 'date-fns/getMinutes';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';
import { setSeconds } from 'date-fns/setSeconds';
import { setMilliseconds } from 'date-fns/setMilliseconds';
import { ja } from 'date-fns/locale/ja';
import { getDayHours, formatDateForDisplay } from '../utils';
import { EVENT_COLORS } from '../constants';

const getEventColor = (event: CalendarEvent, index: number): string => {
    if (event.color) return event.color;
    if (event.isHoliday) return '#ef4444'; 
    return EVENT_COLORS[index % EVENT_COLORS.length];
};

const HOUR_HEIGHT_PX = 60; // Height of one hour slot in pixels
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 23;

const CalendarDayView: React.FC<CalendarDayViewProps> = ({
    currentDate, events, holidays, onTimeSlotClick, onEventClick, allStaff
}) => {
    const timeSlots = useMemo(() => getDayHours(DAY_START_HOUR, DAY_END_HOUR), []);
    const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const dayDateStr = format(currentDate, 'yyyy-MM-dd');
    const isToday = isSameDay(currentDate, new Date());
    const isHoliday = holidays.some(h => h.date === dayDateStr);

    useEffect(() => {
        const updateCurrentTimeLine = () => {
            if (isToday && timelineRef.current) {
                const now = new Date();
                const minutesSinceStartOfDay = getHours(now) * 60 + getMinutes(now);
                const position = (minutesSinceStartOfDay / ( (DAY_END_HOUR - DAY_START_HOUR + 1) * 60)) * timelineRef.current.scrollHeight;
                setCurrentTimePosition(position);
            } else {
                setCurrentTimePosition(null);
            }
        };

        updateCurrentTimeLine();
        const intervalId = setInterval(updateCurrentTimeLine, 60000); // Update every minute
        return () => clearInterval(intervalId);
    }, [isToday, currentDate]);


    const { allDayEvents, timedEvents } = useMemo(() => {
        const dayEvents = events.filter(event => {
            const eventStart = parseISO(event.start);
            const eventEnd = parseISO(event.end);
            if (!isValid(eventStart) || !isValid(eventEnd)) return false;
            // Check if the event occurs on the current date
            return isSameDay(currentDate, eventStart) || (currentDate > eventStart && currentDate < eventEnd) || (event.allDay && isSameDay(currentDate, eventStart));
        }).sort((a,b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
        
        return {
            allDayEvents: dayEvents.filter(e => e.allDay),
            timedEvents: dayEvents.filter(e => !e.allDay),
        };
    }, [currentDate, events]);


    const getEventStyle = (event: CalendarEvent): React.CSSProperties => {
        const eventStart = parseISO(event.start);
        const eventEnd = parseISO(event.end);

        const startMinutes = (getHours(eventStart) - DAY_START_HOUR) * 60 + getMinutes(eventStart);
        const endMinutes = (getHours(eventEnd) - DAY_START_HOUR) * 60 + getMinutes(eventEnd);
        
        // Ensure duration is at least 15 minutes for visibility
        const durationMinutes = Math.max(15, differenceInMinutes(eventEnd, eventStart)); 

        const top = (startMinutes / 60) * HOUR_HEIGHT_PX;
        const height = (durationMinutes / 60) * HOUR_HEIGHT_PX;

        return {
            top: `${top}px`,
            height: `${height}px`,
            // Basic overlap handling - can be improved
            // width: '90%', 
            // left: '5%',
        };
    };
    
    const handleTimeSlotClick = (hour: string) => {
        const clickedTime = parseISO(`${format(currentDate, 'yyyy-MM-dd')}T${hour}`);
        onTimeSlotClick(clickedTime, hour);
    };


    return (
        <div className={`flex-1 flex flex-col overflow-hidden ${isHoliday ? 'bg-red-50' : 'bg-white'}`}>
            {/* All Day Events Section */}
            {allDayEvents.length > 0 && (
                <div className="p-2 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">終日</div>
                    <div className="space-y-1">
                        {allDayEvents.map((event, idx) => (
                            <button
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className="block w-full text-left p-1.5 rounded text-xxs leading-tight truncate text-white"
                                style={{ backgroundColor: getEventColor(event, idx) }}
                                title={`${event.title} ${event.staffId ? '('+allStaff.find(s=>s.id === event.staffId)?.name+')' : ''}`}
                            >
                                {event.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
             {isHoliday && allDayEvents.length === 0 && (
                 <div className="p-2 border-b border-gray-200 text-center">
                    <span className="text-sm text-red-600 font-semibold">休診日</span>
                 </div>
             )}

            {/* Timed Events Section */}
            <div className="flex-1 flex overflow-hidden">
                {/* Time Gutter */}
                <div className="w-16 text-center border-r border-gray-200 overflow-y-auto custom-scrollbar">
                    {timeSlots.map(({time}) => (
                        <div key={time} className="h-[60px] relative flex items-center justify-center border-b border-gray-100">
                            <span className="text-xs text-gray-500">{time}</span>
                        </div>
                    ))}
                </div>

                {/* Event Area */}
                <div ref={timelineRef} className="flex-1 overflow-y-auto custom-scrollbar relative" onClick={(e) => {
                     // Handle click on empty area to create event
                    if (e.target === timelineRef.current) { // Clicked on the background
                        const rect = timelineRef.current.getBoundingClientRect();
                        const clickY = e.clientY - rect.top;
                        const hourFraction = (clickY / HOUR_HEIGHT_PX);
                        const hour = Math.floor(hourFraction) + DAY_START_HOUR;
                        const minuteFraction = hourFraction - Math.floor(hourFraction);
                        const minutes = Math.floor(minuteFraction * 60 / 15) * 15; // Snap to 15 mins
                        const clickedTime = setMilliseconds(setSeconds(setMinutes(setHours(currentDate, hour), minutes),0),0);
                        onTimeSlotClick(clickedTime, format(clickedTime, 'HH:mm'));
                    }
                }}>
                    {timeSlots.map(({time, isHalfHour}, index) => (
                        <div
                            key={time}
                            className={`h-[${HOUR_HEIGHT_PX}px] border-b ${isHalfHour ? 'border-gray-100 border-dashed' : 'border-gray-200'}`}
                            onClick={() => handleTimeSlotClick(time)}
                            role="button"
                            aria-label={`時間 ${time} に予定を追加`}
                        ></div>
                    ))}

                    {/* Current Time Indicator */}
                    {isToday && currentTimePosition !== null && (
                        <div
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                            style={{ top: `${currentTimePosition}px` }}
                            role="timer"
                            aria-label="現在時刻"
                        >
                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                    )}
                    
                    {/* Render Timed Events */}
                    {timedEvents.map((event, idx) => (
                        <button
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="absolute left-[2%] w-[96%] p-1.5 rounded text-xxs leading-tight text-white shadow-md hover:shadow-lg transition-shadow duration-150 ease-in-out z-5"
                            style={{ ...getEventStyle(event), backgroundColor: getEventColor(event, idx) }}
                            title={`${format(parseISO(event.start), 'HH:mm')} - ${format(parseISO(event.end), 'HH:mm')} ${event.title}`}
                        >
                            <div className="font-semibold">{format(parseISO(event.start), 'HH:mm')} - {format(parseISO(event.end), 'HH:mm')}</div>
                            <div className="truncate">{event.title}</div>
                            {event.staffId && allStaff.find(s => s.id === event.staffId) && (
                                <div className="text-xxs opacity-80 truncate">担当: {allStaff.find(s => s.id === event.staffId)?.name}</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarDayView;