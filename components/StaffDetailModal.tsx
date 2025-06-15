
import React from 'react';
import { StaffDetailModalProps, CalendarEvent, MainTodo, Project } from '../types';
import { GenericUserIcon, CloseIcon } from './icons';
import { formatDateForDisplay } from '../utils';
import { parseISO } from 'date-fns/parseISO';
import { format as formatDateFns } from 'date-fns/format';
import { ja } from 'date-fns/locale/ja';

const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
    isOpen, onClose, staffMember, projectsLed, assignedMainTodos, assignedCalendarEvents,
    onUnassignProjectLeader, onUnassignMainTodoAssignee
}) => {
    if (!isOpen || !staffMember) return null;

    const formatEventTime = (isoString: string, allDay: boolean): string => {
        try {
            const dateObj = parseISO(isoString);
            if (!dateObj || !isValid(dateObj)) return '無効な日付'; // Check for isValid
            if (allDay) return formatDateFns(dateObj, 'yyyy/MM/dd', { locale: ja });
            return formatDateFns(dateObj, 'yyyy/MM/dd HH:mm', { locale: ja });
        } catch(e) {
            console.error("Error formatting event time:", e, isoString);
            return 'エラー';
        }
    };
    
    // Function to check if a date string is valid before parsing
    const isValidDateString = (dateString: string | undefined): boolean => {
        if (!dateString) return false;
        const date = parseISO(dateString);
        return isValid(date);
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

                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    {staffMember.specialty && (
                        <section>
                            <h4 className="text-md font-semibold text-gray-700 mb-1">専門・得意なこと</h4>
                            <p className="text-sm text-gray-600">{staffMember.specialty}</p>
                        </section>
                    )}

                    <section>
                        <h4 className="text-md font-semibold text-gray-700 mb-2">担当プロジェクト (リーダー)</h4>
                        {projectsLed.length > 0 ? (
                            <ul className="space-y-1.5 text-sm max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {projectsLed.map(p => (
                                    <li key={`leader-${p.id}`} className="flex justify-between items-center p-2 bg-gray-50 border rounded-md">
                                        <div>
                                            <span className="font-medium text-gray-800">{p.name}</span>
                                            {isValidDateString(p.deadline) && 
                                                <span className="text-xs text-gray-500 ml-2">(期日: {formatDateForDisplay(p.deadline)})</span>
                                            }
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
                            <ul className="space-y-1.5 text-sm max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {assignedMainTodos.map(t => (
                                    <li key={`todo-${t.id}`} className="flex justify-between items-center p-2 bg-gray-50 border rounded-md">
                                        <div>
                                            <span className="font-medium text-gray-800">{t.content}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                (プロジェクト: {t.projectName} 
                                                {isValidDateString(t.dueDate) && ` | 期日: ${formatDateForDisplay(t.dueDate)}`}
                                                )
                                            </span>
                                        </div>
                                        <button onClick={() => onUnassignMainTodoAssignee(t.projectId, t.id)} className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-100" title="担当解除">担当解除</button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">担当メインTodoはありません。</p>}
                    </section>
                    
                    <section>
                        <h4 className="text-md font-semibold text-gray-700 mb-2">関連カレンダー予定</h4>
                        {assignedCalendarEvents.length > 0 ? (
                            <ul className="space-y-1.5 text-sm max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {assignedCalendarEvents.map(event => (
                                    <li key={event.id} className="p-2 bg-gray-50 border rounded-md">
                                        <span className="font-medium text-gray-800">{event.title}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({formatEventTime(event.start, event.allDay)} - {formatEventTime(event.end, event.allDay)})
                                        </span>
                                        {event.memo && <p className="text-xxs text-gray-500 mt-0.5 whitespace-pre-wrap">メモ: {event.memo}</p>}
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

export default StaffDetailModal;

// Helper to check date validity, as parseISO might not throw for all invalid strings but return Invalid Date
function isValid(date: Date) {
  return date instanceof Date && !isNaN(date.getTime());
}
