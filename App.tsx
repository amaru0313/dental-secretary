import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import CalendarPage from './pages/CalendarPage';
import PatientListPage from './pages/PatientListPage';
import StaffManagementPage from './pages/StaffManagementPage';
import SettingsPage from './pages/SettingsPage';
import AnnualSalesTargetPage from './pages/AnnualSalesTargetPage';
import UnitsPage from './pages/UnitsPage'; 
// import AISummaryPage from './pages/AISummaryPage'; // Removed AI Summary Page
import InsuranceEntryModal from './components/InsuranceEntryModal';
import GeneralSaleEntryModal from './components/GeneralSaleEntryModal';
import MasterItemModal from './components/MasterItemModal';
import Loader from './components/Loader'; // Assuming a Loader component exists

import {
    NAV_CONFIG,
    DEFAULT_APP_TITLE,
    PATIENTS_STORAGE_KEY,
    STAFF_STORAGE_KEY,
    CLINIC_SETTINGS_STORAGE_KEY,
    ANNUAL_SALES_STORAGE_KEY,
    MASTER_ITEMS_STORAGE_KEY,
    PROJECTS_STORAGE_KEY, // Added
    CALENDAR_EVENTS_STORAGE_KEY,
    CLINIC_HOLIDAYS_STORAGE_KEY,
    BOOKINGS_STORAGE_KEY
} from './constants';
import {
    UnifiedNavItem,
    Patient,
    StaffMember,
    ClinicSettingsData,
    AnnualSalesDataStorage,
    MasterItem,
    DailySaleEntry,
    AnnualSalesCategoryKey,
    Project, // Added
    MainTodo, // Added
    SubTodo, // Added
    CalendarEvent,
    ClinicHoliday,
    Booking, // Added
    UnitsPageProps, // Added
    ProjectsPageProps,
    StaffManagementPageProps
} from './types';
import { loadFromLocalStorage, saveToLocalStorage, getCurrentDateYYYYMMDD } from './utils';

