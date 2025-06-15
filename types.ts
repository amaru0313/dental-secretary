import { STAFF_ROLES } from './constants'; // Removed DAY_KEYS import to break circular dependency path

// --- SVG Icon Components ---
export interface IconProps {
    className?: string;
}

// Navigation Types
export interface SubItemEntry {
    name: string;
    id: string;
    parentName: string;
    pageTitle: string;
    iconId: string;
}

export type NavConfigEntry =
    | { name: string; id: string; subItems: SubItemEntry[]; pageTitle?: undefined; iconId: string; }
    | { name: string; id: string; subItems?: undefined; pageTitle: string; iconId: string; };

export interface UnifiedNavItem {
    name: string;
    id: string;
    pageTitle: string;
    parentName?: string;
    iconId: string;
}

// Project Management Types
export type ProjectPriority = 'low' | 'medium' | 'high';

export interface MainTodo {
    id: string;
    projectId: string; // Link to parent project
    content: string; // Was 'name'
    completed: boolean;
    dueDate: string; // YYYY-MM-DD
    assignee: string; // Staff ID
    completedDate?: string; // YYYY-MM-DD, set when completed
}
export interface SubTodo {
    id: string;
    projectId: string; // Link to parent project
    // mainTodoId?: string; // Optional: if sub-todos can be linked to main todos later
    content: string; // Was 'name'
    completed: boolean;
}
export interface Project {
    id: string;
    name: string;
    purpose: string;
    deadline: string; // YYYY-MM-DD
    progress: number; // 0-100
    priority: ProjectPriority;
    projectLeader: string; // Staff ID
    department: string;
    mainTodos: MainTodo[];
    subTodos: SubTodo[];
}

// Patient List Types
export interface MedicalRecord {
    id: string;
    date: string; // YYYY-MM-DD
    content: string;
}

export interface Patient {
    id: string;
    name: string;
    dateOfBirth?: string; // YYYY-MM-DD
    lastVisitDate: string; // YYYY-MM-DD
    memo: string;
    medicalRecords: MedicalRecord[];
}

export interface PatientFormData { // Used for patient form
    id: string;
    name: string;
    lastVisitDate: string;
    memo: string;
}

// Staff Management Types
export type StaffRole = typeof STAFF_ROLES[number];

export interface StaffMember {
    id: string;
    name: string;
    role: StaffRole;
    specialty: string;
    icon: string; // Base64 Data URL for the icon
}

export interface StaffFormData { // Used for staff form
    name: string;
    role: StaffRole;
    specialty: string;
    icon: string;
}

export interface StaffManagementPageProps {
    onDataChange: () => void;
    allStaff: StaffMember[];
    allProjects: Project[];
    calendarEvents: CalendarEvent[]; // Added
    onUnassignProjectLeader: (projectId: string) => void;
    onUnassignMainTodoAssignee: (projectId: string, todoId: string) => void;
}

export interface StaffDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffMember: StaffMember | null;
    projectsLed: Project[];
    assignedMainTodos: (MainTodo & { projectName: string })[];
    assignedCalendarEvents: CalendarEvent[];
    onUnassignProjectLeader: (projectId: string) => void;
    onUnassignMainTodoAssignee: (projectId: string, todoId: string) => void;
}


// Annual Sales Target Types
export type AnnualSalesCategoryKey = 'insurance' | 'private' | 'products';

// Represents a single sale entry, used in modals and storage
export interface DailySaleEntry {
    id: string; // auto-generated unique ID for the sale entry
    date: string; // YYYY-MM-DD
    patientId: string; // ID of the patient, can be empty for product sales if not linked
    patientNameDisplay: string; // Name of the patient (auto-filled or '該当なし')
    
    // For single item / insurance / old data structure:
    //  - Insurance: Typically "保険診療 [points]点"
    //  - Private/Products (old): Manually entered name or MasterItem ID
    treatmentItem: string; 
    
    amount: number; // Total amount for this entry
    memo: string;
    staffId?: string; // ID of the staff member
    staffNameDisplay?: string; // Name of the staff member (auto-filled)
    
    // Insurance-specific
    insurancePoints?: number; 
    
    // General / Private / Products
    treatmentTimeMinutes?: number; 
    
    // For multiple items (Private/Products - new structure)
    // If this is present and populated, it's the source of truth for items.
    // `treatmentItem` might store the name of the first item or a summary for backward compatibility or display.
    // `amount` should be the sum of amounts derived from treatmentItems.
    treatmentItems?: { 
        id: string; // MasterItem ID
        quantity: number; 
        // unitPriceAtSale?: number; // Optional: Store unit price at the time of sale
        // itemNameAtSale?: string; // Optional: Store item name at the time of sale
    }[];
}


