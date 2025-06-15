
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UnitsPageProps, Booking, Unit, ClinicSettingsData, MonthlyUnitUtilizationReportData, UnitMonthlyUsage, DayKey, Patient } from '../types';
import PageTitle from '../components/PageTitle';
import { getCurrentDateYYYYMMDD, getOperatingDaysInMonth } from '../utils';
import { DEFAULT_CLINIC_START_HOUR, DEFAULT_CLINIC_END_HOUR, TIME_SLOT_INTERVAL_MINUTES, UNIT_GANTT_HOUR_HEIGHT_PX, DAY_KEYS } from '../constants';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { isBefore } from 'date-fns/isBefore';
import { isEqual } from 'date-fns/isEqual';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import { getDay } from 'date-fns/getDay'; // To get day of week (0 for Sunday)
import { ja } from 'date-fns/locale/ja';
import MonthlyUtilizationReportModal from '../components/MonthlyUtilizationReportModal';

const timeToMinutes = (timeStr?: string): number | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

const UnitsPage: React.FC<UnitsPageProps> = ({ clinicSettings, allBookings, allPatients, onAddBooking, clinicHolidays }) => {
    const [selectedDate, setSelectedDate] = useState<string>(getCurrentDateYYYYMMDD());
    
    // Form state for new booking
    const [patientIdInput, setPatientIdInput] = useState('');
    const [resolvedPatientName, setResolvedPatientName] = useState<string | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('unit-1');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [formError, setFormError] = useState<string | null>(null);

    const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
    const [reportSelectedMonthDate, setReportSelectedMonthDate] = useState<Date>(startOfMonth(new Date()));
    const [monthlyReportData, setMonthlyReportData] = useState<MonthlyUnitUtilizationReportData | null>(null);


    const numberOfUnits = clinicSettings.numberOfUnits || 1; 
    const units = useMemo<Unit[]>(() => 
        Array.from({ length: numberOfUnits }, (_, i) => ({
            id: `unit-${i + 1}`,
            name: `ユニットNo.${i + 1}`
        }))
    , [numberOfUnits]);

    useEffect(() => {
        if (!units.find(u => u.id === selectedUnitId) && units.length > 0) {
            setSelectedUnitId(units[0].id);
        } else if (units.length === 0) {
            setSelectedUnitId('');
        }
    }, [units, selectedUnitId]);

    // Effect to resolve patient name when patientIdInput changes
    useEffect(() => {
        if (patientIdInput.trim() === '') {
            setResolvedPatientName(null);
            return;
        }
        const foundPatient = allPatients.find(p => p.id === patientIdInput.trim());
        if (foundPatient) {
            setResolvedPatientName(foundPatient.name);
        } else {
            setResolvedPatientName(null);
        }
    }, [patientIdInput, allPatients]);


    const getOperatingHoursForDate = useCallback((dateStr: string, settings: ClinicSettingsData): { startMinutes: number, endMinutes: number, breakMinutes: number, displayStart: string, displayEnd: string, isHoliday: boolean } => {
        const date = parseISO(dateStr);
        const dayIndex = getDay(date); // 0 (Sun) - 6 (Sat)
        const dayKey = DAY_KEYS[dayIndex]; // Ensure DAY_KEYS is ordered Sun-Sat or map index correctly

        const daySetting = settings.daySettings?.[dayKey];

        let opStartStr: string | undefined, opEndStr: string | undefined;
        let breakStartStr: string | undefined, breakEndStr: string | undefined;
        let isTodayHoliday = false;

        if (daySetting?.type === 'holiday') {
            isTodayHoliday = true;
        } else if (daySetting?.type === 'custom') {
            opStartStr = daySetting.customStartTime;
            opEndStr = daySetting.customEndTime;
            breakStartStr = daySetting.customBreakStartTime;
            breakEndStr = daySetting.customBreakEndTime;
        } else { // 'default' or undefined daySetting
            opStartStr = settings.defaultClinicStartTime;
            opEndStr = settings.defaultClinicEndTime;
            breakStartStr = settings.defaultBreakStartTime;
            breakEndStr = settings.defaultBreakEndTime;
        }
        
        opStartStr = opStartStr || `${DEFAULT_CLINIC_START_HOUR.toString().padStart(2, '0')}:00`;
        opEndStr = opEndStr || `${DEFAULT_CLINIC_END_HOUR.toString().padStart(2, '0')}:00`;

        let startMinutes = timeToMinutes(opStartStr) ?? (DEFAULT_CLINIC_START_HOUR * 60);
        let endMinutes = timeToMinutes(opEndStr) ?? (DEFAULT_CLINIC_END_HOUR * 60);
        
        if (startMinutes >= endMinutes) { // Fallback if times are invalid
            startMinutes = DEFAULT_CLINIC_START_HOUR * 60;
            endMinutes = DEFAULT_CLINIC_END_HOUR * 60;
        }

        let breakMinutesValue = 0;
        const breakStartMins = timeToMinutes(breakStartStr);
        const breakEndMins = timeToMinutes(breakEndStr);

        if (breakStartMins !== null && breakEndMins !== null && breakEndMins > breakStartMins) {
            // Ensure break is within operating hours
            const actualBreakStart = Math.max(breakStartMins, startMinutes);
            const actualBreakEnd = Math.min(breakEndMins, endMinutes);
            if (actualBreakEnd > actualBreakStart) {
                breakMinutesValue = actualBreakEnd - actualBreakStart;
            }
        }
        
        if (isTodayHoliday) {
             return { startMinutes: 0, endMinutes: 0, breakMinutes: 0, displayStart: "休診", displayEnd: "", isHoliday: true };
        }

        return {
            startMinutes,
            endMinutes,
            breakMinutes: breakMinutesValue,
            displayStart: opStartStr,
            displayEnd: opEndStr,
            isHoliday: false
        };
    }, []);


    const currentDayOperatingInfo = useMemo(() => getOperatingHoursForDate(selectedDate, clinicSettings), [selectedDate, clinicSettings, getOperatingHoursForDate]);

    const dailyOperatingMinutesPerUnit = useMemo(() => {
        // This value represents the 100% basis for a single unit's operating capacity on the selectedDate,
        // considering defined clinic operating hours and breaks (including day-specific settings from ClinicSettings).
        if (currentDayOperatingInfo.isHoliday) return 0;
        // Net operating minutes = (End Time - Start Time) - Break Time
        return (currentDayOperatingInfo.endMinutes - currentDayOperatingInfo.startMinutes) - currentDayOperatingInfo.breakMinutes;
    }, [currentDayOperatingInfo]);
    

    const handleAddBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!patientIdInput.trim()) { setFormError("患者IDを入力してください。"); return; }
        if (!resolvedPatientName) { setFormError("有効な患者IDを入力してください。患者が見つかりません。"); return;}
        if (!selectedUnitId) { setFormError("ユニットを選択してください。"); return; }
        if (!startTime || !endTime) { setFormError("開始時間と終了時間を入力してください。"); return; }

        const startDateTime = parseISO(`${selectedDate}T${startTime}`);
        const endDateTime = parseISO(`${selectedDate}T${endTime}`);

        if (isBefore(endDateTime, startDateTime) || isEqual(endDateTime, startDateTime)) {
            setFormError("終了時間は開始時間より後に設定してください。"); return;
        }
        
        const bookingStartMinutesFromMidnight = timeToMinutes(startTime)!;
        const bookingEndMinutesFromMidnight = timeToMinutes(endTime)!;

        if (currentDayOperatingInfo.isHoliday || 
            bookingStartMinutesFromMidnight < currentDayOperatingInfo.startMinutes || 
            bookingEndMinutesFromMidnight > currentDayOperatingInfo.endMinutes) {
             setFormError(`予約時間は本日の診療時間 (${currentDayOperatingInfo.displayStart} - ${currentDayOperatingInfo.displayEnd}) 内に設定してください。`); return;
        }

        // Validate against break times if applicable
        const breakStartMins = timeToMinutes(clinicSettings.daySettings?.[DAY_KEYS[getDay(parseISO(selectedDate))]]?.type === 'custom' ? clinicSettings.daySettings?.[DAY_KEYS[getDay(parseISO(selectedDate))]]?.customBreakStartTime : clinicSettings.defaultBreakStartTime);
        const breakEndMins = timeToMinutes(clinicSettings.daySettings?.[DAY_KEYS[getDay(parseISO(selectedDate))]]?.type === 'custom' ? clinicSettings.daySettings?.[DAY_KEYS[getDay(parseISO(selectedDate))]]?.customBreakEndTime : clinicSettings.defaultBreakEndTime);

        if (breakStartMins !== null && breakEndMins !== null && breakStartMins < breakEndMins) {
            if ( (bookingStartMinutesFromMidnight < breakEndMins && bookingEndMinutesFromMidnight > breakStartMins) ) {
                 setFormError(`予約時間が休憩時間 (${clinicSettings.daySettings?.[DAY_KEYS[getDay(parseISO(selectedDate))]]?.customBreakStartTime || clinicSettings.defaultBreakStartTime} - ${clinicSettings.daySettings?.[DAY_KEYS[getDay(parseISO(selectedDate))]]?.customBreakEndTime || clinicSettings.defaultBreakEndTime}) と重複しています。`); return;
            }
        }


        const existingBookingsForUnit = allBookings.filter(b => b.unitId === selectedUnitId && b.date === selectedDate);
        const overlap = existingBookingsForUnit.some(b => {
            const existingStart = parseISO(`${b.date}T${b.startTime}`);
            const existingEnd = parseISO(`${b.date}T${b.endTime}`);
            return (startDateTime < existingEnd && endDateTime > existingStart);
        });

        if (overlap) {
            setFormError("指定された時間に既に予約があります。"); return;
        }

        const newBooking: Booking = {
            id: Date.now().toString(),
            patientId: patientIdInput.trim(),
            patientNameDisplay: resolvedPatientName, // Use resolved name
            unitId: selectedUnitId,
            date: selectedDate,
            startTime,
            endTime,
        };
        onAddBooking(newBooking);
        setPatientIdInput(''); // Reset patient ID input
        // setResolvedPatientName(null); // Already handled by useEffect on patientIdInput change
    };

    const { dailyBookingsByUnit, dailyUtilizations } = useMemo(() => {
        const bookingsResult: { [unitId: string]: Booking[] } = {};
        const utilizationsResult: { [unitId: string]: number } = {};
        
        units.forEach(unit => {
            bookingsResult[unit.id] = allBookings.filter(b => b.unitId === unit.id && b.date === selectedDate);
            const bookedMinutes = bookingsResult[unit.id].reduce((total, booking) => {
                const start = parseISO(`${booking.date}T${booking.startTime}`);
                const end = parseISO(`${booking.date}T${booking.endTime}`);
                return total + differenceInMinutes(end, start);
            }, 0);
            utilizationsResult[unit.id] = dailyOperatingMinutesPerUnit > 0 ? Math.min(100, (bookedMinutes / dailyOperatingMinutesPerUnit) * 100) : 0;
        });
        return { dailyBookingsByUnit: bookingsResult, dailyUtilizations: utilizationsResult };
    }, [selectedDate, allBookings, units, dailyOperatingMinutesPerUnit]);

    const averageUtilization = useMemo(() => {
        if (units.length === 0 || dailyOperatingMinutesPerUnit <= 0) return 0; // Use <= 0 for safety
        
        const totalBookedMinutesSum = units.reduce((sum, unit) => {
            const unitBookings = dailyBookingsByUnit[unit.id] || [];
            const unitBookedTime = unitBookings.reduce((unitSum, booking) => {
                 const start = parseISO(`${booking.date}T${booking.startTime}`);
                 const end = parseISO(`${booking.date}T${booking.endTime}`);
                 return unitSum + differenceInMinutes(end, start);
            },0);
            return sum + unitBookedTime;
        },0);

        const totalPossibleMinutesAllUnits = dailyOperatingMinutesPerUnit * units.length;

        if (totalPossibleMinutesAllUnits === 0) return 0;
        return Math.min(100, (totalBookedMinutesSum / totalPossibleMinutesAllUnits) * 100);

    }, [dailyBookingsByUnit, units, dailyOperatingMinutesPerUnit]);


    const ganttChartStartHour = DEFAULT_CLINIC_START_HOUR; 
    const ganttChartEndHour = DEFAULT_CLINIC_END_HOUR;

    const timeLabels = useMemo(() => {
        const labels = [];
        const endH = ganttChartEndHour; 
        for (let hour = ganttChartStartHour; hour < endH; hour++) {
            labels.push(`${String(hour).padStart(2, '0')}:00`);
        }
        return labels;
    }, [ganttChartStartHour, ganttChartEndHour]);

    const getBookingStyle = (booking: Booking): React.CSSProperties => {
        const bookingStartDateTime = parseISO(`${booking.date}T${booking.startTime}`);
        const bookingEndDateTime = parseISO(`${booking.date}T${booking.endTime}`);
        // Use a fixed visual start for the Gantt chart display (e.g., 9 AM)
        const ganttDisplayStartTime = setHours(startOfDay(parseISO(booking.date)), ganttChartStartHour);
        
        const topOffsetMinutes = differenceInMinutes(bookingStartDateTime, ganttDisplayStartTime);
        const durationMinutes = differenceInMinutes(bookingEndDateTime, bookingStartDateTime);
        
        const top = Math.max(0, (topOffsetMinutes / 60) * UNIT_GANTT_HOUR_HEIGHT_PX); // Ensure top is not negative
        const height = (durationMinutes / 60) * UNIT_GANTT_HOUR_HEIGHT_PX;
        
        return { top: `${top}px`, height: `${height}px` };
    };

    const calculateMonthlyUtilization = useCallback(() => {
        const year = reportSelectedMonthDate.getFullYear();
        const month = reportSelectedMonthDate.getMonth(); 
        
        const operatingDaysAndTotalPossibleMinutes = getOperatingDaysInMonth(year, month, clinicSettings, getOperatingHoursForDate);
        const { operatingDaysCount, totalPossibleOperatingMinutesInMonthPerUnit } = operatingDaysAndTotalPossibleMinutes;

        if (operatingDaysCount === 0 || units.length === 0) { // totalPossibleOperatingMinutesInMonthPerUnit can be 0 if no operating hours
            setMonthlyReportData({
                month: format(reportSelectedMonthDate, 'yyyy-MM'),
                operatingDays: 0,
                unitsUsage: units.map(u => ({ unitId: u.id, unitName: u.name, totalBookedMinutes: 0, totalPossibleMinutes: 0, utilizationRate: 0 })),
                overallAverageUtilization: 0
            });
            return;
        }

        let totalBookedMinutesAllUnitsMonthly = 0;

        const unitsUsage: UnitMonthlyUsage[] = units.map(unit => {
            const bookingsForUnitInMonth = allBookings.filter(b => {
                const bookingDate = parseISO(b.date);
                return b.unitId === unit.id && bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
            });
            const totalBookedMinutesThisUnitMonthly = bookingsForUnitInMonth.reduce((sum, b) => {
                return sum + differenceInMinutes(parseISO(`${b.date}T${b.endTime}`), parseISO(`${b.date}T${b.startTime}`));
            }, 0);
            
            totalBookedMinutesAllUnitsMonthly += totalBookedMinutesThisUnitMonthly;
            // For individual unit monthly utilization, possible minutes is totalPossibleOperatingMinutesInMonthPerUnit (which is per unit for the month)
            const utilizationRate = totalPossibleOperatingMinutesInMonthPerUnit > 0 ? Math.min(100, (totalBookedMinutesThisUnitMonthly / totalPossibleOperatingMinutesInMonthPerUnit) * 100) : 0;
            
            return {
                unitId: unit.id,
                unitName: unit.name,
                totalBookedMinutes: totalBookedMinutesThisUnitMonthly,
                totalPossibleMinutes: totalPossibleOperatingMinutesInMonthPerUnit, // This is per unit for the month
                utilizationRate
            };
        });

        const overallTotalPossibleMinutesMonthlyForAllUnits = totalPossibleOperatingMinutesInMonthPerUnit * units.length;
        const overallAverageUtilization = overallTotalPossibleMinutesMonthlyForAllUnits > 0 ? Math.min(100, (totalBookedMinutesAllUnitsMonthly / overallTotalPossibleMinutesMonthlyForAllUnits) * 100) : 0;

        setMonthlyReportData({
            month: format(reportSelectedMonthDate, 'yyyy-MM'),
            operatingDays: operatingDaysCount,
            unitsUsage,
            overallAverageUtilization
        });
    }, [reportSelectedMonthDate, allBookings, units, clinicSettings, getOperatingHoursForDate]); 
    
    useEffect(() => {
        if (isMonthlyReportModalOpen) {
            calculateMonthlyUtilization();
        }
    }, [isMonthlyReportModalOpen, reportSelectedMonthDate, calculateMonthlyUtilization]);

    const handleNavigateReportMonth = (direction: 'prev' | 'next') => {
        setReportSelectedMonthDate(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
    };


    return (
        <div className="h-screen flex flex-col p-4 md:p-6 bg-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                 <PageTitle title="ユニット稼働" />
                 <div className="flex items-center space-x-2 mt-2 sm:mt-0 self-end sm:self-center">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)}
                        className="form-input text-sm py-1.5 px-2.5"
                    />
                    <button
                        onClick={() => setIsMonthlyReportModalOpen(true)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
                    >
                        月次レポート
                    </button>
                 </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 mt-4 overflow-hidden">
                {/* Left Panel: Booking Form & Average Utilization */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col space-y-6">
                    <form onSubmit={handleAddBookingSubmit} className="bg-white rounded-lg shadow p-4 space-y-3">
                        <h3 className="text-md font-semibold text-gray-700 border-b pb-2">新規登録</h3>
                        <div>
                            <label htmlFor="patientIdInput" className="block text-sm font-medium text-gray-700">患者ID *</label>
                            <input 
                                type="text" 
                                id="patientIdInput" 
                                value={patientIdInput} 
                                onChange={e => setPatientIdInput(e.target.value)} 
                                className="form-input mt-1 w-full text-sm" 
                                placeholder="患者IDを入力..."
                            />
                            {patientIdInput && (
                                <p className={`text-xs mt-1 ${resolvedPatientName ? 'text-green-600' : 'text-red-500'}`}>
                                    {resolvedPatientName ? `患者名: ${resolvedPatientName}` : '該当する患者が見つかりません。'}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="selectedUnitId" className="block text-sm font-medium text-gray-700">ユニット</label>
                            <select id="selectedUnitId" value={selectedUnitId} onChange={e => setSelectedUnitId(e.target.value)} className="form-select mt-1 w-full text-sm">
                                {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">来院日</label>
                            <input type="date" id="visitDate" value={selectedDate} readOnly className="form-input mt-1 w-full text-sm bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">開始時間</label>
                                <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="form-input mt-1 w-full text-sm" />
                            </div>
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">終了時間</label>
                                <input type="time" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="form-input mt-1 w-full text-sm" />
                            </div>
                        </div>
                        {formError && <p className="text-xs text-red-500">{formError}</p>}
                        <button type="submit" className="button-primary w-full text-sm">登録</button>
                    </form>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <h3 className="text-md font-semibold text-gray-700 mb-1">{format(parseISO(selectedDate), 'yyyy年MM月dd日 (E)', { locale: ja })}</h3>
                        <p className="text-sm text-gray-600">平均稼働率</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{averageUtilization.toFixed(1)}%</p>
                         <p className="text-xxs text-gray-500 mt-0.5">
                            (診療時間: {currentDayOperatingInfo.isHoliday ? "休診日" : `${currentDayOperatingInfo.displayStart || '未設定'} - ${currentDayOperatingInfo.displayEnd || '未設定'}`})
                        </p>
                    </div>
                </div>

                {/* Right Panel: Gantt Chart */}
                <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-x-auto custom-scrollbar">
                    <div className="flex min-w-max"> {/* Ensure content doesn't wrap and can scroll */}
                        {/* Time Gutter */}
                        <div className="w-16 sticky left-0 bg-white z-10">
                             <div className="h-8 border-b border-gray-200"></div> {/* Spacer for unit names row */}
                            {timeLabels.map(label => (
                                <div key={label} style={{ height: `${UNIT_GANTT_HOUR_HEIGHT_PX}px` }} className="flex items-center justify-center text-xs text-gray-500 border-r border-gray-200">
                                    {label}
                                </div>
                            ))}
                             <div className="h-8 border-t border-gray-200"></div> {/* Spacer for utilization rate row */}
                        </div>
                        {/* Unit Columns */}
                        {units.map(unit => (
                            <div key={unit.id} className="flex-1 min-w-[120px] border-r border-gray-200">
                                <div className="h-8 text-center text-sm font-medium text-gray-700 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-center">
                                    {unit.name}
                                </div>
                                <div className="relative" style={{ height: `${timeLabels.length * UNIT_GANTT_HOUR_HEIGHT_PX}px` }}> {/* Set explicit height for event positioning container */}
                                    {timeLabels.map(label => (
                                        <div key={`${unit.id}-${label}-bg`} style={{ height: `${UNIT_GANTT_HOUR_HEIGHT_PX}px` }} className="border-b border-gray-100"></div>
                                    ))}
                                    {(dailyBookingsByUnit[unit.id] || []).map(booking => (
                                        <div
                                            key={booking.id}
                                            className="absolute left-[2.5%] w-[95%] bg-teal-500 text-white p-1 rounded shadow-sm overflow-hidden text-xxs leading-tight cursor-pointer hover:bg-teal-600"
                                            style={getBookingStyle(booking)}
                                            title={`${booking.patientNameDisplay} (${booking.startTime}-${booking.endTime})`}
                                        >
                                            <p className="font-semibold truncate">{booking.patientNameDisplay}</p>
                                            <p className="truncate">{booking.startTime} - {booking.endTime}</p>
                                        </div>
                                    ))}
                                </div>
                                 <div className="h-8 text-center text-xs text-gray-600 border-t border-gray-200 flex items-center justify-center">
                                    稼働率: {currentDayOperatingInfo.isHoliday ? "休診" : (dailyUtilizations[unit.id]?.toFixed(1) || '0.0') + '%'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {isMonthlyReportModalOpen && (
                <MonthlyUtilizationReportModal
                    isOpen={isMonthlyReportModalOpen}
                    onClose={() => setIsMonthlyReportModalOpen(false)}
                    reportData={monthlyReportData}
                    currentReportMonth={reportSelectedMonthDate}
                    onNavigateMonth={handleNavigateReportMonth}
                />
            )}
        </div>
    );
};

export default UnitsPage;
