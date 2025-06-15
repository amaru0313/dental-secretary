import { format as formatDateFns } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachMonthOfInterval } from 'date-fns/eachMonthOfInterval';
import { startOfYear } from 'date-fns/startOfYear';
import { endOfYear } from 'date-fns/endOfYear';
import { parseISO } from 'date-fns/parseISO';
import { addDays } from 'date-fns/addDays';
import { isBefore } from 'date-fns/isBefore';
import { isValid as isDateValidFns } from 'date-fns/isValid'; // Renamed to avoid conflict
import { getDaysInMonth as getDaysInMonthFns } from 'date-fns/getDaysInMonth';
import { getDay as getDayFns } from 'date-fns/getDay';
import { isSameDay } from 'date-fns/isSameDay';
import { ja } from 'date-fns/locale/ja';
import { ClinicHoliday, ClinicSettingsData, DayKey } from './types';
import { DEFAULT_CLINIC_START_HOUR, DEFAULT_CLINIC_END_HOUR, DAY_KEYS } from './constants';


export const formatDateForDisplay = (isoDateString?: string | Date, formatStr?: string): string => {
    if (!isoDateString) return '';
    try {
        const date = typeof isoDateString === 'string' ? parseISO(isoDateString) : isoDateString;
        if (!isDateValidFns(date)) { // Use renamed isValid
            // Attempt to handle simple YYYY-MM-DD if parseISO fails directly
            if (typeof isoDateString === 'string') {
                const parts = isoDateString.split('T')[0].split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) -1; // Month is 0-indexed
                    const day = parseInt(parts[2], 10);
                    const constructedDate = new Date(year, month, day);
                    if (isDateValidFns(constructedDate) && constructedDate.getFullYear() === year && constructedDate.getMonth() === month && constructedDate.getDate() === day) {
                         const defaultFormat = formatStr || 'yyyy年MM月dd日';
                         return formatDateFns(constructedDate, defaultFormat, { locale: ja });
                    }
                }
            }
            return typeof isoDateString === 'string' ? isoDateString : '無効な日付';
        }
        
        const defaultFormat = formatStr || 'yyyy年MM月dd日';
        return formatDateFns(date, defaultFormat, { locale: ja });

    } catch (e) { 
        return typeof isoDateString === 'string' ? isoDateString : '日付エラー'; 
    }
};

export const formatWeekRangeForDisplay = (date: Date, locale: typeof ja = ja): string => {
    const start = startOfWeek(date, { locale });
    const end = endOfWeek(date, { locale });

    const startMonth = formatDateFns(start, 'M月', { locale });
    const endMonth = formatDateFns(end, 'M月', { locale });

    if (startMonth === endMonth) {
        return `${formatDateFns(start, 'M月d日', { locale })} - ${formatDateFns(end, 'd日', { locale })}`;
    } else {
        return `${formatDateFns(start, 'M月d日', { locale })} - ${formatDateFns(end, 'M月d日', { locale })}`;
    }
};


export const getCurrentDateYYYYMMDD = (): string => {
    const today = new Date();
    return formatDateFns(today, 'yyyy-MM-dd');
};

export const getPastNDates = (n: number): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        dates.push(formatDateFns(pastDate, 'yyyy-MM-dd'));
    }
    return dates.reverse(); // Return dates from oldest to newest
};


export const formatMinutesToHoursAndMinutes = (totalMinutes?: number): string => {
    if (totalMinutes === undefined || totalMinutes === null || isNaN(totalMinutes) || totalMinutes < 0) return '';
    if (totalMinutes === 0) return '0分';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let result = '';
    if (hours > 0) {
        result += `${hours}時間`;
    }
    if (minutes > 0) {
        result += `${minutes}分`;
    }
    return result;
};

// Helper to safely parse JSON from localStorage
export const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue) as T;
        }
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
    }
    return defaultValue;
};

// Helper to save JSON to localStorage
export const saveToLocalStorage = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
    }
};

// Calendar specific utils
export const getWeekDates = (date: Date): Date[] => {
    const start = startOfWeek(date, { locale: ja });
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + i);
        weekDates.push(nextDate);
    }
    return weekDates;
};

export const getDayHours = (startHour: number = 0, endHour: number = 23): {time: string, isHalfHour: boolean}[] => {
    const hours: {time: string, isHalfHour: boolean}[] = [];
    for (let i = startHour; i <= endHour; i++) {
        hours.push({time: `${i.toString().padStart(2, '0')}:00`, isHalfHour: false});
        if (i < endHour) { // Add half-hour mark, but not after the last full hour
            // hours.push({time: `${i.toString().padStart(2, '0')}:30`, isHalfHour: true});
        }
    }
    return hours;
};

export const getMonthsForYearView = (yearDate: Date): Date[] => {
    const yearStart = startOfYear(yearDate);
    const yearEnd = endOfYear(yearDate);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
};

export const isDateWithinTwoWeeks = (dateString: string): boolean => {
    if (!dateString) return false;
    try {
        const date = parseISO(dateString);
        if(!isDateValidFns(date)) return false;
        const today = new Date();
        today.setHours(0,0,0,0); // Normalize today to the start of the day
        const twoWeeksFromToday = addDays(today, 14);
        return isBefore(date, twoWeeksFromToday) && !isBefore(date, today); // Deadline is in the future but within 2 weeks
    } catch (e) {
        return false;
    }
};

export const formatTimeToHHMM = (date: Date): string => {
    if (!isDateValidFns(date)) return '';
    return formatDateFns(date, 'HH:mm');
};

const timeStringToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
};

const getDayKeyFromDate = (date: Date): DayKey => {
    const dayIndex = getDayFns(date); // 0 (Sunday) to 6 (Saturday)
    return DAY_KEYS[dayIndex]; // Assuming DAY_KEYS is ordered Sunday first
};


export const getOperatingDaysInMonth = (
    year: number,
    month: number, // 0-indexed
    settings: ClinicSettingsData,
    // Callback to get detailed operating minutes for a specific day, considering settings
    getOperatingMinutesForDayFn: (dateStr: string, settings: ClinicSettingsData) => { startMinutes: number, endMinutes: number, breakMinutes: number, isHoliday: boolean }
): { operatingDaysCount: number, totalPossibleOperatingMinutesInMonthPerUnit: number } => {
    
    const totalDaysInMonth = getDaysInMonthFns(new Date(year, month));
    let operatingDaysCount = 0;
    let totalPossibleOperatingMinutesInMonthPerUnit = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const currentDateStr = formatDateFns(currentDate, 'yyyy-MM-dd');
        
        const dayOperatingInfo = getOperatingMinutesForDayFn(currentDateStr, settings);

        if (!dayOperatingInfo.isHoliday) {
            const dailyNetOperatingMinutes = (dayOperatingInfo.endMinutes - dayOperatingInfo.startMinutes) - dayOperatingInfo.breakMinutes;
            if (dailyNetOperatingMinutes > 0) {
                operatingDaysCount++;
                totalPossibleOperatingMinutesInMonthPerUnit += dailyNetOperatingMinutes;
            }
        }
    }
    return { operatingDaysCount, totalPossibleOperatingMinutesInMonthPerUnit };
};