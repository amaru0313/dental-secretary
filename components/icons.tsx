
import React from 'react';
import { IconProps } from '../types';

const IconDefaultProps = {
    viewBox: "0 0 24 24",
    fill: "currentColor",
};

export const DashboardParentIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>);
export const SalesMonthIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z"/></svg>);
export const ProjectsIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>);
export const CalendarIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>);
export const SalesTargetGroupIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>);
export const InsuranceIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>);
export const PrivateSalesIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-.96.73-1.66 2.04-1.66 1.25 0 2 .63 2.16 1.6h2.1c-.17-1.67-1.44-2.89-3.6-3.35V4H9.5v1.57C7.86 6.02 6.7 7.15 6.7 8.75c0 2.02 1.67 3.09 4.19 3.67 2.12.5 2.81 1.25 2.81 2.2 0 1.05-.82 1.83-2.33 1.83-1.4 0-2.28-.7-2.43-1.7H6.7c.22 2.05 1.83 3.25 4.13 3.67V20h2v-1.57c1.78-.45 3-1.62 3-3.4 0-2.45-1.7-3.34-4.2-3.9z"/></svg>);
export const ProductsIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>);
export const UnitsIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>);
export const StaffIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>);
export const PatientsIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>);
export const SettingsIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22-.07-.49-.12.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>);
export const GenericUserIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>);
export const CloseIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>);
// export const AISummaryIcon: React.FC<IconProps> = ({ className }) => (<svg {...IconDefaultProps} className={className}><path d="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"/></svg>);


export const getIconForNavItem = (iconId: string, className: string = "w-5 h-5"): React.ReactNode | null => {
    switch (iconId) {
        case 'dashboard_parent': return <DashboardParentIcon className={className}/>;
        case 'dashboard': return <SalesMonthIcon className={className}/>;
        case 'projects': return <ProjectsIcon className={className}/>;
        case 'calendar': return <CalendarIcon className={className}/>;
        // case 'ai_summary': return <AISummaryIcon className={className}/>; // Removed
        case 'sales_targets_group': return <SalesTargetGroupIcon className={className}/>;
        case 'sales_targets_insurance': return <InsuranceIcon className={className}/>;
        case 'sales_targets_private': return <PrivateSalesIcon className={className}/>;
        case 'sales_targets_products': return <ProductsIcon className={className}/>;
        case 'units': return <UnitsIcon className={className}/>;
        case 'staff': return <StaffIcon className={className}/>;
        case 'patients': return <PatientsIcon className={className}/>;
        case 'settings': return <SettingsIcon className={className}/>;
        default: return null;
    }
};