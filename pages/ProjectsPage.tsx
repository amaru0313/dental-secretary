
import React, { useState, useMemo, useCallback } from 'react';
import { Project, MainTodo, SubTodo, StaffMember, ProjectPriority, ProjectsPageProps } from '../types';
import PageTitle from '../components/PageTitle';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { formatDateForDisplay, isDateWithinTwoWeeks, getCurrentDateYYYYMMDD } from '../utils';
import { PROJECT_PRIORITIES, PRIORITY_MAP, DEFAULT_PROJECT_BG, URGENT_PROJECT_BG, HIGH_PRIORITY_PROJECT_BG, COMPLETED_PROJECT_BG } from '../constants';
import { addDays } from 'date-fns/addDays';
import { subDays } from 'date-fns/subDays';
import { parseISO } from 'date-fns/parseISO';
import { differenceInDays } from 'date-fns/differenceInDays';

// Helper to calculate progress based on Todos
const calculateProgressFromTodos = (project: Project): number => {
    const totalTodos = project.mainTodos.length + project.subTodos.length;
    if (totalTodos === 0) {
        return project.progress; // Return manually set progress if no todos
    }
    const completedMainTodos = project.mainTodos.filter(t => t.completed).length;
    const completedSubTodos = project.subTodos.filter(t => t.completed).length;
    return Math.round(((completedMainTodos + completedSubTodos) / totalTodos) * 100);
};


