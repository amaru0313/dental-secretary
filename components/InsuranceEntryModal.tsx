import React, { useState, useEffect, useMemo } from 'react';
import { DailySaleEntry, Patient, StaffMember, InsuranceEntryModalProps } from '../types';
import { getCurrentDateYYYYMMDD } from '../utils';
import { CloseIcon } from './icons';

const InsuranceEntryModal: React.FC<InsuranceEntryModalProps> = ({ isOpen, onClose, onSave, patients, staffMembers, editingEntry }) => {
    const getInitialFormState = (): Omit<DailySaleEntry, 'id' | 'patientNameDisplay' | 'staffNameDisplay'> => ({
        date: getCurrentDateYYYYMMDD(),
        patientId: '',
        treatmentItem: '', 
        amount: 0,
        memo: '',
        staffId: '',
        insurancePoints: undefined, // Explicitly undefined for placeholder
        treatmentTimeMinutes: undefined,
    });

    const [formData, setFormData] = useState(getInitialFormState());
    const [formError, setFormError] = useState<string | null>(null);
    const [treatmentHours, setTreatmentHours] = useState<string>('');
    const [treatmentMinutes, setTreatmentMinutes] = useState<string>('');
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingEntry) {
                let hours = '';
                let minutes = '';
                if (editingEntry.treatmentTimeMinutes) {
                    hours = Math.floor(editingEntry.treatmentTimeMinutes / 60).toString();
                    minutes = (editingEntry.treatmentTimeMinutes % 60).toString();
                }
                const currentPoints = editingEntry.insurancePoints || 0;
                setFormData({
                    date: editingEntry.date,
                    patientId: editingEntry.patientId,
                    treatmentItem: editingEntry.treatmentItem || `保険診療 ${currentPoints}点`,
                    amount: editingEntry.amount, // Amount should be pre-calculated or passed
                    memo: editingEntry.memo,
                    staffId: editingEntry.staffId || '',
                    insurancePoints: currentPoints,
                    treatmentTimeMinutes: editingEntry.treatmentTimeMinutes || 0,
                });
                setPatientSearch(patients.find(p => p.id === editingEntry.patientId)?.name || editingEntry.patientId);
                setTreatmentHours(hours);
                setTreatmentMinutes(minutes);
            } else {
                setFormData(getInitialFormState());
                setPatientSearch('');
                setTreatmentHours('');
                setTreatmentMinutes('');
            }
            setFormError(null);
        }
    }, [editingEntry, isOpen, patients]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let newFormData = { ...formData };

        if (name === 'treatmentHours') {
            setTreatmentHours(value);
        } else if (name === 'treatmentMinutes') {
            setTreatmentMinutes(value);
        } else if (name === 'insurancePoints') {
            const points = parseFloat(value) || 0;
            newFormData = {
                ...newFormData,
                insurancePoints: points,
                amount: points * 10, // Auto-calculate amount
                treatmentItem: `保険診療 ${points}点`, // Auto-update treatment item
            };
        } else {
            newFormData = { ...newFormData, [name]: value };
        }
        setFormData(newFormData);
    };
    
    const selectedPatient = useMemo(() => {
        return patients.find(p => p.id === formData.patientId);
    }, [formData.patientId, patients]);

    const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatientSearch(e.target.value);
        setFormData(prev => ({ ...prev, patientId: '' })); // Clear patientId if search text changes
        setShowPatientDropdown(true);
    };

    const handlePatientSelect = (patient: Patient) => {
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        setPatientSearch(patient.name); // Show name in input
        setShowPatientDropdown(false);
    };

    const filteredPatients = useMemo(() => {
        if (!patientSearch) return patients.slice(0, 10); // Show some initial if empty
        return patients.filter(p =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(patientSearch.toLowerCase())
        ).slice(0, 10); // Limit results
    }, [patientSearch, patients]);


    const handleSave = () => {
        if (!formData.patientId) { setFormError('患者を選択してください。'); return; }
        if (formData.insurancePoints === undefined || formData.insurancePoints <= 0) {
             setFormError('保険点数は0より大きい値を入力してください。'); return;
        }
        if (!formData.staffId) { setFormError('担当名を選択してください。'); return; }

        const hoursNum = parseInt(treatmentHours) || 0;
        const minutesNum = parseInt(treatmentMinutes) || 0;
        if (hoursNum < 0 || minutesNum < 0 || minutesNum >= 60) {
            setFormError('診療時間の入力が正しくありません。(時間: 0以上, 分: 0-59)'); return;
        }
        const totalTreatmentMinutes = (hoursNum * 60) + minutesNum;
        const patientNameDisplayValue = selectedPatient ? selectedPatient.name : '不明な患者';
        const staffNameDisplayValue = staffMembers.find(s => s.id === formData.staffId)?.name || undefined;
        
        const entryToSave: DailySaleEntry = {
            ...formData,
            id: editingEntry?.id || Date.now().toString() + Math.random().toString(), 
            patientNameDisplay: patientNameDisplayValue,
            staffNameDisplay: staffNameDisplayValue,
            treatmentTimeMinutes: totalTreatmentMinutes,
            treatmentItem: formData.treatmentItem || `保険診療 ${formData.insurancePoints || 0}点`,
        };
        onSave(entryToSave);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col transform transition-all">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">{editingEntry ? '保険診療記録 編集' : '保険診療記録 新規入力'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    <div>
                        <label htmlFor="entryDateInsurance" className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                        <input type="date" id="entryDateInsurance" name="date" value={formData.date} onChange={handleInputChange} className="form-input w-full"/>
                    </div>
                    <div className="relative">
                        <label htmlFor="patientSearchInsurance" className="block text-sm font-medium text-gray-700 mb-1">患者 *</label>
                        <input 
                            type="text" 
                            id="patientSearchInsurance" 
                            placeholder="IDまたは氏名で検索..."
                            value={patientSearch} 
                            onChange={handlePatientSearchChange} 
                            onFocus={() => setShowPatientDropdown(true)}
                            // onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)} // Delay to allow click on dropdown
                            className="form-input w-full"
                        />
                         {formData.patientId && selectedPatient && <p className="text-xs text-blue-600 mt-1">選択中: {selectedPatient.name} (ID: {selectedPatient.id})</p>}
                        {showPatientDropdown && filteredPatients.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {filteredPatients.map(p => (
                                    <li 
                                        key={p.id} 
                                        className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer"
                                        onMouseDown={() => handlePatientSelect(p)} // Use onMouseDown to fire before blur
                                    >
                                        {p.name} (ID: {p.id})
                                    </li>
                                ))}
                            </ul>
                        )}
                         {showPatientDropdown && filteredPatients.length === 0 && patientSearch && (
                            <p className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 px-3 py-2 text-sm text-gray-500">一致する患者が見つかりません。</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="insurancePoints" className="block text-sm font-medium text-gray-700 mb-1">保険点数 *</label>
                        <input type="number" id="insurancePoints" name="insurancePoints" value={formData.insurancePoints === undefined ? '' : formData.insurancePoints} onChange={handleInputChange} min="0" className="form-input w-full" placeholder="例: 150"/>
                    </div>
                    <div>
                        <label htmlFor="amountInsurance" className="block text-sm font-medium text-gray-700 mb-1">金額 (円)</label>
                        <input type="number" id="amountInsurance" name="amount" value={formData.amount || ''} readOnly className="form-input w-full bg-gray-100"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">診療時間</label>
                        <div className="flex items-center space-x-2">
                            <input type="number" name="treatmentHours" value={treatmentHours} onChange={handleInputChange} min="0" placeholder="時間" className="form-input w-20"/> <span className="text-sm text-gray-600">時間</span>
                            <input type="number" name="treatmentMinutes" value={treatmentMinutes} onChange={handleInputChange} min="0" max="59" placeholder="分" className="form-input w-20"/> <span className="text-sm text-gray-600">分</span>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="staffIdInsurance" className="block text-sm font-medium text-gray-700 mb-1">担当名 *</label>
                        <select id="staffIdInsurance" name="staffId" value={formData.staffId} onChange={handleInputChange} className="form-select w-full">
                            <option value="">選択してください</option>
                            {staffMembers.sort((a,b) => a.name.localeCompare(b.name, 'ja')).map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="memoInsurance" className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                        <textarea id="memoInsurance" name="memo" value={formData.memo} onChange={handleInputChange} rows={2} className="form-textarea w-full"></textarea>
                    </div>
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={onClose}>キャンセル</button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md" onClick={handleSave}>{editingEntry ? '更新' : '保存'}</button>
                </div>
            </div>
        </div>
    );
};

export default InsuranceEntryModal;