export interface AnnualSalesDataStorage {
    insurance: DailySaleEntry[];
    private: DailySaleEntry[];
    products: DailySaleEntry[];
}

// Master Item Types (for Private/Products)
export interface MasterItem {
    id: string; // Unique ID for the master item
    name: string; // 診療科目名 / 商品名
    unitPrice: number; // 単価
    category: 'private' | 'products'; // 所属カテゴリ
    annualTarget?: number; // 年間目標金額 (optional, for this specific item)
}
export interface MasterItemFormData { // Used for master item form
    name: string;
    unitPrice: number | string; // Allow string for form input, convert to number on save
    annualTarget?: number | string; // Allow string for form input
}


// Unit Operation Types
export interface Unit { // This might be dynamically generated based on settings
    id: string; // e.g., "unit-1", "unit-2"
    name: string; // e.g., "ユニットNo.1"
}
export interface Booking {
    id: string;
    unitId: string; // ID of the unit (e.g., "unit-1")
    patientId: string; // ID of the patient
    patientNameDisplay: string; // Display name of the patient, resolved from patientId
    date: string; // "YYYY-MM-DD"
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    // treatmentType?: string; // Optional, can be added later
}

// Clinic Settings Types
// Define DayKey directly as a literal union type to avoid circular dependency
export type DayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';


export interface DaySpecificHours {
    type: 'default' | 'holiday' | 'custom'; // 'default' uses main clinic hours, 'holiday' is closed, 'custom' uses specific hours for this day
    customStartTime?: string;       // HH:mm, only if type is 'custom'
    customEndTime?: string;         // HH:mm, only if type is 'custom'
    customBreakStartTime?: string;  // HH:mm, only if type is 'custom'
    customBreakEndTime?: string;    // HH:mm, only if type is 'custom'
}

export interface ClinicSettingsData {
    email?: string;
    passwordInput?: string; // Placeholder, not implemented
    clinicName?: string;
    address?: string;
    directorName?: string;
    phoneNumber?: string;
    logoImage?: string; // Base64 data URL
    numberOfUnits?: number;
    annualTargetInsurance?: number;
    annualTargetPrivate?: number;
    annualTargetProducts?: number;
    defaultClinicStartTime?: string; // HH:mm (Renamed from clinicStartTime)
    defaultClinicEndTime?: string;   // HH:mm (Renamed from clinicEndTime)
    defaultBreakStartTime?: string;  // HH:mm (New)
    defaultBreakEndTime?: string;    // HH:mm (New)
    daySettings?: Partial<Record<DayKey, DaySpecificHours>>; // Day-specific settings
}


// Displayable Record Type (for combined patient history view)
export interface DisplayableRecord {
    id: string; // Unique ID for display (e.g., `manual-${record.id}` or `${category}-${sale.id}`)
    date: string; // YYYY-MM-DD
    content: string; // Description of the record
    type: 'manual' | AnnualSalesCategoryKey; // Type of record
}

// Chart Data Item Type (used for Donut charts, etc.)
export interface ChartDataItem {
    name:string;
    value: number;
    percentage: number;
    color: string;
}

// Monthly Sales Data for Bar/Line Chart
export interface MonthlySalesChartData {
    month: string; // e.g., "1月", "2月"
    value: number; // Sales amount for that month
}

// Props for Page Components passed from App.tsx
export interface ProjectsPageProps {
    allProjects: Project[];
    allStaff: StaffMember[];
    onSaveProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onSaveMainTodo: (projectId: string, todo: MainTodo) => void;
    onDeleteMainTodo: (projectId: string, todoId: string) => void;
    onToggleMainTodoComplete: (projectId: string, todoId: string) => void;
    onSaveSubTodo: (projectId: string, todo: SubTodo) => void;
    onDeleteSubTodo: (projectId: string, todoId: string) => void;
    onToggleSubTodoComplete: (projectId: string, todoId: string) => void;
}
export interface PatientListPageProps {
    onDataChange: () => void;
    allPatients: Patient[];
    annualSalesData: AnnualSalesDataStorage;
}

export interface SettingsPageProps {
    onSettingsSave: () => void;
    clinicSettings: ClinicSettingsData;
}
export interface AnnualSalesTargetPageProps {
    categoryKey: AnnualSalesCategoryKey;
    pageTitle: string;
    allPatients: Patient[];
    allStaff: StaffMember[];
    allMasterItems: MasterItem[];
    clinicSettings: ClinicSettingsData;
    onSaleEntryUpdate: () => void;
    onEditEntryRequest: (entry?: DailySaleEntry, category?: AnnualSalesCategoryKey) => void;
    onOpenMasterSettings: (category: 'private' | 'products') => void;
}