const App: React.FC = () => {
    const [activePageId, setActivePageId] = useState<string>('dashboard');
    const [activePageTitle, setActivePageTitle] = useState<string>('ダッシュボード > 売上/月');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 768);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Global Data States
    const [clinicSettings, setClinicSettings] = useState<ClinicSettingsData>({});
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [annualSalesData, setAnnualSalesData] = useState<AnnualSalesDataStorage>({ insurance: [], private: [], products: [] });
    const [allMasterItems, setAllMasterItems] = useState<MasterItem[]>([]);
    const [allProjects, setAllProjects] = useState<Project[]>([]); 
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [clinicHolidays, setClinicHolidays] = useState<ClinicHoliday[]>([]);
    const [allBookings, setAllBookings] = useState<Booking[]>([]); // Added for UnitBookings

    // Modal States
    const [showInsuranceModal, setShowInsuranceModal] = useState<boolean>(false);
    const [showGeneralSaleModal, setShowGeneralSaleModal] = useState<boolean>(false);
    const [showMasterItemModal, setShowMasterItemModal] = useState<boolean>(false);
    
    const [editingSaleEntry, setEditingSaleEntry] = useState<DailySaleEntry | null>(null);
    const [modalCategoryKey, setModalCategoryKey] = useState<AnnualSalesCategoryKey | null>(null);
    const [masterModalCategory, setMasterModalCategory] = useState<'private' | 'products' | null>(null);


    const findPageTitle = (pageId: string): string => {
        for (const item of NAV_CONFIG) {
            if (item.id === pageId && item.pageTitle) return item.pageTitle;
            if (item.subItems) {
                const subItem = item.subItems.find(sub => sub.id === pageId);
                if (subItem) return subItem.pageTitle;
            }
        }
        return DEFAULT_APP_TITLE;
    };
    
    useEffect(() => {
        // Load all initial data
        setClinicSettings(loadFromLocalStorage<ClinicSettingsData>(CLINIC_SETTINGS_STORAGE_KEY, {}));
        setAllPatients(loadFromLocalStorage<Patient[]>(PATIENTS_STORAGE_KEY, []));
        setAllStaff(loadFromLocalStorage<StaffMember[]>(STAFF_STORAGE_KEY, []));
        setAnnualSalesData(loadFromLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, { insurance: [], private: [], products: [] }));
        setAllMasterItems(loadFromLocalStorage<MasterItem[]>(MASTER_ITEMS_STORAGE_KEY, []));
        setAllProjects(loadFromLocalStorage<Project[]>(PROJECTS_STORAGE_KEY, [])); 
        setCalendarEvents(loadFromLocalStorage<CalendarEvent[]>(CALENDAR_EVENTS_STORAGE_KEY, []));
        setClinicHolidays(loadFromLocalStorage<ClinicHoliday[]>(CLINIC_HOLIDAYS_STORAGE_KEY, []));
        setAllBookings(loadFromLocalStorage<Booking[]>(BOOKINGS_STORAGE_KEY, [])); // Added for UnitBookings
        
        // Restore active page from session storage or default
        const savedPageId = sessionStorage.getItem('activePageId_dentalApp');
        const initialPageId = savedPageId || 'dashboard';
        setActivePageId(initialPageId);
        setActivePageTitle(findPageTitle(initialPageId));

        setIsLoading(false);

        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, []);

    useEffect(() => {
        document.title = activePageTitle;
        sessionStorage.setItem('activePageId_dentalApp', activePageId);
    }, [activePageId, activePageTitle]);

    const handleNavigate = (pageId: string, pageTitle: string) => {
        setActivePageId(pageId);
        setActivePageTitle(pageTitle);
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Data update handlers
    const handleSettingsSave = useCallback(() => {
        setClinicSettings(loadFromLocalStorage<ClinicSettingsData>(CLINIC_SETTINGS_STORAGE_KEY, {}));
    }, []);

    const handlePatientDataChange = useCallback(() => {
        setAllPatients(loadFromLocalStorage<Patient[]>(PATIENTS_STORAGE_KEY, []));
        setAnnualSalesData(loadFromLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, { insurance: [], private: [], products: [] }));
    }, []);

    const handleStaffDataChange = useCallback(() => {
        setAllStaff(loadFromLocalStorage<StaffMember[]>(STAFF_STORAGE_KEY, []));
        setAnnualSalesData(loadFromLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, { insurance: [], private: [], products: [] }));
    }, []);

    const handleSaleEntryUpdate = useCallback(() => {
        setAnnualSalesData(loadFromLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, { insurance: [], private: [], products: [] }));
    }, []);

    const handleMasterItemsUpdate = useCallback(() => {
        setAllMasterItems(loadFromLocalStorage<MasterItem[]>(MASTER_ITEMS_STORAGE_KEY, []));
        setAnnualSalesData(loadFromLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, { insurance: [], private: [], products: [] }));
    }, []);

    const calculateProjectProgress = (project: Project): number => {
        const totalTodos = project.mainTodos.length + project.subTodos.length;
        if (totalTodos === 0) return project.progress; // Keep manual progress if no todos, or return 0
        
        const completedMainTodos = project.mainTodos.filter(t => t.completed).length;
        const completedSubTodos = project.subTodos.filter(t => t.completed).length;
        const completedTodos = completedMainTodos + completedSubTodos;
        
        return Math.round((completedTodos / totalTodos) * 100);
    };


    // Project Management Handlers
    const handleSaveProject = useCallback((project: Project) => {
        setAllProjects(prevProjects => {
            const projectWithCalculatedProgress = {
                ...project,
                progress: calculateProjectProgress(project)
            };
            const existingIndex = prevProjects.findIndex(p => p.id === project.id);
            let updatedProjects;
            if (existingIndex > -1) {
                updatedProjects = [...prevProjects];
                updatedProjects[existingIndex] = projectWithCalculatedProgress;
            } else {
                updatedProjects = [...prevProjects, projectWithCalculatedProgress];
            }
            saveToLocalStorage(PROJECTS_STORAGE_KEY, updatedProjects);
            return updatedProjects;
        });
    }, []);

    const handleDeleteProject = useCallback((projectId: string) => {
        setAllProjects(prevProjects => {
            const updatedProjects = prevProjects.filter(p => p.id !== projectId);
            saveToLocalStorage(PROJECTS_STORAGE_KEY, updatedProjects);
            return updatedProjects;
        });
    }, []);

    const updateProjectTodos = (projectId: string, updateFn: (project: Project) => Project, recalculateProgress: boolean = true) => {
        setAllProjects(prevProjects => {
            const projectIndex = prevProjects.findIndex(p => p.id === projectId);
            if (projectIndex === -1) return prevProjects;
            
            let updatedProject = updateFn({ ...prevProjects[projectIndex] });
            if (recalculateProgress) {
                updatedProject.progress = calculateProjectProgress(updatedProject);
            }
            
            const updatedProjects = [...prevProjects];
            updatedProjects[projectIndex] = updatedProject;
            
            saveToLocalStorage(PROJECTS_STORAGE_KEY, updatedProjects);
            return updatedProjects;
        });
    };

    const handleSaveMainTodo = useCallback((projectId: string, todo: MainTodo) => {
        updateProjectTodos(projectId, project => {
            const todoIndex = project.mainTodos.findIndex(t => t.id === todo.id);
            if (todoIndex > -1) {
                project.mainTodos[todoIndex] = todo;
            } else {
                project.mainTodos.push(todo);
            }
            return project;
        });
    }, []);

    const handleDeleteMainTodo = useCallback((projectId: string, todoId: string) => {
        updateProjectTodos(projectId, project => {
            project.mainTodos = project.mainTodos.filter(t => t.id !== todoId);
            return project;
        });
    }, []);

    const handleToggleMainTodoComplete = useCallback((projectId: string, todoId: string) => {
        updateProjectTodos(projectId, project => {
            const todo = project.mainTodos.find(t => t.id === todoId);
            if (todo) {
                todo.completed = !todo.completed;
                todo.completedDate = todo.completed ? getCurrentDateYYYYMMDD() : undefined;
            }
            return project;
        });
    }, []);
    
    const handleSaveSubTodo = useCallback((projectId: string, todo: SubTodo) => {
        updateProjectTodos(projectId, project => {
            const todoIndex = project.subTodos.findIndex(t => t.id === todo.id);
            if (todoIndex > -1) {
                project.subTodos[todoIndex] = todo;
            } else {
                project.subTodos.push(todo);
            }
            return project;
        });
    }, []);

    const handleDeleteSubTodo = useCallback((projectId: string, todoId: string) => {
        updateProjectTodos(projectId, project => {
            project.subTodos = project.subTodos.filter(t => t.id !== todoId);
            return project;
        });
    }, []);

    const handleToggleSubTodoComplete = useCallback((projectId: string, todoId: string) => {
         updateProjectTodos(projectId, project => {
            const todo = project.subTodos.find(t => t.id === todoId);
            if (todo) {
                todo.completed = !todo.completed;
            }
            return project;
        });
    }, []);

    const handleUnassignProjectLeader = useCallback((projectId: string) => {
        updateProjectTodos(projectId, project => {
            project.projectLeader = '';
            return project;
        }, false); // Don't recalculate progress on unassigning leader
    }, []);

    const handleUnassignMainTodoAssignee = useCallback((projectId: string, todoId: string) => {
        updateProjectTodos(projectId, project => {
            const todo = project.mainTodos.find(t => t.id === todoId);
            if (todo) {
                todo.assignee = '';
            }
            return project;
        }, false); // Don't recalculate progress on unassigning assignee
    }, []);


    // Calendar Data Handlers
    const handleSaveCalendarEvent = useCallback((event: CalendarEvent) => {
        setCalendarEvents(prevEvents => {
            const existingIndex = prevEvents.findIndex(e => e.id === event.id);
            let updatedEvents;
            if (existingIndex > -1) {
                updatedEvents = [...prevEvents];
                updatedEvents[existingIndex] = event;
            } else {
                updatedEvents = [...prevEvents, event];
            }
            saveToLocalStorage(CALENDAR_EVENTS_STORAGE_KEY, updatedEvents);
            return updatedEvents;
        });
    }, []);

    const handleDeleteCalendarEvent = useCallback((eventId: string) => {
        setCalendarEvents(prevEvents => {
            const updatedEvents = prevEvents.filter(e => e.id !== eventId);
            saveToLocalStorage(CALENDAR_EVENTS_STORAGE_KEY, updatedEvents);
            return updatedEvents;
        });
    }, []);

    const handleToggleClinicHoliday = useCallback((date: string, holidayName: string = "休診日") => {
        setClinicHolidays(prevHolidays => {
            const existingHoliday = prevHolidays.find(h => h.date === date);
            let updatedHolidays;
            if (existingHoliday) {
                updatedHolidays = prevHolidays.filter(h => h.date !== date);
            } else {
                updatedHolidays = [...prevHolidays, { date, name: holidayName }];
            }
            saveToLocalStorage(CLINIC_HOLIDAYS_STORAGE_KEY, updatedHolidays);
            return updatedHolidays;
        });
    }, []);

    // Unit Booking Handlers
    const handleAddBooking = useCallback((booking: Booking) => {
        setAllBookings(prevBookings => {
            const updatedBookings = [...prevBookings, booking];
            saveToLocalStorage(BOOKINGS_STORAGE_KEY, updatedBookings);
            return updatedBookings;
        });
    }, []);


    // Modal Open/Close Handlers
    const handleOpenSaleEntryModal = (entry?: DailySaleEntry, category?: AnnualSalesCategoryKey) => {
        if (!category) return;
        setEditingSaleEntry(entry || null);
        setModalCategoryKey(category);
        if (category === 'insurance') {
            setShowInsuranceModal(true);
        } else if (category === 'private' || category === 'products') {
            setShowGeneralSaleModal(true);
        }
    };

    const handleCloseSalesModals = () => {
        setShowInsuranceModal(false);
        setShowGeneralSaleModal(false);
        setEditingSaleEntry(null);
        setModalCategoryKey(null);
    };
    
    const handleSaveSaleEntry = (entry: DailySaleEntry, category: AnnualSalesCategoryKey) => {
        const currentSales = loadFromLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, { insurance: [], private: [], products: [] });
        const categorySales = currentSales[category] ? [...currentSales[category]] : [];

        const existingIndex = categorySales.findIndex(e => e.id === entry.id);
        if (existingIndex > -1) {
            categorySales[existingIndex] = entry;
        } else {
            categorySales.push(entry);
        }
        
        saveToLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, {
            ...currentSales,
            [category]: categorySales
        });
        handleSaleEntryUpdate(); // Refresh data in App state
        handleCloseSalesModals();
    };


    const handleOpenMasterItemModal = (category: 'private' | 'products') => {
        setMasterModalCategory(category);
        setShowMasterItemModal(true);
    };

    const handleCloseMasterItemModal = () => {
        setShowMasterItemModal(false);
        setMasterModalCategory(null);
    };

    const renderPage = () => {
        if (isLoading) return <Loader />;
        
        const projectsPageProps: ProjectsPageProps = {
            allProjects,
            allStaff,
            onSaveProject: handleSaveProject,
            onDeleteProject: handleDeleteProject,
            onSaveMainTodo: handleSaveMainTodo,
            onDeleteMainTodo: handleDeleteMainTodo,
            onToggleMainTodoComplete: handleToggleMainTodoComplete,
            onSaveSubTodo: handleSaveSubTodo,
            onDeleteSubTodo: handleDeleteSubTodo,
            onToggleSubTodoComplete: handleToggleSubTodoComplete,
        };

        const staffManagementPageProps: StaffManagementPageProps = {
            allStaff,
            allProjects,
            calendarEvents, // Pass calendarEvents
            onDataChange: handleStaffDataChange,
            onUnassignProjectLeader: handleUnassignProjectLeader,
            onUnassignMainTodoAssignee: handleUnassignMainTodoAssignee,
        };
        
        const unitsPageProps: UnitsPageProps = {
            clinicSettings,
            allBookings,
            allPatients,
            clinicHolidays, // Pass clinicHolidays
            onAddBooking: handleAddBooking,
        };

        switch (activePageId) {
            case 'dashboard':
                return <DashboardPage />;
            case 'projects':
                return <ProjectsPage {...projectsPageProps} />;
            case 'calendar':
                return <CalendarPage 
                            allStaff={allStaff}
                            allProjects={allProjects} // Pass allProjects
                            calendarEvents={calendarEvents}
                            clinicHolidays={clinicHolidays}
                            onSaveEvent={handleSaveCalendarEvent}
                            onDeleteEvent={handleDeleteCalendarEvent}
                            onToggleHoliday={handleToggleClinicHoliday}
                        />;
            case 'sales_targets_insurance':
            case 'sales_targets_private':
            case 'sales_targets_products':
                return (
                    <AnnualSalesTargetPage
                        categoryKey={activePageId.split('_').pop() as AnnualSalesCategoryKey}
                        pageTitle={activePageTitle}
                        allPatients={allPatients}
                        allStaff={allStaff}
                        allMasterItems={allMasterItems}
                        clinicSettings={clinicSettings}
                        onSaleEntryUpdate={handleSaleEntryUpdate}
                        onEditEntryRequest={handleOpenSaleEntryModal}
                        onOpenMasterSettings={handleOpenMasterItemModal}
                    />
                );
            case 'units':
                return <UnitsPage {...unitsPageProps} />;
            case 'staff':
                return <StaffManagementPage {...staffManagementPageProps} />;
            case 'patients':
                return <PatientListPage onDataChange={handlePatientDataChange} allPatients={allPatients} annualSalesData={annualSalesData} />;
            case 'settings':
                return <SettingsPage onSettingsSave={handleSettingsSave} clinicSettings={clinicSettings} />;
            default:
                if (activePageId === 'ai_summary') { // Should not happen as it's removed
                    handleNavigate('dashboard', findPageTitle('dashboard'));
                    return <DashboardPage />;
                }
                return <DashboardPage />; // Fallback
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                activePageId={activePageId}
                onNavigate={handleNavigate}
                clinicName={clinicSettings.clinicName}
                logoImage={clinicSettings.logoImage}
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />
            <main 
                className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out 
                           ${isSidebarOpen && window.innerWidth < 768 ? 'blur-sm' : ''} 
                           md:ml-64`} 
            >
                 <button 
                    onClick={toggleSidebar} 
                    className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-lg"
                    aria-label="Toggle Menu"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex-1 px-8 pt-6"> {/* Changed px-8 to px-8 pt-6 */}
                    {renderPage()}
                </div>
            </main>

            {showInsuranceModal && modalCategoryKey === 'insurance' && (
                <InsuranceEntryModal
                    isOpen={showInsuranceModal}
                    onClose={handleCloseSalesModals}
                    onSave={(entry) => handleSaveSaleEntry(entry, 'insurance')}
                    patients={allPatients}
                    staffMembers={allStaff}
                    editingEntry={editingSaleEntry}
                />
            )}
            {showGeneralSaleModal && (modalCategoryKey === 'private' || modalCategoryKey === 'products') && (
                <GeneralSaleEntryModal
                    isOpen={showGeneralSaleModal}
                    onClose={handleCloseSalesModals}
                    onSave={(entry, category) => handleSaveSaleEntry(entry, category)}
                    category={modalCategoryKey as 'private' | 'products'}
                    patients={allPatients}
                    staffMembers={allStaff}
                    masterItems={allMasterItems.filter(item => item.category === modalCategoryKey)}
                    editingEntry={editingSaleEntry}
                />
            )}
            {showMasterItemModal && masterModalCategory && (
                <MasterItemModal
                    isOpen={showMasterItemModal}
                    onClose={handleCloseMasterItemModal}
                    category={masterModalCategory}
                    onMasterItemsUpdate={handleMasterItemsUpdate} 
                    existingMasterItems={allMasterItems.filter(item => item.category === masterModalCategory)}
                />
            )}
        </div>
    );
};

export default App;