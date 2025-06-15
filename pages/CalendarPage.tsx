
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarPageProps, CalendarEvent, CalendarView, StaffMember, StaffRole, ClinicHoliday, EventModalProps as OriginalEventModalProps, Project } from '../types';
import { STAFF_ROLES, EVENT_COLORS, PROJECT_DEADLINE_EVENT_COLOR } from '../constants';
import { format } from 'date-fns/format';
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isSameDay } from 'date-fns/isSameDay';
import { parseISO } from 'date-fns/parseISO';
import { isValid } from 'date-fns/isValid';
import { addWeeks } from 'date-fns/addWeeks';
import { subWeeks } from 'date-fns/subWeeks';
import { addDays } from 'date-fns/addDays';
import { subDays } from 'date-fns/subDays';
import { addYears } from 'date-fns/addYears';
import { subYears } from 'date-fns/subYears';
import { ja } from 'date-fns/locale/ja';
import PageTitle from '../components/PageTitle';
import { CloseIcon } from '../components/icons';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CalendarWeekView from '../components/CalendarWeekView';
import CalendarDayView from '../components/CalendarDayView'; // New Day View
import CalendarYearView from '../components/CalendarYearView'; // New Year View
import { formatWeekRangeForDisplay, formatDateForDisplay } from '../utils';


