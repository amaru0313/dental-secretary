
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StaffMember, StaffFormData, StaffRole, StaffManagementPageProps, Project, MainTodo, CalendarEvent, StaffDetailModalProps } from '../types';
import { STAFF_ROLES, STAFF_STORAGE_KEY } from '../constants';
import { loadFromLocalStorage, saveToLocalStorage, formatDateForDisplay } from '../utils';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import PageTitle from '../components/PageTitle';
import { GenericUserIcon, CloseIcon } from '../components/icons'; // For placeholder & modal
import { parseISO } from 'date-fns/parseISO';
import { format as formatDateFns } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { ja } from 'date-fns/locale/ja';

// --- Staff Detail Modal ---
const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
    isOpen, onClose, staffMember, projectsLed, assignedMainTodos, assignedCalendarEvents,
    onUnassignProjectLeader, onUnassignMainTodoAssignee
}) => {
    if (!isOpen || !staffMember) return null;

    const formatEventTime = (isoString: string, allDay: boolean): string => {
        try {
            const dateObj = parseISO(isoString);
            if (!isValid(dateObj)) return '無効な日付';
            if (allDay) return formatDateFns(dateObj, 'yyyy/MM/dd', { locale: ja });
            return formatDateFns(dateObj, 'yyyy/MM/dd HH:mm', { locale: ja });
        } catch {
            return 'エラー';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                        {staffMember.icon ? (
                            <img src={staffMember.icon} alt={staffMember.name} className="h-12 w-12 rounded-full object-cover mr-3" />
                        ) : (
                            <GenericUserIcon className="h-12 w-12 text-gray-400 mr-3" />
                        )}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">{staffMember.name}</h3>
                            <p className="text-sm text-blue-600">{staffMember.role}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon className="w-6 h-6" /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {staffMember.specialty && (
                        <section>
                            <h4 className="text-md font-semibold text-gray-700 mb-1">専門・得意なこと</h4>
                            <p className="text-sm text-gray-600">{staffMember.specialty}</p>
                        </section>
                    )}

                    <section>
                        <h4 className="text-md font-semibold text-gray-700 mb-2">担当プロジェクト (リーダー)</h4>
                        {projectsLed.length > 0 ? (
                            <ul className="space-y-1.5 text-sm">
                                {projectsLed.map(p => (
                                    <li key={`leader-${p.id}`} className="flex justify-between items-center p-2 bg-gray-50 border rounded-md">
                                        <div>
                                            <span className="font-medium text-gray-800">{p.name}</span>
                                            <span className="text-xs text-gray-500 ml-2">(期日: {formatDateForDisplay(p.deadline)})</span>
                                        </div>
                                        <button onClick={() => onUnassignProjectLeader(p.id)} className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-100" title="担当解除">担当解除</button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">リーダー担当プロジェクトはありません。</p>}
                    </section>

                    <section>
                        <h4 className="text-md font-semibold text-gray-700 mb-2">担当メインTodo</h4>
                        {assignedMainTodos.length > 0 ? (
                            <ul className="space-y-1.5 text-sm">
                                {assignedMainTodos.map(t => (
                                    <li key={`todo-${t.id}`} className="flex justify-between items-center p-2 bg-gray-50 border rounded-md">
                                        <div>
                                            <span className="font-medium text-gray-800">{t.content}</span>
                                            <span className="text-xs text-gray-500 ml-2">(プロジェクト: {t.projectName} | 期日: {formatDateForDisplay(t.dueDate)})</span>
                                        </div>
                                        <button onClick={() => onUnassignMainTodoAssignee(t.projectId, t.id)} className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-100" title="担当解除">担当解除</button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">担当メインTodoはありません。</p>}
                    </section>
                    
                    <section>
                        <h4 className="text-md font-semibold text-gray-700 mb-2">カレンダー予定</h4>
                        {assignedCalendarEvents.length > 0 ? (
                            <ul className="space-y-1.5 text-sm">
                                {assignedCalendarEvents.map(event => (
                                    <li key={event.id} className="p-2 bg-gray-50 border rounded-md">
                                        <span className="font-medium text-gray-800">{event.title}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({formatEventTime(event.start, event.allDay)} - {formatEventTime(event.end, event.allDay)})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">関連するカレンダー予定はありません。</p>}
                    </section>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={onClose}>閉じる</button>
                </div>
            </div>
        </div>
    );
};


// --- Staff Management Page ---
const StaffManagementPage: React.FC<StaffManagementPageProps> = ({ 
    onDataChange, 
    allStaff: initialStaff, 
    allProjects,
    calendarEvents,
    onUnassignProjectLeader,
    onUnassignMainTodoAssignee
}) => {
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaff);
    const [showStaffFormModal, setShowStaffFormModal] = useState(false);
    const [isEditingStaff, setIsEditingStaff] = useState(false);
    const [currentStaffIdEditing, setCurrentStaffIdEditing] = useState<string | null>(null);
    const [staffFormData, setStaffFormData] = useState<StaffFormData>({
        name: '', role: STAFF_ROLES[0], specialty: '', icon: ''
    });
    const [staffFormError, setStaffFormError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [itemToDeleteDetails, setItemToDeleteDetails] = useState<{ id: string, name: string } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [selectedStaffDetail, setSelectedStaffDetail] = useState<StaffMember | null>(null);
    const [isStaffDetailModalOpen, setIsStaffDetailModalOpen] = useState(false);


    useEffect(() => {
        setStaffMembers(initialStaff);
    }, [initialStaff]);

    const saveStaffToLocalStorage = (updatedStaff: StaffMember[]) => {
        saveToLocalStorage(STAFF_STORAGE_KEY, updatedStaff);
        onDataChange(); 
    };

    const handleStaffFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setStaffFormData(prev => ({ ...prev, [name]: value as StaffRole })); 
    };

    const handleIconFileProcessing = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setStaffFormData(prev => ({ ...prev, icon: loadEvent.target?.result as string }));
                setStaffFormError(null);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            setStaffFormError('画像ファイルを選択してください。 (PNG, JPG, GIFなど)');
        }
    };
    
    const handleIconDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setDragging(false);
        handleIconFileProcessing(e.dataTransfer.files[0]);
    };
    const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleIconFileProcessing(e.target.files?.[0] || null);
    };

    const validateStaffForm = (): boolean => {
        if (!staffFormData.name.trim()) { setStaffFormError('氏名は必須です。'); return false; }
        if (!staffFormData.role) { setStaffFormError('役職は必須です。'); return false; }
        setStaffFormError(null);
        return true;
    };

    const handleStaffSubmit = () => {
        if (!validateStaffForm()) return;
        let updatedStaffList;
        if (isEditingStaff && currentStaffIdEditing) {
            updatedStaffList = staffMembers.map(s =>
                s.id === currentStaffIdEditing ? { ...s, ...staffFormData } : s
            );
        } else {
            const newStaffMember: StaffMember = { id: Date.now().toString(), ...staffFormData };
            updatedStaffList = [...staffMembers, newStaffMember];
        }
        setStaffMembers(updatedStaffList);
        saveStaffToLocalStorage(updatedStaffList);
        setShowStaffFormModal(false);
        resetStaffForm();
    };

    const openNewStaffModal = () => {
        resetStaffForm();
        setIsEditingStaff(false);
        setCurrentStaffIdEditing(null);
        setShowStaffFormModal(true);
    };

    const openEditStaffModal = (staff: StaffMember) => {
        setStaffFormData({ name: staff.name, role: staff.role, specialty: staff.specialty, icon: staff.icon });
        setIsEditingStaff(true);
        setCurrentStaffIdEditing(staff.id);
        setShowStaffFormModal(true);
        setStaffFormError(null);
    };
    
    const resetStaffForm = () => {
        setStaffFormData({ name: '', role: STAFF_ROLES[0], specialty: '', icon: '' });
        setStaffFormError(null);
        setDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
    };

    const requestDeleteStaff = (staffId: string, staffName: string) => {
        setItemToDeleteDetails({ id: staffId, name: staffName });
        setShowConfirmDeleteModal(true);
    };

    const performActualDeleteStaff = () => {
        if (!itemToDeleteDetails) return;
        const updatedStaff = staffMembers.filter(s => s.id !== itemToDeleteDetails.id);
        setStaffMembers(updatedStaff);
        saveStaffToLocalStorage(updatedStaff);
        if (showStaffFormModal && currentStaffIdEditing === itemToDeleteDetails.id) {
             setShowStaffFormModal(false); resetStaffForm();
        }
        if (selectedStaffDetail?.id === itemToDeleteDetails.id) { // If deleting the staff member whose detail is open
            setIsStaffDetailModalOpen(false);
            setSelectedStaffDetail(null);
        }
        setItemToDeleteDetails(null);
    };

    const handleStaffCardClick = (staff: StaffMember) => {
        setSelectedStaffDetail(staff);
        setIsStaffDetailModalOpen(true);
    };
    
    const projectsLedBySelectedStaff = useMemo(() => {
        if (!selectedStaffDetail) return [];
        return allProjects.filter(p => p.projectLeader === selectedStaffDetail.id);
    }, [selectedStaffDetail, allProjects]);

    const mainTodosAssignedToSelectedStaff = useMemo(() => {
        if (!selectedStaffDetail) return [];
        const todos: (MainTodo & { projectName: string })[] = [];
        allProjects.forEach(project => {
            project.mainTodos.forEach(todo => {
                if (todo.assignee === selectedStaffDetail.id) {
                    todos.push({ ...todo, projectName: project.name });
                }
            });
        });
        return todos.sort((a,b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
    }, [selectedStaffDetail, allProjects]);

    const calendarEventsForSelectedStaff = useMemo(() => {
        if (!selectedStaffDetail) return [];
        return calendarEvents.filter(event => event.staffId === selectedStaffDetail.id)
               .sort((a,b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
    }, [selectedStaffDetail, calendarEvents]);


    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <PageTitle title="社員管理" />
            <div className="mb-4 flex justify-end">
                <button 
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    onClick={openNewStaffModal}
                >
                    新規社員登録
                </button>
            </div>

            {staffMembers.length === 0 ? (
                 <div className="text-center py-10">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">登録社員なし</h3>
                    <p className="mt-1 text-sm text-gray-500">「新規社員登録」から社員情報を追加してください。</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {staffMembers.sort((a,b) => a.name.localeCompare(b.name, 'ja')).map(staff => (
                            <div key={staff.id} 
                                 className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-shadow duration-200"
                                 onClick={() => handleStaffCardClick(staff)}
                                 role="button"
                                 tabIndex={0}
                                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStaffCardClick(staff);}}
                                 aria-label={`社員 ${staff.name} の詳細を表示`}
                            >
                                <div className={`h-40 w-full flex items-center justify-center ${staff.icon ? 'bg-gray-200' : 'bg-gray-300'}`}>
                                    {staff.icon ? (
                                        <img src={staff.icon} alt={`${staff.name} icon`} className="h-full w-full object-cover" />
                                    ) : (
                                        <GenericUserIcon className="w-20 h-20 text-gray-500" />
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 truncate" title={staff.name}>{staff.name}</h3>
                                        <p className="text-sm text-blue-600 font-medium">{staff.role}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate" title={staff.specialty || '特記事項なし'}>{staff.specialty || '特記事項なし'}</p>
                                    </div>
                                    {/* Edit button is now part of the detail modal, or can be added back here if desired */}
                                     <button 
                                        className="mt-3 w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); openEditStaffModal(staff);}} // Stop propagation to prevent opening detail modal
                                    >
                                        基本情報編集
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
                </div>
            )}

            {/* Staff Registration/Edit Form Modal */}
            {showStaffFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">{isEditingStaff ? '社員情報編集' : '新規社員登録'}</h3>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label htmlFor="staffName" className="block text-sm font-medium text-gray-700 mb-1">氏名 *</label>
                                <input type="text" id="staffName" name="name" value={staffFormData.name} onChange={handleStaffFormChange} className="form-input w-full" />
                            </div>
                            <div>
                                <label htmlFor="staffRole" className="block text-sm font-medium text-gray-700 mb-1">役職 *</label>
                                <select id="staffRole" name="role" value={staffFormData.role} onChange={handleStaffFormChange} className="form-select w-full">
                                    {STAFF_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="staffSpecialty" className="block text-sm font-medium text-gray-700 mb-1">得意なこと・専門</label>
                                <input type="text" id="staffSpecialty" name="specialty" value={staffFormData.specialty} onChange={handleStaffFormChange} className="form-input w-full" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">アイコン画像</label>
                                <div 
                                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md ${dragging ? 'border-blue-500 bg-blue-50' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
                                    onDrop={handleIconDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="space-y-1 text-center">
                                        {staffFormData.icon ? (
                                            <img src={staffFormData.icon} alt="プレビュー" className="mx-auto h-24 w-24 object-contain rounded mb-2"/>
                                        ) : (
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                        <div className="flex text-sm text-gray-600">
                                            <p className="pl-1">{staffFormData.icon ? '画像を置き換える' : '画像をアップロード'}</p>
                                        </div>
                                        <p className="text-xs text-gray-500">ドラッグ＆ドロップまたはクリックして選択</p>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleIconFileChange} className="sr-only" />
                                    </div>
                                </div>
                            </div>
                            {staffFormError && <p className="text-sm text-red-600">{staffFormError}</p>}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                             {isEditingStaff && currentStaffIdEditing && (
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                                    onClick={() => requestDeleteStaff(currentStaffIdEditing, staffFormData.name)}
                                >
                                    この社員を削除
                                </button>
                            )}
                            <div className="flex-1"></div> {/* Spacer */}
                            <div className="space-x-3">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={() => {setShowStaffFormModal(false); resetStaffForm();}}>キャンセル</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md" onClick={handleStaffSubmit}>{isEditingStaff ? '更新' : '登録'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <StaffDetailModal
                isOpen={isStaffDetailModalOpen}
                onClose={() => setIsStaffDetailModalOpen(false)}
                staffMember={selectedStaffDetail}
                projectsLed={projectsLedBySelectedStaff}
                assignedMainTodos={mainTodosAssignedToSelectedStaff}
                assignedCalendarEvents={calendarEventsForSelectedStaff}
                onUnassignProjectLeader={onUnassignProjectLeader}
                onUnassignMainTodoAssignee={onUnassignMainTodoAssignee}
            />

             <ConfirmDeleteModal
                isOpen={showConfirmDeleteModal}
                onClose={() => {setShowConfirmDeleteModal(false); setItemToDeleteDetails(null);}}
                onConfirm={performActualDeleteStaff}
                itemName={itemToDeleteDetails?.name}
                message={`社員「${itemToDeleteDetails?.name}」を本当に削除しますか？この操作は元に戻せません。関連するプロジェクトやTodoの担当者割り当ては手動で変更する必要があります。`}
            />
        </div>
    );
};

export default StaffManagementPage;