// --- Project Modal ---
interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Project) => void;
    projectToEdit?: Project | null;
    allStaff: StaffMember[];
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, projectToEdit, allStaff }) => {
    const [name, setName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState<ProjectPriority>('medium');
    const [projectLeader, setProjectLeader] = useState('');
    const [department, setDepartment] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const hasTodos = useMemo(() => {
        if (!projectToEdit) return false;
        return (projectToEdit.mainTodos.length + projectToEdit.subTodos.length) > 0;
    }, [projectToEdit]);

    React.useEffect(() => {
        if (isOpen) {
            if (projectToEdit) {
                setName(projectToEdit.name);
                setPurpose(projectToEdit.purpose);
                setDeadline(projectToEdit.deadline);
                setPriority(projectToEdit.priority);
                setProjectLeader(projectToEdit.projectLeader);
                setDepartment(projectToEdit.department);
                // If todos exist, calculate progress, otherwise use stored progress
                setProgress(hasTodos ? calculateProgressFromTodos(projectToEdit) : projectToEdit.progress);
            } else {
                setName('');
                setPurpose('');
                setDeadline(formatDateForDisplay(addDays(new Date(), 30).toISOString(), 'yyyy-MM-dd')); // Default 30 days
                setPriority('medium');
                setProjectLeader('');
                setDepartment('');
                setProgress(0); // New projects start with 0 progress
            }
            setError(null);
        }
    }, [isOpen, projectToEdit, hasTodos]);

    const handleSubmit = () => {
        if (!name.trim()) { setError('プロジェクト名は必須です。'); return; }
        if (!deadline) { setError('期日は必須です。'); return; }
        
        const currentProgress = hasTodos && projectToEdit ? calculateProgressFromTodos(projectToEdit) : progress;

        const projectData: Project = {
            id: projectToEdit?.id || Date.now().toString(),
            name, purpose, deadline, priority, projectLeader, department, 
            progress: currentProgress, // Use calculated or manually set progress
            mainTodos: projectToEdit?.mainTodos || [],
            subTodos: projectToEdit?.subTodos || [],
        };
        onSave(projectData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">{projectToEdit ? 'プロジェクト編集' : '新規プロジェクト作成'}</h3>
                </div>
                <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar">
                    <div>
                        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">プロジェクト名*</label>
                        <input type="text" id="projectName" value={name} onChange={e => setName(e.target.value)} className="form-input mt-1 w-full"/>
                    </div>
                    <div>
                        <label htmlFor="projectPurpose" className="block text-sm font-medium text-gray-700">目的</label>
                        <textarea id="projectPurpose" value={purpose} onChange={e => setPurpose(e.target.value)} rows={2} className="form-textarea mt-1 w-full"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="projectDeadline" className="block text-sm font-medium text-gray-700">期日*</label>
                            <input type="date" id="projectDeadline" value={deadline} onChange={e => setDeadline(e.target.value)} className="form-input mt-1 w-full"/>
                        </div>
                        <div>
                            <label htmlFor="projectPriority" className="block text-sm font-medium text-gray-700">優先度</label>
                            <select id="projectPriority" value={priority} onChange={e => setPriority(e.target.value as ProjectPriority)} className="form-select mt-1 w-full">
                                {PROJECT_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_MAP[p]}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="projectLeader" className="block text-sm font-medium text-gray-700">リーダー</label>
                            <select id="projectLeader" value={projectLeader} onChange={e => setProjectLeader(e.target.value)} className="form-select mt-1 w-full">
                                <option value="">選択してください</option>
                                {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="projectDepartment" className="block text-sm font-medium text-gray-700">部門</label>
                            <input type="text" id="projectDepartment" value={department} onChange={e => setDepartment(e.target.value)} className="form-input mt-1 w-full"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="projectProgress" className="block text-sm font-medium text-gray-700">進捗率 ({hasTodos && projectToEdit ? calculateProgressFromTodos(projectToEdit) : progress}%)</label>
                        <input 
                            type="range" 
                            id="projectProgress" 
                            min="0" max="100" 
                            value={hasTodos && projectToEdit ? calculateProgressFromTodos(projectToEdit) : progress} 
                            onChange={e => setProgress(parseInt(e.target.value))} 
                            disabled={hasTodos && !!projectToEdit} // Disable if project has todos and is being edited
                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer mt-1 ${hasTodos && !!projectToEdit ? 'bg-gray-300' : 'bg-gray-200'}`}
                        />
                         {hasTodos && !!projectToEdit && <p className="text-xs text-gray-500 mt-1">進捗率はTodoの完了状況から自動計算されます。</p>}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t flex justify-end space-x-2">
                    <button onClick={onClose} className="button-secondary text-sm">キャンセル</button>
                    <button onClick={handleSubmit} className="button-primary text-sm">{projectToEdit ? '更新' : '作成'}</button>
                </div>
            </div>
        </div>
    );
};

// --- Main/Sub Todo Modals ---
interface TodoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string, dueDate?: string, assignee?: string) => void;
    todoToEdit?: { content: string; dueDate?: string; assignee?: string; };
    modalType: 'main' | 'sub';
    allStaff?: StaffMember[]; // Optional, only for main todos
}

const TodoModal: React.FC<TodoModalProps> = ({ isOpen, onClose, onSave, todoToEdit, modalType, allStaff }) => {
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState(''); // Only for main todos
    const [assignee, setAssignee] = useState(''); // Only for main todos
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setContent(todoToEdit?.content || '');
            if (modalType === 'main') {
                setDueDate(todoToEdit?.dueDate || formatDateForDisplay(addDays(new Date(), 7).toISOString(), 'yyyy-MM-dd'));
                setAssignee(todoToEdit?.assignee || '');
            }
            setError(null);
        }
    }, [isOpen, todoToEdit, modalType]);

    const handleSubmit = () => {
        if (!content.trim()) { setError('内容は必須です。'); return; }
        if (modalType === 'main' && !dueDate) { setError('期日は必須です。'); return; }
        onSave(content, modalType === 'main' ? dueDate : undefined, modalType === 'main' ? assignee : undefined);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">{todoToEdit ? 'Todo編集' : `新規${modalType === 'main' ? 'メイン' : 'サブ'}Todo追加`}</h3>
                </div>
                <div className="p-6 space-y-3">
                    <div>
                        <label htmlFor="todoContent" className="block text-sm font-medium">内容*</label>
                        <textarea id="todoContent" value={content} onChange={e => setContent(e.target.value)} rows={modalType === 'main' ? 2:1} className="form-textarea mt-1 w-full"/>
                    </div>
                    {modalType === 'main' && (
                        <>
                            <div>
                                <label htmlFor="todoDueDate" className="block text-sm font-medium">期日*</label>
                                <input type="date" id="todoDueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input mt-1 w-full"/>
                            </div>
                            <div>
                                <label htmlFor="todoAssignee" className="block text-sm font-medium">担当者</label>
                                <select id="todoAssignee" value={assignee} onChange={e => setAssignee(e.target.value)} className="form-select mt-1 w-full">
                                    <option value="">未割り当て</option>
                                    {allStaff?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t flex justify-end space-x-2">
                    <button onClick={onClose} className="button-secondary text-sm">キャンセル</button>
                    <button onClick={handleSubmit} className="button-primary text-sm">{todoToEdit ? '更新' : '追加'}</button>
                </div>
            </div>
        </div>
    );
};


// --- Projects Page ---
const ProjectsPage: React.FC<ProjectsPageProps> = ({
    allProjects, allStaff, onSaveProject, onDeleteProject,
    onSaveMainTodo, onDeleteMainTodo, onToggleMainTodoComplete,
    onSaveSubTodo, onDeleteSubTodo, onToggleSubTodoComplete
}) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    
    const [showMainTodoModal, setShowMainTodoModal] = useState(false);
    const [mainTodoToEdit, setMainTodoToEdit] = useState<MainTodo | null>(null);
    const [showSubTodoModal, setShowSubTodoModal] = useState(false);
    const [subTodoToEdit, setSubTodoToEdit] = useState<SubTodo | null>(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'project' | 'mainTodo' | 'subTodo' } | null>(null);

    const selectedProject = useMemo(() => {
        return allProjects.find(p => p.id === selectedProjectId) || null;
    }, [selectedProjectId, allProjects]);

    const recentlyCompletedTodos = useMemo(() => {
        const oneWeekAgo = subDays(new Date(), 7);
        return allProjects.flatMap(p => 
            p.mainTodos.filter(mt => 
                mt.completed && mt.completedDate && parseISO(mt.completedDate) >= oneWeekAgo
            ).map(mt => ({ ...mt, projectName: p.name }))
        ).sort((a,b) => parseISO(b.completedDate!).getTime() - parseISO(a.completedDate!).getTime());
    }, [allProjects]);

    const handleOpenProjectModal = (project?: Project) => {
        setProjectToEdit(project || null);
        setShowProjectModal(true);
    };
    
    const handleDeleteRequest = (id: string, name: string, type: 'project' | 'mainTodo' | 'subTodo') => {
        setItemToDelete({ id, name, type });
        setShowConfirmDeleteModal(true);
    };

    const confirmDeletion = () => {
        if (!itemToDelete || !selectedProject && (itemToDelete.type === 'mainTodo' || itemToDelete.type === 'subTodo')) return;
        
        switch (itemToDelete.type) {
            case 'project': onDeleteProject(itemToDelete.id); if (selectedProjectId === itemToDelete.id) setSelectedProjectId(null); break;
            case 'mainTodo': onDeleteMainTodo(selectedProject!.id, itemToDelete.id); break;
            case 'subTodo': onDeleteSubTodo(selectedProject!.id, itemToDelete.id); break;
        }
        setShowConfirmDeleteModal(false);
        setItemToDelete(null);
    };

    const handleOpenMainTodoModal = (todo?: MainTodo) => {
        setMainTodoToEdit(todo || null);
        setShowMainTodoModal(true);
    };
    const handleSaveMainTodoWrapper = (content: string, dueDate?: string, assignee?: string) => {
        if (!selectedProject || !dueDate) return; // dueDate is mandatory for main todos
        const todo: MainTodo = {
            id: mainTodoToEdit?.id || Date.now().toString(),
            projectId: selectedProject.id,
            content, dueDate, assignee: assignee || '',
            completed: mainTodoToEdit?.completed || false,
            completedDate: mainTodoToEdit?.completedDate
        };
        onSaveMainTodo(selectedProject.id, todo);
    };

    const handleOpenSubTodoModal = (todo?: SubTodo) => {
        setSubTodoToEdit(todo || null);
        setShowSubTodoModal(true);
    };
    const handleSaveSubTodoWrapper = (content: string) => {
        if (!selectedProject) return;
        const todo: SubTodo = {
            id: subTodoToEdit?.id || Date.now().toString(),
            projectId: selectedProject.id,
            content,
            completed: subTodoToEdit?.completed || false,
        };
        onSaveSubTodo(selectedProject.id, todo);
    };
    
    const getProjectDisplayProgress = (project: Project): number => {
        const totalTodos = project.mainTodos.length + project.subTodos.length;
        if (totalTodos > 0) {
            return calculateProgressFromTodos(project);
        }
        return project.progress; // Return manually set progress if no todos
    };

    const getProjectCardBg = (project: Project): string => {
        if (getProjectDisplayProgress(project) === 100) return COMPLETED_PROJECT_BG;
        if (project.priority === 'high') return HIGH_PRIORITY_PROJECT_BG;
        if (isDateWithinTwoWeeks(project.deadline)) return URGENT_PROJECT_BG;
        return DEFAULT_PROJECT_BG;
    };
    
    const getAssigneeName = (staffId: string) => allStaff.find(s => s.id === staffId)?.name || '未割り当て';
    

    const handleRightPanelBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedProject && e.target === e.currentTarget) {
            setSelectedProjectId(null);
        }
    };

    return (
        <div className="h-screen flex flex-col p-4 md:p-6 bg-gray-100">
            <PageTitle title="ダッシュボード > プロジェクト管理" />
            <div className="flex-1 flex gap-6 overflow-hidden mt-4">
                {/* Left Panel: Project List */}
                <div className="w-1/3 min-w-[300px] flex flex-col bg-white rounded-lg shadow p-4 overflow-y-auto custom-scrollbar">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">プロジェクト一覧</h2>
                    {allProjects.length === 0 && <p className="text-sm text-gray-500">プロジェクトはありません。</p>}
                    <div className="space-y-2">
                        {allProjects.sort((a,b) => differenceInDays(parseISO(a.deadline), parseISO(b.deadline))).map(project => {
                            const displayProgress = getProjectDisplayProgress(project);
                            const cardBg = getProjectCardBg(project);
                            const textColorClass = cardBg === COMPLETED_PROJECT_BG ? 'text-green-800' : 'text-gray-800'; // Adjust text color for completed projects if needed by COMPLETED_PROJECT_BG

                            return (
                            <div key={project.id}
                                 className={`p-3 border rounded-md cursor-pointer transition-all ${cardBg} ${selectedProjectId === project.id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'}`}
                                 onClick={() => setSelectedProjectId(project.id)}>
                                <h3 className={`font-semibold ${textColorClass} truncate`} title={project.name}>{project.name}</h3>
                                <p className={`text-xs ${cardBg === COMPLETED_PROJECT_BG ? 'text-green-700' : 'text-gray-500'}`}>期日: {formatDateForDisplay(project.deadline)}</p>
                                <div className="mt-1.5">
                                    <div className={`flex justify-between text-xs ${cardBg === COMPLETED_PROJECT_BG ? 'text-green-700' : 'text-gray-600'} mb-0.5`}>
                                        <span>進捗</span>
                                        <span>{displayProgress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className={`${displayProgress === 100 ? 'bg-green-500' : 'bg-blue-500'} h-2.5 rounded-full`} style={{ width: `${displayProgress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </div>

                {/* Right Panel: Details or Default */}
                <div 
                    className="flex-1 flex flex-col bg-white rounded-lg shadow p-4 overflow-y-auto custom-scrollbar"
                    onClick={handleRightPanelBackgroundClick}
                >
                    {!selectedProject ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <button onClick={() => handleOpenProjectModal()} className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow hover:bg-blue-700 transition mb-10">
                                新規プロジェクト +
                            </button>
                            <div className="w-full max-w-md">
                                <h3 className="text-md font-semibold text-gray-700 mb-2">1週間以内に完了したTodo</h3>
                                {recentlyCompletedTodos.length > 0 ? (
                                    <ul className="space-y-1.5 text-sm">
                                        {recentlyCompletedTodos.slice(0, 8).map(todo => (
                                            <li key={todo.id} className="p-2 bg-green-50 border border-green-200 rounded-md">
                                                <span className="text-green-700 font-medium truncate block" title={todo.content}>{todo.content}</span>
                                                <span className="text-xs text-gray-500">プロジェクト: {todo.projectName} - 完了日: {formatDateForDisplay(todo.completedDate)}</span>
                                            </li>
                                        ))}
                                        {recentlyCompletedTodos.length > 8 && <li className="text-xs text-gray-500 text-center">他 {recentlyCompletedTodos.length-8}件</li>}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-500">最近完了したTodoはありません。</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6"> {/* This div contains the actual content, clicks on its children won't trigger the parent's onClick due to e.target !== e.currentTarget */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{selectedProject.name}</h2>
                                    <p className="text-sm text-gray-500">期日: {formatDateForDisplay(selectedProject.deadline)} - 優先度: {PRIORITY_MAP[selectedProject.priority]}</p>
                                </div>
                                <div>
                                    <button onClick={() => handleOpenProjectModal(selectedProject)} className="text-xs button-secondary py-1 px-2.5 mr-2">編集</button>
                                    <button onClick={() => handleDeleteRequest(selectedProject.id, selectedProject.name, 'project')} className="text-xs bg-red-500 text-white hover:bg-red-600 py-1 px-2.5 rounded">削除</button>
                                </div>
                            </div>

                            {/* Main Todos */}
                            <section>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-gray-700">メインTodo</h3>
                                    <button onClick={() => handleOpenMainTodoModal()} className="text-xs button-primary py-1 px-2.5">メインTodo追加</button>
                                </div>
                                {selectedProject.mainTodos.length === 0 && <p className="text-xs text-gray-500">メインTodoはありません。</p>}
                                <div className="space-y-2 text-sm">
                                    {selectedProject.mainTodos.sort((a,b) => differenceInDays(parseISO(a.dueDate), parseISO(b.dueDate))).map(todo => (
                                        <div key={todo.id} className={`p-2.5 border rounded-md flex items-start gap-2 ${todo.completed ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                                            <input type="checkbox" checked={todo.completed} onChange={() => onToggleMainTodoComplete(selectedProject.id, todo.id)} className="form-checkbox mt-1"/>
                                            <div className="flex-1">
                                                <span className={`block ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{todo.content}</span>
                                                <div className="text-xs text-gray-500">
                                                    期日: {formatDateForDisplay(todo.dueDate)} | 担当: {getAssigneeName(todo.assignee)}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 space-x-1">
                                                <button onClick={() => handleOpenMainTodoModal(todo)} className="text-xs text-blue-600 hover:text-blue-800">編集</button>
                                                <button onClick={() => handleDeleteRequest(todo.id, todo.content, 'mainTodo')} className="text-xs text-red-500 hover:text-red-700">削除</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Sub Todos */}
                            <section>
                                 <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-gray-700">サブTodo</h3>
                                    <button onClick={() => handleOpenSubTodoModal()} className="text-xs button-primary py-1 px-2.5">サブTodo追加</button>
                                </div>
                                {selectedProject.subTodos.length === 0 && <p className="text-xs text-gray-500">サブTodoはありません。</p>}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                     {selectedProject.subTodos.map(todo => (
                                        <div key={todo.id} className={`p-2 border rounded-md flex items-center gap-2 ${todo.completed ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                                            <input type="checkbox" checked={todo.completed} onChange={() => onToggleSubTodoComplete(selectedProject.id, todo.id)} className="form-checkbox"/>
                                            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{todo.content}</span>
                                            <div className="flex-shrink-0 space-x-1">
                                                <button onClick={() => handleOpenSubTodoModal(todo)} className="text-xs text-blue-600 hover:text-blue-800">編集</button>
                                                <button onClick={() => handleDeleteRequest(todo.id, todo.content, 'subTodo')} className="text-xs text-red-500 hover:text-red-700">削除</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            <ProjectModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} onSave={onSaveProject} projectToEdit={projectToEdit} allStaff={allStaff} />
            <TodoModal isOpen={showMainTodoModal} onClose={() => setShowMainTodoModal(false)} onSave={handleSaveMainTodoWrapper} todoToEdit={mainTodoToEdit ? { content: mainTodoToEdit.content, dueDate: mainTodoToEdit.dueDate, assignee: mainTodoToEdit.assignee } : undefined} modalType="main" allStaff={allStaff} />
            <TodoModal isOpen={showSubTodoModal} onClose={() => setShowSubTodoModal(false)} onSave={handleSaveSubTodoWrapper} todoToEdit={subTodoToEdit ? { content: subTodoToEdit.content } : undefined} modalType="sub" />
            <ConfirmDeleteModal 
                isOpen={showConfirmDeleteModal}
                onClose={() => setShowConfirmDeleteModal(false)}
                onConfirm={confirmDeletion}
                itemName={itemToDelete?.name}
                message={`「${itemToDelete?.name}」を本当に削除しますか？${itemToDelete?.type === 'project' ? '関連するTodoも全て削除されます。' : ''}`}
            />
        </div>
    );
};

export default ProjectsPage;