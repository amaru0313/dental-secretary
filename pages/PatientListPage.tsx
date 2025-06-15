import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Patient, MedicalRecord, PatientFormData, DisplayableRecord, AnnualSalesCategoryKey, PatientListPageProps, AnnualSalesDataStorage } from '../types';
import { PATIENTS_STORAGE_KEY, ANNUAL_SALES_STORAGE_KEY } from '../constants';
import { formatDateForDisplay, getCurrentDateYYYYMMDD, formatMinutesToHoursAndMinutes, loadFromLocalStorage, saveToLocalStorage } from '../utils';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import PageTitle from '../components/PageTitle';

const PatientListPage: React.FC<PatientListPageProps> = ({ onDataChange, allPatients: initialPatients, annualSalesData }) => {
    const [patients, setPatients] = useState<Patient[]>(initialPatients);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [isEditingPatient, setIsEditingPatient] = useState(false);
    const [currentPatientIdEditing, setCurrentPatientIdEditing] = useState<string | null>(null);
    const [patientFormData, setPatientFormData] = useState<PatientFormData>({
        id: '', name: '', lastVisitDate: getCurrentDateYYYYMMDD(), memo: '',
    });
    const [patientFormError, setPatientFormError] = useState<string | null>(null);
    const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
    const [selectedPatientForRecords, setSelectedPatientForRecords] = useState<Patient | null>(null);
    const [displayedMedicalHistory, setDisplayedMedicalHistory] = useState<DisplayableRecord[]>([]);
    const [newRecordDate, setNewRecordDate] = useState<string>(getCurrentDateYYYYMMDD());
    const [newRecordContent, setNewRecordContent] = useState<string>('');
    const [medicalRecordError, setMedicalRecordError] = useState<string | null>(null);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [itemToDeleteDetails, setItemToDeleteDetails] = useState<{ id: string, name: string, type: 'patient' | 'record' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setPatients(initialPatients);
    }, [initialPatients]);

    const savePatientsToLocalStorage = (updatedPatients: Patient[]) => {
        saveToLocalStorage(PATIENTS_STORAGE_KEY, updatedPatients);
        onDataChange(); // Notify App.tsx
    };

    const handlePatientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPatientFormData(prev => ({ ...prev, [name]: value }));
    };

    const validatePatientForm = (): boolean => {
        if (!patientFormData.id.trim()) { setPatientFormError('患者IDは必須です。'); return false; }
        if (!patientFormData.name.trim()) { setPatientFormError('患者名は必須です。'); return false; }
        if (!patientFormData.lastVisitDate.trim()) { setPatientFormError('最終来院日は必須です。'); return false; }
        if (!isEditingPatient || (isEditingPatient && currentPatientIdEditing !== patientFormData.id)) {
            if (patients.some(p => p.id === patientFormData.id)) {
                setPatientFormError('この患者IDは既に使用されています。'); return false;
            }
        }
        setPatientFormError(null);
        return true;
    };

    const handlePatientSubmit = () => {
        if (!validatePatientForm()) return;
        let updatedPatients;
        if (isEditingPatient && currentPatientIdEditing) {
            updatedPatients = patients.map(p =>
                p.id === currentPatientIdEditing ? { ...p, ...patientFormData } : p
            );
        } else {
            const newPatient: Patient = { ...patientFormData, medicalRecords: [] };
            updatedPatients = [...patients, newPatient];
        }
        setPatients(updatedPatients);
        savePatientsToLocalStorage(updatedPatients);
        setShowPatientModal(false);
        resetPatientForm();
    };

    const openNewPatientModal = () => {
        resetPatientForm();
        setIsEditingPatient(false);
        setCurrentPatientIdEditing(null);
        setShowPatientModal(true);
    };

    const openEditPatientModal = (patient: Patient) => {
        setPatientFormData({
            id: patient.id, name: patient.name,
            lastVisitDate: patient.lastVisitDate || getCurrentDateYYYYMMDD(), memo: patient.memo,
        });
        setIsEditingPatient(true);
        setCurrentPatientIdEditing(patient.id);
        setShowPatientModal(true);
        setPatientFormError(null);
    };

    const resetPatientForm = () => {
        setPatientFormData({ id: '', name: '', lastVisitDate: getCurrentDateYYYYMMDD(), memo: '' });
        setPatientFormError(null);
    };
    
    const requestDeletePatient = (patientId: string, patientName: string) => {
        setItemToDeleteDetails({ id: patientId, name: patientName, type: 'patient' });
        setShowConfirmDeleteModal(true);
    };

    const performActualDelete = () => {
        if (!itemToDeleteDetails) return;
        if (itemToDeleteDetails.type === 'patient') {
            const patientIdToDelete = itemToDeleteDetails.id;
            const updatedPatients = patients.filter(p => p.id !== patientIdToDelete);
            setPatients(updatedPatients);
            savePatientsToLocalStorage(updatedPatients);
            if (showPatientModal && currentPatientIdEditing === patientIdToDelete) {
                setShowPatientModal(false); resetPatientForm();
            }
            if (selectedPatientForRecords?.id === patientIdToDelete) {
                 setShowMedicalRecordModal(false); setSelectedPatientForRecords(null);
            }
        }
        setItemToDeleteDetails(null);
    };


    const buildDisplayedHistory = useCallback((patient: Patient | null) => {
        if (!patient) { setDisplayedMedicalHistory([]); return; }
        const combinedRecords: DisplayableRecord[] = [];
        patient.medicalRecords.forEach(record => {
            combinedRecords.push({
                id: `manual-${record.id}`, date: record.date,
                content: `【診療メモ】\n${record.content}`, type: 'manual',
            });
        });

        const allSales: AnnualSalesDataStorage = annualSalesData;
        
        (['insurance', 'private', 'products'] as AnnualSalesCategoryKey[]).forEach(categoryKey => {
            const salesInCategory = allSales[categoryKey] || [];
            salesInCategory.filter(sale => sale.patientId === patient.id).forEach(sale => {
                let content = '';
                const staffInfo = sale.staffNameDisplay ? ` - 担当: ${sale.staffNameDisplay}` : '';
                const memoInfo = sale.memo ? ` (メモ: ${sale.memo})` : '';
                const timeInfo = sale.treatmentTimeMinutes ? ` - 診療時間: ${formatMinutesToHoursAndMinutes(sale.treatmentTimeMinutes)}` : '';
                let itemDescription = sale.treatmentItem; // Fallback or old data
                if (sale.treatmentItems && sale.treatmentItems.length > 0) {
                    // This part needs access to master items to display names instead of IDs
                    // For now, just show IDs if names are not readily available or reconstruct from sale.treatmentItem
                    itemDescription = sale.treatmentItems.map(ti => `ID:${ti.id} (x${ti.quantity})`).join(', ');
                     // If MasterItem names are needed here, allMasterItems would need to be passed down or loaded.
                }


                if (categoryKey === 'insurance') {
                    content = `【保険診療】 ${sale.insurancePoints || 0}点 (¥${sale.amount.toLocaleString()})${staffInfo}${timeInfo}${memoInfo}`;
                } else if (categoryKey === 'private') {
                    content = `【自費治療】 ${itemDescription} (¥${sale.amount.toLocaleString()})${staffInfo}${timeInfo}${memoInfo}`;
                } else { // products
                    content = `【物販】 ${itemDescription} (¥${sale.amount.toLocaleString()})${staffInfo}${timeInfo}${memoInfo}`;
                }
                combinedRecords.push({
                    id: `${categoryKey}-${sale.id}`, date: sale.date, content: content, type: categoryKey,
                });
            });
        });
        combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDisplayedMedicalHistory(combinedRecords);
    }, [annualSalesData]);

    const openMedicalRecordModal = (patient: Patient) => {
        setSelectedPatientForRecords(patient);
        setNewRecordDate(getCurrentDateYYYYMMDD());
        setNewRecordContent('');
        setMedicalRecordError(null);
        buildDisplayedHistory(patient);
        setShowMedicalRecordModal(true);
    };

    const handleAddMedicalRecord = () => {
        if (!selectedPatientForRecords) return;
        if (!newRecordContent.trim()) { setMedicalRecordError('記録内容は必須です。'); return; }
        if (!newRecordDate.trim()) { setMedicalRecordError('日付は必須です。'); return; }

        const newRecord: MedicalRecord = {
            id: Date.now().toString() + Math.random().toString(), date: newRecordDate, content: newRecordContent,
        };
        const updatedPatients = patients.map(p => {
            if (p.id === selectedPatientForRecords.id) {
                const updatedRecords = [...p.medicalRecords, newRecord].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                return { ...p, medicalRecords: updatedRecords };
            }
            return p;
        });
        setPatients(updatedPatients);
        savePatientsToLocalStorage(updatedPatients);
        const updatedPatientForDisplay = updatedPatients.find(p => p.id === selectedPatientForRecords.id);
        if (updatedPatientForDisplay) {
             setSelectedPatientForRecords(updatedPatientForDisplay);
             buildDisplayedHistory(updatedPatientForDisplay);
        }
        setNewRecordContent('');
        setMedicalRecordError(null);
    };
    
    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        return patients.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);


    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <PageTitle title="患者リスト" />
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <input
                    type="text"
                    placeholder="患者IDまたは氏名で検索..."
                    className="form-input w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" 
                    onClick={openNewPatientModal}
                >
                    新規患者登録
                </button>
            </div>

            {patients.length === 0 ? (
                <div className="text-center py-10">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">登録患者なし</h3>
                    <p className="mt-1 text-sm text-gray-500">「新規患者登録」から患者情報を追加してください。</p>
                </div>
            ) : filteredPatients.length === 0 && searchTerm ? (
                 <p className="text-center py-10 text-gray-600">「{searchTerm}」に一致する患者は見つかりませんでした。</p>
            ) : (
                <div className="flex-1 overflow-x-auto">
                <div className="shadow border-b border-gray-200 sm:rounded-lg min-w-full">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最終来院日</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メモ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPatients.sort((a,b) => a.name.localeCompare(b.name, 'ja')).map(patient => (
                                <tr key={patient.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{patient.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateForDisplay(patient.lastVisitDate)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={patient.memo}>{patient.memo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button className="text-indigo-600 hover:text-indigo-900" onClick={() => openEditPatientModal(patient)}>編集</button>
                                        <button className="text-green-600 hover:text-green-900" onClick={() => openMedicalRecordModal(patient)}>診療記録</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </div>
            )}

            {showPatientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">{isEditingPatient ? '患者情報編集' : '新規患者登録'}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">患者ID *</label>
                                <input type="text" id="patientId" name="id" value={patientFormData.id} onChange={handlePatientFormChange}
                                       readOnly={isEditingPatient}
                                       className={`form-input w-full ${isEditingPatient ? 'bg-gray-100' : ''}`} />
                            </div>
                            <div>
                                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">氏名 *</label>
                                <input type="text" id="patientName" name="name" value={patientFormData.name} onChange={handlePatientFormChange} className="form-input w-full" />
                            </div>
                            <div>
                                <label htmlFor="lastVisitDate" className="block text-sm font-medium text-gray-700 mb-1">最終来院日 *</label>
                                <input type="date" id="lastVisitDate" name="lastVisitDate" value={patientFormData.lastVisitDate} onChange={handlePatientFormChange} className="form-input w-full"/>
                            </div>
                            <div>
                                <label htmlFor="patientMemo" className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                                <textarea id="patientMemo" name="memo" value={patientFormData.memo} onChange={handlePatientFormChange} rows={3} className="form-textarea w-full"></textarea>
                            </div>
                            {patientFormError && <p className="text-sm text-red-600">{patientFormError}</p>}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            {isEditingPatient && currentPatientIdEditing && (
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    onClick={() => requestDeletePatient(currentPatientIdEditing, patientFormData.name)}
                                >
                                    削除
                                </button>
                            )}
                            <div className="flex-1"></div> {/* Spacer */}
                            <div className="space-x-3">
                                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={() => { setShowPatientModal(false); resetPatientForm();}}>キャンセル</button>
                                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md" onClick={handlePatientSubmit}>{isEditingPatient ? '更新' : '登録'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMedicalRecordModal && selectedPatientForRecords && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">{selectedPatientForRecords.name} 様 - 診療記録</h3>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="bg-gray-50 p-4 rounded-md space-y-3">
                                <h4 className="text-md font-semibold text-gray-700">新規記録追加 (手入力メモ)</h4>
                                <div>
                                    <label htmlFor="newRecordDate" className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                                    <input type="date" id="newRecordDate" value={newRecordDate} onChange={e => setNewRecordDate(e.target.value)} className="form-input w-full sm:w-auto"/>
                                </div>
                                <div>
                                    <label htmlFor="newRecordContent" className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                                    <textarea id="newRecordContent" value={newRecordContent} onChange={e => setNewRecordContent(e.target.value)} rows={3} className="form-textarea w-full"></textarea>
                                </div>
                                {medicalRecordError && <p className="text-sm text-red-600">{medicalRecordError}</p>}
                                <button className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md" onClick={handleAddMedicalRecord}>記録追加</button>
                            </div>

                            {displayedMedicalHistory.length > 0 ? (
                                <ul className="space-y-3">
                                    {displayedMedicalHistory.map(record => (
                                        <li key={record.id} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-semibold text-blue-600 px-2 py-0.5 bg-blue-100 rounded-full">
                                                    {record.type === 'manual' ? '診療メモ' : 
                                                     record.type === 'insurance' ? '保険診療' : 
                                                     record.type === 'private' ? '自費治療' : '物販'}
                                                </span>
                                                <span className="text-sm font-medium text-gray-700">{formatDateForDisplay(record.date)}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{record.content}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-4">登録されている診療記録はありません。</p>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={() => setShowMedicalRecordModal(false)}>閉じる</button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDeleteModal
                isOpen={showConfirmDeleteModal}
                onClose={() => {setShowConfirmDeleteModal(false); setItemToDeleteDetails(null);}}
                onConfirm={performActualDelete}
                itemName={itemToDeleteDetails?.name}
                message={itemToDeleteDetails?.type === 'patient' ? `患者「${itemToDeleteDetails.name}」を削除しますか？関連する診療記録や売上データは削除されませんが、患者リストからは削除されます。` : `本当に「${itemToDeleteDetails?.name}」を削除しますか？`}

            />
        </div>
    );
};

export default PatientListPage;