// --- Helper Functions (Shared or moved to utils if complex) ---
// getEventColor function will be part of CalendarMonthView (implicitly)
const getEventColor = (event: CalendarEvent, index: number): string => {
    if (event.isProjectDeadline) return PROJECT_DEADLINE_EVENT_COLOR;
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

const parseDateTimeLocal = (value: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return isValid(date) ? date : null;
};


// --- Sub-Components (Filter Panel, Event Modal - unchanged for this iteration unless specified) ---

interface CalendarFilterPanelProps {
    allStaff: StaffMember[];
    selectedStaffIds: string[];
    onStaffFilterChange: (staffId: string) => void;
    selectedRoles: StaffRole[];
    onRoleFilterChange: (role: StaffRole) => void;
    onClearFilters: () => void;
}

const CalendarFilterPanel: React.FC<CalendarFilterPanelProps> = ({
    allStaff, selectedStaffIds, onStaffFilterChange, selectedRoles, onRoleFilterChange, onClearFilters
}) => {
    return (
        <div className="w-64 bg-white p-4 space-y-4 border-r border-gray-200 h-full overflow-y-auto custom-scrollbar">
            <h3 className="text-md font-semibold text-gray-700">フィルター</h3>
            <button
                onClick={onClearFilters}
                className="w-full text-xs text-blue-600 hover:text-blue-800 py-1 mb-2 text-left"
            >
                全フィルター解除
            </button>

            <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">役職別</h4>
                {STAFF_ROLES.map(role => (
                    <label key={role} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer p-1 hover:bg-gray-50 rounded">
                        <input
                            type="checkbox"
                            className="form-checkbox h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedRoles.includes(role)}
                            onChange={() => onRoleFilterChange(role)}
                        />
                        <span>{role}</span>
                    </label>
                ))}
            </div>
            <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">社員別</h4>
                {allStaff.sort((a,b)=> a.name.localeCompare(b.name, 'ja')).map(staff => (
                    <label key={staff.id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer p-1 hover:bg-gray-50 rounded">
                        <input
                            type="checkbox"
                            className="form-checkbox h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedStaffIds.includes(staff.id)}
                            onChange={() => onStaffFilterChange(staff.id)}
                        />
                        <span>{staff.name}</span>
                         {staff.icon && <img src={staff.icon} alt={staff.name} className="w-4 h-4 rounded-full object-cover"/>}
                    </label>
                ))}
            </div>
        </div>
    );
};


// EventModalProps from types.ts
type EventModalProps = OriginalEventModalProps;

const EventModal: React.FC<EventModalProps> = ({
    isOpen, onClose, onSave, onDelete, event, selectedDate, selectedTime, allStaff
}) => {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
    const [startTime, setStartTime] = useState(''); // HH:mm
    const [endDate, setEndDate] = useState('');     // YYYY-MM-DD
    const [endTime, setEndTime] = useState('');     // HH:mm
    const [allDay, setAllDay] = useState(false);
    const [staffId, setStaffId] = useState<string | undefined>(undefined);
    const [role, setRole] = useState<StaffRole | undefined>(undefined);
    const [memo, setMemo] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    
    const isProjectEvent = useMemo(() => event?.isProjectDeadline === true, [event]);

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            const startObj = parseISO(event.start);
            const endObj = parseISO(event.end);
            setStartDate(format(startObj, 'yyyy-MM-dd'));
            setStartTime(event.allDay ? '' : format(startObj, 'HH:mm'));
            setEndDate(format(endObj, 'yyyy-MM-dd'));
            setEndTime(event.allDay ? '' : format(endObj, 'HH:mm'));
            setAllDay(event.allDay);
            setStaffId(event.staffId);
            setRole(event.role);
            setMemo(event.memo || '');
        } else if (selectedDate) {
            const today = new Date();
            setTitle('');
            setStartDate(selectedDate);
            setStartTime(selectedTime || format(today, 'HH:00')); 
            setEndDate(selectedDate);
            setEndTime(selectedTime ? format(addDays(parseISO(`${selectedDate}T${selectedTime}`),0), 'HH:mm') : format(addMonths(today,1), 'HH:00')); 
            setAllDay(!!selectedTime === false); // If no specific time selected, default to all-day
            setStaffId(undefined);
            setRole(undefined);
            setMemo('');
        }
        setError(null);
    }, [event, selectedDate, selectedTime, isOpen]);

    const handleStaffChange = (selectedStaffId: string) => {
        setStaffId(selectedStaffId);
        const staffMember = allStaff.find(s => s.id === selectedStaffId);
        if (staffMember) {
            setRole(staffMember.role);
        } else {
            setRole(undefined);
        }
    };
    
    const filteredStaffByRole = useMemo(() => {
        if (!role) return allStaff;
        return allStaff.filter(s => s.role === role);
    }, [role, allStaff]);


    const handleSubmit = () => {
        if (isProjectEvent) return; // Do not save project deadline events from here

        if (!title.trim()) { setError('タイトルは必須です。'); return; }
        if (!startDate) { setError('開始日は必須です。'); return; }
        if (!endDate) { setError('終了日は必須です。'); return; }

        let startDateTimeStr: string;
        let endDateTimeStr: string;

        if (allDay) {
            startDateTimeStr = `${startDate}T00:00:00`;
            endDateTimeStr = `${endDate}T23:59:59`;
        } else {
            if (!startTime) { setError('開始時間は必須です。'); return; }
            if (!endTime) { setError('終了時間は必須です。'); return; }
            startDateTimeStr = `${startDate}T${startTime}:00`;
            endDateTimeStr = `${endDate}T${endTime}:00`;
        }
        
        const startObj = parseDateTimeLocal(startDateTimeStr);
        const endObj = parseDateTimeLocal(endDateTimeStr);

        if (!startObj || !endObj) {setError('日付または時刻の形式が無効です。'); return; }
        if (endObj < startObj) { setError('終了日時は開始日時より後に設定してください。'); return; }

        const newEvent: CalendarEvent = {
            id: event?.id || Date.now().toString(),
            title,
            start: startObj.toISOString(),
            end: endObj.toISOString(),
            allDay,
            staffId: staffId || undefined, 
            role: role || undefined,
            memo,
            isProjectDeadline: false, // Explicitly false for normal events
        };
        onSave(newEvent);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all max-h-[90vh] flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {isProjectEvent ? 'プロジェクト締切 詳細' : (event ? '予定の編集' : '予定の追加')}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                        {isProjectEvent && (
                            <p className="text-sm text-orange-600 bg-orange-100 p-3 rounded-md">
                                これはプロジェクトの締切日です。編集はプロジェクト管理ページから行ってください。
                            </p>
                        )}
                        <div>
                            <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700">タイトル *</label>
                            <input type="text" id="eventTitle" value={title} onChange={e => setTitle(e.target.value)} className="form-input mt-1 w-full" disabled={isProjectEvent}/>
                        </div>
                        <div className="flex items-center space-x-2">
                             <label htmlFor="allDay" className="flex items-center text-sm font-medium text-gray-700">
                                <input type="checkbox" id="allDay" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="form-checkbox mr-2" disabled={isProjectEvent}/>
                                終日
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">開始日 *</label>
                                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input mt-1 w-full" disabled={isProjectEvent}/>
                            </div>
                            {!allDay && (
                                <div>
                                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">開始時間 *</label>
                                    <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="form-input mt-1 w-full" disabled={isProjectEvent}/>
                                </div>
                            )}
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">終了日 *</label>
                                <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input mt-1 w-full" disabled={isProjectEvent}/>
                            </div>
                            {!allDay && (
                                <div>
                                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">終了時間 *</label>
                                    <input type="time" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="form-input mt-1 w-full" disabled={isProjectEvent}/>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="eventRole" className="block text-sm font-medium text-gray-700">役職 (任意)</label>
                            <select id="eventRole" value={role || ''} onChange={e => {setRole(e.target.value as StaffRole); if(staffId && allStaff.find(s=>s.id === staffId)?.role !== e.target.value) setStaffId('');}} className="form-select mt-1 w-full" disabled={isProjectEvent}>
                                <option value="">指定なし</option>
                                {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="eventStaff" className="block text-sm font-medium text-gray-700">担当者 (任意)</label>
                            <select id="eventStaff" value={staffId || ''} onChange={e => handleStaffChange(e.target.value)} className="form-select mt-1 w-full" disabled={isProjectEvent}>
                                <option value="">指定なし</option>
                                {filteredStaffByRole.sort((a,b)=>a.name.localeCompare(b.name,'ja')).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="eventMemo" className="block text-sm font-medium text-gray-700">メモ (任意)</label>
                            <textarea id="eventMemo" value={memo} onChange={e => setMemo(e.target.value)} rows={3} className="form-textarea mt-1 w-full" disabled={isProjectEvent}></textarea>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                        <div>
                        {event && onDelete && !isProjectEvent && (
                            <button
                                onClick={() => setShowConfirmDelete(true)}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 rounded-md"
                            >
                                削除
                            </button>
                        )}
                        </div>
                        <div className="space-x-3">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={onClose}>キャンセル</button>
                            {!isProjectEvent && (
                                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md" onClick={handleSubmit}>保存</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {event && onDelete && !isProjectEvent && (
                <ConfirmDeleteModal
                    isOpen={showConfirmDelete}
                    onClose={() => setShowConfirmDelete(false)}
                    onConfirm={() => { if(event?.id) { onDelete(event.id); } setShowConfirmDelete(false); onClose(); }}
                    itemName={event.title}
                    message={`予定「${event.title}」を本当に削除しますか？`}
                />
            )}
        </>
    );
};

// --- Month View Component ---
const CalendarMonthView: React.FC<{
    currentDate: Date;
    events: CalendarEvent[];
    holidays: ClinicHoliday[];
    onDayClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    allStaff: StaffMember[];
}> = ({ currentDate, events, holidays, onDayClick, onEventClick, allStaff }) => {
    const daysInMonthView = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { locale: ja });
        const end = endOfWeek(endOfMonth(currentDate), { locale: ja });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

    return (
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 flex-1 overflow-y-auto custom-scrollbar">
            {weekDays.map(dayName => (
                <div key={dayName} className="text-center py-2 text-xs font-medium text-gray-500 bg-gray-100">{dayName}</div>
            ))}
            {daysInMonthView.map((day) => {
                const dayDateStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isHoliday = holidays.some(h => h.date === dayDateStr);
                const dayEvents = events.filter(event => {
                    const eventStart = parseISO(event.start);
                    return isSameDay(day, eventStart) || (event.allDay && isSameDay(day, eventStart)) || (day > eventStart && day < parseISO(event.end));
                }).sort((a,b) => (a.allDay ? -1 : 1) - (b.allDay ? -1 : 1) || parseISO(a.start).getTime() - parseISO(b.start).getTime());

                return (
                    <div 
                        key={day.toString()} 
                        className={`p-1.5 flex flex-col bg-white min-h-[6rem] sm:min-h-[7rem] overflow-hidden hover:bg-blue-50 transition-colors duration-150 ease-in-out cursor-pointer
                                    ${isCurrentMonth ? '' : 'bg-gray-50 text-gray-400'}
                                    ${isHoliday ? '!bg-red-100 hover:!bg-red-200' : ''}`}
                        onClick={() => onDayClick(day)}
                        role="gridcell"
                        aria-label={`${format(day, 'MMMM d, yyyy')} ${isHoliday ? '休診日' : ''}`}
                    >
                        <time dateTime={dayDateStr} className={`text-xs font-semibold self-end ${isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : (isCurrentMonth ? 'text-gray-700' : '')}`}>
                            {format(day, 'd')}
                        </time>
                        {isHoliday && isCurrentMonth && <span className="text-xxs text-red-600 font-semibold mt-0.5 self-start">休診日</span>}
                        <div className="mt-0.5 space-y-0.5 overflow-y-auto custom-scrollbar flex-1">
                            {dayEvents.slice(0,3).map((event, eventIdx) => (
                                <button 
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); onEventClick(event);}}
                                    className={`block w-full text-left p-0.5 rounded text-xxs leading-tight truncate
                                                ${event.isHoliday ? 'bg-red-200 text-red-800' : 'text-white'}`}
                                    style={!event.isHoliday && !event.isProjectDeadline ? { backgroundColor: getEventColor(event, eventIdx) } : 
                                           event.isProjectDeadline ? { backgroundColor: PROJECT_DEADLINE_EVENT_COLOR } : {}}
                                    title={`${event.allDay ? '' : formatTime(event.start) +'-'+formatTime(event.end)+' '}${event.title} ${event.staffId ? '('+allStaff.find(s=>s.id === event.staffId)?.name+')' : ''}`}
                                >
                                   {!event.allDay && <span className="font-semibold">{formatTime(event.start)}</span>} {event.title}
                                </button>
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-xxs text-blue-500 text-center mt-0.5" onClick={(e) => {e.stopPropagation(); /* TODO: Show all events */ }}>
                                    他 {dayEvents.length - 3} 件...
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// --- Main Calendar Page ---
const CalendarPage: React.FC<CalendarPageProps> = ({
    allStaff, allProjects, calendarEvents, clinicHolidays, onSaveEvent, onDeleteEvent, onToggleHoliday
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<CalendarView>('month');
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
    const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<string | null>(null);
    const [selectedTimeForNewEvent, setSelectedTimeForNewEvent] = useState<string | null>(null);
    const [isHolidayMode, setIsHolidayMode] = useState(false);

    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<StaffRole[]>([]);

    const handleStaffFilterChange = (staffId: string) => {
        setSelectedStaffIds(prev => prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]);
    };
    const handleRoleFilterChange = (role: StaffRole) => {
        setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };
    const clearAllFilters = () => {
        setSelectedStaffIds([]);
        setSelectedRoles([]);
    };

    const projectDeadlineEvents = useMemo(() => {
        return allProjects.map(project => ({
            id: `project-deadline-${project.id}`,
            title: `[締切] ${project.name}`,
            start: `${project.deadline}T00:00:00`,
            end: `${project.deadline}T23:59:59`,
            allDay: true,
            color: PROJECT_DEADLINE_EVENT_COLOR,
            isProjectDeadline: true,
            isHoliday: false, // Project deadlines are not clinic holidays by default
        } as CalendarEvent));
    }, [allProjects]);

    const augmentedEvents = useMemo(() => {
        const combinedEvents = [...calendarEvents, ...projectDeadlineEvents];
        return combinedEvents.map(event => ({
            ...event,
            isHoliday: clinicHolidays.some(h => isSameDay(parseISO(event.start), parseISO(h.date)) && event.allDay && (event.title.includes("休診日") || event.id === `holiday-${h.date}`)) 
        }));
    }, [calendarEvents, projectDeadlineEvents, clinicHolidays]);


    const filteredEvents = useMemo(() => {
        return augmentedEvents.filter(event => {
            if (event.isProjectDeadline) return true; // Always show project deadlines if not filtered by staff explicitly
            if (selectedStaffIds.length === 0 && selectedRoles.length === 0) return true;
            if (event.staffId && selectedStaffIds.includes(event.staffId)) return true;
            if (event.role && selectedRoles.includes(event.role)) return true;
            const staffMember = allStaff.find(s => s.id === event.staffId);
            if (staffMember && selectedRoles.includes(staffMember.role)) return true;
            // If filters are active but the event doesn't match any, hide it, unless it's a project deadline.
            if ((selectedStaffIds.length > 0 || selectedRoles.length > 0) && !event.staffId && !event.role) return false;
            return false; 
        });
    }, [augmentedEvents, selectedStaffIds, selectedRoles, allStaff]);

    const handlePrev = () => {
        switch (currentView) {
            case 'month': setCurrentDate(prev => subMonths(prev, 1)); break;
            case 'week': setCurrentDate(prev => subWeeks(prev, 1)); break;
            case 'day': setCurrentDate(prev => subDays(prev, 1)); break;
            case 'year': setCurrentDate(prev => subYears(prev, 1)); break;
        }
    };
    const handleNext = () => {
        switch (currentView) {
            case 'month': setCurrentDate(prev => addMonths(prev, 1)); break;
            case 'week': setCurrentDate(prev => addWeeks(prev, 1)); break;
            case 'day': setCurrentDate(prev => addDays(prev, 1)); break;
            case 'year': setCurrentDate(prev => addYears(prev, 1)); break;
        }
    };
    const handleToday = () => setCurrentDate(new Date());
    const handleViewChange = (view: CalendarView) => setCurrentView(view);


    const handleDayOrTimeslotClick = (day: Date, time?: string) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        if (isHolidayMode) {
            onToggleHoliday(dateStr, "休診日");
        } else {
            setSelectedDateForNewEvent(dateStr);
            setSelectedTimeForNewEvent(time || null);
            setEventToEdit(null);
            setIsEventModalOpen(true);
        }
    };
    
    // For YearView: when a day in a mini-month is clicked
    const handleYearMonthDayClick = (day: Date) => {
        setCurrentDate(day);
        setCurrentView('day'); // Switch to Day view for the selected date
    };


    const handleEventClick = (event: CalendarEvent) => {
        setEventToEdit(event);
        setSelectedDateForNewEvent(null);
        setSelectedTimeForNewEvent(null);
        setIsEventModalOpen(true);
    };
    
    const renderHeaderDate = () => {
        switch (currentView) {
            case 'month': return format(currentDate, 'yyyy年 MMMM', { locale: ja });
            case 'week': return formatWeekRangeForDisplay(currentDate, ja);
            case 'day': return formatDateForDisplay(currentDate.toISOString(), 'yyyy年 MMMM d日 (E)');
            case 'year': return format(currentDate, 'yyyy年', { locale: ja });
            default: return '';
        }
    };
    
    // Wrapper for onSaveEvent to prevent saving project deadlines from modal
    const handleSaveEventWrapper = (eventToSave: CalendarEvent) => {
        if (eventToSave.isProjectDeadline) {
            // console.log("Project deadlines cannot be saved from calendar modal.");
            return;
        }
        onSaveEvent(eventToSave);
    };

    // Wrapper for onDeleteEvent to prevent deleting project deadlines from modal
    const handleDeleteEventWrapper = (eventId: string) => {
         const event = filteredEvents.find(e => e.id === eventId);
        if (event && event.isProjectDeadline) {
            // console.log("Project deadlines cannot be deleted from calendar modal.");
            return;
        }
        onDeleteEvent(eventId);
    };


    return (
        <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
            <PageTitle title="ダッシュボード > カレンダー" />
            <div className="flex flex-1 overflow-hidden">
                <CalendarFilterPanel 
                    allStaff={allStaff}
                    selectedStaffIds={selectedStaffIds}
                    onStaffFilterChange={handleStaffFilterChange}
                    selectedRoles={selectedRoles}
                    onRoleFilterChange={handleRoleFilterChange}
                    onClearFilters={clearAllFilters}
                />
                <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                            <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">今日</button>
                            <button onClick={handlePrev} className="p-1.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-md">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={handleNext} className="p-1.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-md">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <h2 className="text-xl font-semibold text-gray-800 ml-2">{renderHeaderDate()}</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                             <button 
                                onClick={() => setIsHolidayMode(!isHolidayMode)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md border
                                            ${isHolidayMode ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                休診日設定モード {isHolidayMode ? 'ON' : 'OFF'}
                            </button>
                             <div className="bg-white border border-gray-300 rounded-md p-0.5 flex">
                                {(['day', 'week', 'month', 'year'] as CalendarView[]).map(view => (
                                    <button 
                                        key={view}
                                        onClick={() => handleViewChange(view)}
                                        className={`px-2.5 py-1 text-xs font-medium rounded
                                            ${currentView === view ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {view === 'month' ? '月' : view === 'week' ? '週' : view === 'day' ? '日' : '年'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                     {isHolidayMode && <p className="text-sm text-red-600 mb-2 text-center">休診日設定モード: カレンダーの日付をクリックして休診日を切り替えます。</p>}

                    {currentView === 'month' && (
                        <CalendarMonthView 
                            currentDate={currentDate}
                            events={filteredEvents}
                            holidays={clinicHolidays}
                            onDayClick={handleDayOrTimeslotClick}
                            onEventClick={handleEventClick}
                            allStaff={allStaff}
                        />
                    )}
                    {currentView === 'week' && (
                        <CalendarWeekView
                            currentDate={currentDate}
                            events={filteredEvents}
                            holidays={clinicHolidays}
                            onDayClick={handleDayOrTimeslotClick}
                            onEventClick={handleEventClick}
                            allStaff={allStaff}
                        />
                    )}
                    {currentView === 'day' && (
                        <CalendarDayView
                            currentDate={currentDate}
                            events={filteredEvents}
                            holidays={clinicHolidays}
                            onTimeSlotClick={handleDayOrTimeslotClick}
                            onEventClick={handleEventClick}
                            allStaff={allStaff}
                        />
                    )}
                     {currentView === 'year' && (
                        <CalendarYearView
                            currentDate={currentDate}
                            events={filteredEvents}
                            holidays={clinicHolidays}
                            onMonthDayClick={handleYearMonthDayClick} // Navigate to Day view
                            onEventClick={handleEventClick} // Potentially show event details or navigate
                            allStaff={allStaff} // For event indicators if needed
                        />
                    )}
                </div>
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSave={handleSaveEventWrapper}
                onDelete={handleDeleteEventWrapper}
                event={eventToEdit}
                selectedDate={selectedDateForNewEvent}
                selectedTime={selectedTimeForNewEvent}
                allStaff={allStaff}
            />
        </div>
    );
};

export default CalendarPage;