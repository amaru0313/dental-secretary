import { NavConfigEntry, ProjectPriority, DayKey } from './types';

export const STAFF_ROLES = [
    '歯科医師', '歯科衛生士', '歯科助手', '歯科技工士', '受付', '事務', '理事長', '院長', '事務長'
] as const;

export const STAFF_STORAGE_KEY = 'dentalAppStaffMembers';
export const CLINIC_SETTINGS_STORAGE_KEY = 'dentalAppClinicSettings';
export const ANNUAL_SALES_STORAGE_KEY = 'dentalAppAnnualSalesData';
export const PATIENTS_STORAGE_KEY = 'dentalAppPatients';
export const MASTER_ITEMS_STORAGE_KEY = 'dentalAppMasterItems';
export const PROJECTS_STORAGE_KEY = 'dentalAppProjects'; // Added
export const CALENDAR_EVENTS_STORAGE_KEY = 'dentalAppCalendarEvents';
export const CLINIC_HOLIDAYS_STORAGE_KEY = 'dentalAppClinicHolidays';
export const BOOKINGS_STORAGE_KEY = 'dentalAppBookings';


export const NAV_CONFIG: NavConfigEntry[] = [
    {
        name: 'ダッシュボード',
        id: 'dashboard_parent',
        iconId: 'dashboard_parent',
        subItems: [
            { name: '売上/月', id: 'dashboard', parentName: 'ダッシュボード', pageTitle: 'ダッシュボード > 売上/月', iconId: 'dashboard' },
            { name: 'プロジェクト管理', id: 'projects', parentName: 'ダッシュボード', pageTitle: 'ダッシュボード > プロジェクト管理', iconId: 'projects' },
            { name: 'カレンダー', id: 'calendar', parentName: 'ダッシュボード', pageTitle: 'ダッシュボード > カレンダー', iconId: 'calendar' },
            // { name: 'AI要約', id: 'ai_summary', parentName: 'ダッシュボード', pageTitle: 'ダッシュボード > AI要約', iconId: 'ai_summary' }, // Removed
        ],
    },
    {
        name: '売上目標/年',
        id: 'sales_targets_group',
        iconId: 'sales_targets_group',
        subItems: [
            { name: '保険診療', id: 'sales_targets_insurance', parentName: '売上目標/年', pageTitle: '売上目標/年 > 保険診療', iconId: 'sales_targets_insurance' },
            { name: '自費治療', id: 'sales_targets_private', parentName: '売上目標/年', pageTitle: '売上目標/年 > 自費治療', iconId: 'sales_targets_private' },
            { name: '物販', id: 'sales_targets_products', parentName: '売上目標/年', pageTitle: '売上目標/年 > 物販', iconId: 'sales_targets_products' },
        ],
    },
    { name: 'ユニット稼働', id: 'units', pageTitle: 'ユニット稼働', iconId: 'units' },
    { name: '社員管理', id: 'staff', pageTitle: '社員管理', iconId: 'staff' },
    { name: '患者リスト', id: 'patients', pageTitle: '患者リスト', iconId: 'patients' },
    { name: '医院設定', id: 'settings', pageTitle: '医院設定', iconId: 'settings' },
];

export const CHART_COLORS = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#6f42c1", "#fd7e14", "#20c997", "#6610f2", "#e83e8c"];
export const OTHER_MANUAL_ENTRY_NAME = "その他手入力";
export const MANUALLY_ENTER_ID = "--manual--";

export const DEFAULT_APP_TITLE = "デンタル秘書";
export const EVENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#8b5cf6'];
export const PROJECT_DEADLINE_EVENT_COLOR = '#fd7e14'; // Orange for project deadlines
export const PROJECT_PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high'] as const;
export const PRIORITY_MAP: { [key in ProjectPriority]: string } = {
  low: '低',
  medium: '中',
  high: '高',
};
export const PRIORITY_COLORS: { [key in ProjectPriority]: string } = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
};
export const URGENT_PROJECT_BG = 'bg-red-100 hover:bg-red-200 border-red-300';
export const HIGH_PRIORITY_PROJECT_BG = 'bg-red-100 hover:bg-red-200 border-red-300'; // Same for now
export const DEFAULT_PROJECT_BG = 'bg-white hover:bg-gray-50 border-gray-200';
export const COMPLETED_PROJECT_BG = 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800'; // Added for completed projects

// Unit Operation Page Defaults
export const DEFAULT_CLINIC_START_HOUR = 9; // 9 AM
export const DEFAULT_CLINIC_END_HOUR = 18;   // 6 PM
export const TIME_SLOT_INTERVAL_MINUTES = 30;
export const UNIT_GANTT_HOUR_HEIGHT_PX = 50; // Height of one hour slot in Gantt chart

// Day keys for settings (ensure order matches date-fns getDay: Sun=0 to Sat=6)
export const DAY_KEYS: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const DAY_NAMES_JP: Record<DayKey, string> = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
};