export interface UnitsPageProps {
    clinicSettings: ClinicSettingsData;
    allBookings: Booking[];
    allPatients: Patient[]; 
    clinicHolidays: ClinicHoliday[]; 
    onAddBooking: (booking: Booking) => void;
}

// Unit Operation Monthly Report Types
export interface UnitMonthlyUsage {
    unitId: string;
    unitName: string;
    totalBookedMinutes: number;
    totalPossibleMinutes: number;
    utilizationRate: number; // 0-100
}
export interface MonthlyUnitUtilizationReportData {
    month: string; // YYYY-MM
    operatingDays: number;
    unitsUsage: UnitMonthlyUsage[];
    overallAverageUtilization: number;
}
export interface MonthlyUtilizationReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: MonthlyUnitUtilizationReportData | null;
    currentReportMonth: Date;
    onNavigateMonth: (direction: 'prev' | 'next') => void;
}


// Props for Modals
export interface InsuranceEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: DailySaleEntry) => void;
    patients: Patient[];
    staffMembers: StaffMember[];
    editingEntry?: DailySaleEntry | null;
}

export interface GeneralSaleEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: DailySaleEntry, category: 'private' | 'products') => void;
    category: 'private' | 'products';
    patients: Patient[];
    staffMembers: StaffMember[];
    masterItems: MasterItem[]; // Master items for the specific category
    editingEntry?: DailySaleEntry | null;
}

export interface MasterItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: 'private' | 'products';
    existingMasterItems: MasterItem[];
    onMasterItemsUpdate: () => void; // Callback to App.tsx to reload master items
}

// For ItemSharePanel, used within AnnualSalesTargetPage
export interface ItemSharePanelProps {
    categoryKey: 'private' | 'products';
    categorySalesData: DailySaleEntry[];
    categoryMasterItems: MasterItem[];
}

// Props for SimpleDonutChart
export interface SimpleDonutChartProps {
    data: ChartDataItem[];
    width?: number;
    height?: number;
    donutThickness?: number;
    title?: string;
}

// Calendar Types
export type CalendarView = 'month' | 'week' | 'day' | 'year';

export interface CalendarEvent {
    id: string;
    title: string;
    start: string; // ISO string for date/datetime
    end: string;   // ISO string for date/datetime
    allDay: boolean;
    staffId?: string; // ID of the assigned staff member
    role?: StaffRole; // Assigned role
    memo?: string;
    color?: string; // Optional: for event-specific color
    isHoliday?: boolean; // True if this event represents a clinic holiday (can be derived or explicit)
    isProjectDeadline?: boolean; // True if this event represents a project deadline
}

export interface ClinicHoliday {
    date: string; // YYYY-MM-DD format
    name: string; // e.g., "休診日" or specific holiday name
}

export interface CalendarPageProps {
    allStaff: StaffMember[];
    allProjects: Project[]; // Added
    calendarEvents: CalendarEvent[];
    clinicHolidays: ClinicHoliday[];
    onSaveEvent: (event: CalendarEvent) => void;
    onDeleteEvent: (eventId: string) => void;
    onToggleHoliday: (date: string, holidayName?: string) => void; // YYYY-MM-DD
}

export interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete?: (eventId: string) => void; // Optional for new events
    event?: CalendarEvent | null; // Event to edit, or null for new
    selectedDate?: string | null; // YYYY-MM-DD, for pre-filling date for new event
    selectedTime?: string | null; // HH:mm, for pre-filling time for new event in DayView
    allStaff: StaffMember[];
}

// Props for common calendar view components
export interface BaseCalendarViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    holidays: ClinicHoliday[];
    onEventClick: (event: CalendarEvent) => void;
    allStaff: StaffMember[];
}

export interface CalendarMonthViewProps extends BaseCalendarViewProps {
    onDayClick: (date: Date) => void; // For opening modal to add new event
}

export interface CalendarWeekViewProps extends BaseCalendarViewProps {
    onDayClick: (date: Date) => void; // For opening modal to add new event
}

export interface CalendarDayViewProps extends BaseCalendarViewProps {
    onTimeSlotClick: (date: Date, time?: string) => void; // For opening modal for a specific time or all-day
}

export interface CalendarYearViewProps extends BaseCalendarViewProps {
    onMonthDayClick: (date: Date) => void; // For navigating to Day view for this date
}