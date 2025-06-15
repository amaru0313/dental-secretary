import React, { useState, useEffect, useMemo } from 'react';
import { DailySaleEntry, Patient, StaffMember, MasterItem, GeneralSaleEntryModalProps } from '../types';
import { getCurrentDateYYYYMMDD, formatMinutesToHoursAndMinutes } from '../utils';
import { MANUALLY_ENTER_ID } from '../constants';
import { CloseIcon } from './icons';

const GeneralSaleEntryModal: React.FC<GeneralSaleEntryModalProps> = ({ 
    isOpen, onClose, onSave, category, patients, staffMembers, masterItems, editingEntry 
}) => {
    const getInitialFormState = (): Omit<DailySaleEntry, 'id' | 'patientNameDisplay' | 'staffNameDisplay'> => ({
        date: getCurrentDateYYYYMMDD(),
        patientId: '',
        treatmentItem: masterItems.length > 0 ? masterItems[0].id : MANUALLY_ENTER_ID, // Default to first master item or manual
        amount: 0,
        memo: '',
        staffId: '',
        treatmentTimeMinutes: undefined,
        treatmentItems: [],
    });

    const [formData, setFormData] = useState(getInitialFormState());
    const [manualItemName, setManualItemName] = useState(''); // Only if treatmentItem is MANUALLY_ENTER_ID
    const [formError, setFormError] = useState<string | null>(null);
    const [treatmentHours, setTreatmentHours] = useState<string>('');
    const [treatmentMinutes, setTreatmentMinutes] = useState<string>('');
    
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    // State for multi-item selection
    const [selectedTreatmentItems, setSelectedTreatmentItems] = useState<{ id: string; quantity: number }[]>([]);
    const [itemSelectorId, setItemSelectorId] = useState<string>(masterItems.length > 0 ? masterItems[0].id : '');
    const [itemSelectorQuantity, setItemSelectorQuantity] = useState<number>(1);

    useEffect(() => {
        if (isOpen) {
            if (editingEntry) {
                let hours = ''; 
                let minutes = '';
                if (editingEntry.treatmentTimeMinutes) {
                    hours = Math.floor(editingEntry.treatmentTimeMinutes / 60).toString();
                    minutes = (editingEntry.treatmentTimeMinutes % 60).toString();
                }

                if (editingEntry.treatmentItems && editingEntry.treatmentItems.length > 0) {
                    setSelectedTreatmentItems(editingEntry.treatmentItems);
                     const totalAmountFromItems = editingEntry.treatmentItems.reduce((sum, item) => {
                        const master = masterItems.find(mi => mi.id === item.id);
                        return sum + (master ? master.unitPrice * item.quantity : 0);
                    }, 0);
                    setFormData({ ...editingEntry, amount: totalAmountFromItems });

                } else { // Handle old single-item structure
                    const isMaster = masterItems.some(mi => mi.id === editingEntry.treatmentItem);
                    setFormData({
                        ...editingEntry,
                        treatmentItem: isMaster ? editingEntry.treatmentItem : MANUALLY_ENTER_ID,
                    });
                    if (!isMaster) setManualItemName(editingEntry.treatmentItem);
                    setSelectedTreatmentItems([]); // Clear multi-item selection for old data
                }
                setPatientSearch(patients.find(p => p.id === editingEntry.patientId)?.name || editingEntry.patientId || '');
                setTreatmentHours(hours);
                setTreatmentMinutes(minutes);

            } else { // New entry
                setFormData(getInitialFormState());
                setSelectedTreatmentItems([]);
                setManualItemName('');
                setPatientSearch('');
                setTreatmentHours('');
                setTreatmentMinutes('');
                setItemSelectorId(masterItems.length > 0 ? masterItems[0].id : '');
                setItemSelectorQuantity(1);
            }
            setFormError(null);
        }
    }, [editingEntry, isOpen, category, masterItems, patients]);
    

    const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatientSearch(e.target.value);
        setFormData(prev => ({ ...prev, patientId: '' }));
        setShowPatientDropdown(true);
    };

    const handlePatientSelect = (patient: Patient) => {
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        setPatientSearch(patient.name);
        setShowPatientDropdown(false);
    };

    const filteredPatients = useMemo(() => {
        if (!patientSearch && category === 'products') return patients.slice(0,10); // show some for products even if empty
        if (!patientSearch) return [];
        return patients.filter(p =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(patientSearch.toLowerCase())
        ).slice(0, 10);
    }, [patientSearch, patients, category]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'treatmentHours') setTreatmentHours(value);
        else if (name === 'treatmentMinutes') setTreatmentMinutes(value);
        else if (name === 'treatmentItem') { // This is for the single-item selector, now primarily for manual entry
            setFormData(prev => ({ ...prev, [name]: value, amount: value === MANUALLY_ENTER_ID ? prev.amount : (masterItems.find(mi => mi.id === value)?.unitPrice || 0) }));
            if (value !== MANUALLY_ENTER_ID) setManualItemName('');
             if (value !== MANUALLY_ENTER_ID && selectedTreatmentItems.length === 0) { // If using single selector and no multi-items
                const master = masterItems.find(mi => mi.id === value);
                if (master) {
                    setSelectedTreatmentItems([{id: master.id, quantity: 1}]);
                    setFormData(prev => ({ ...prev, amount: master.unitPrice}));
                }
            } else if (value === MANUALLY_ENTER_ID) {
                 setSelectedTreatmentItems([]); // Clear multi-items if switching to manual single
                 setFormData(prev => ({ ...prev, amount: 0 })); // Reset amount for manual single
            }

        } else if (name === 'amount' && formData.treatmentItem === MANUALLY_ENTER_ID) { // Only allow manual amount if item is manual
             setFormData(prev => ({ ...prev, amount: parseFloat(value) || 0 }));
        } else if (name !== 'amount') { // Prevent direct editing of amount if not manual single item
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // --- Multi-item selection logic ---
    useEffect(() => { // Recalculate total amount when selectedTreatmentItems changes
        const newTotalAmount = selectedTreatmentItems.reduce((sum, item) => {
            const master = masterItems.find(mi => mi.id === item.id);
            return sum + (master ? master.unitPrice * item.quantity : 0);
        }, 0);
        setFormData(prev => ({ ...prev, amount: newTotalAmount }));
    }, [selectedTreatmentItems, masterItems]);

    const handleAddTreatmentItem = () => {
        if (!itemSelectorId || itemSelectorQuantity < 1) return;
        const master = masterItems.find(mi => mi.id === itemSelectorId);
        if (!master) return;

        setSelectedTreatmentItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.id === itemSelectorId);
            if (existingItemIndex > -1) {
                return prevItems.map((item, index) => 
                    index === existingItemIndex ? { ...item, quantity: item.quantity + itemSelectorQuantity } : item
                );
            } else {
                return [...prevItems, { id: itemSelectorId, quantity: itemSelectorQuantity }];
            }
        });
        // Reset selectors
        // setItemSelectorId(masterItems.length > 0 ? masterItems[0].id : '');
        // setItemSelectorQuantity(1);
    };

    const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) { // Remove item if quantity is less than 1
            handleRemoveTreatmentItem(itemId);
            return;
        }
        setSelectedTreatmentItems(prevItems => 
            prevItems.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
        );
    };
    
    const handleRemoveTreatmentItem = (itemId: string) => {
        setSelectedTreatmentItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };
    // --- End multi-item selection logic ---


    const handleSave = () => {
        if (category === 'private' && !formData.patientId) { setFormError('患者を選択してください。'); return; }
        // For product sales, patientId can be optional. Add specific clinic logic if needed.

        const isManualSingleItem = formData.treatmentItem === MANUALLY_ENTER_ID;

        if (selectedTreatmentItems.length === 0 && !isManualSingleItem) {
            setFormError(`${category === 'private' ? '診療科目' : '商品'}を1つ以上選択または手入力してください。`); return;
        }
        if (isManualSingleItem && !manualItemName.trim()) {
            setFormError('手入力の場合は項目名を入力してください。'); return;
        }
        if (formData.amount <= 0 && (selectedTreatmentItems.length > 0 || isManualSingleItem)) { // Amount must be positive if items are selected or manually entered
            setFormError('金額は0より大きい値を入力してください。'); return;
        }
        // Staff is optional for products, mandatory for private
        if (category === 'private' && !formData.staffId) { setFormError('担当名を選択してください。'); return; }


        const hoursNum = parseInt(treatmentHours) || 0;
        const minutesNum = parseInt(treatmentMinutes) || 0;
        if (hoursNum < 0 || minutesNum < 0 || minutesNum >= 60) {
            setFormError('診療時間の入力が正しくありません。(時間: 0以上, 分: 0-59)'); return;
        }

        const totalTreatmentMinutes = (hoursNum * 60) + minutesNum;
        const patientNameDisplayValue = patients.find(p => p.id === formData.patientId)?.name || (formData.patientId ? '患者ID: ' + formData.patientId : (category === 'products' ? '店頭販売など' : '不明な患者'));
        const staffNameDisplayValue = staffMembers.find(s => s.id === formData.staffId)?.name || undefined;

        const entryToSave: DailySaleEntry = {
            ...formData,
            id: editingEntry?.id || Date.now().toString() + Math.random().toString(),
            patientNameDisplay: patientNameDisplayValue,
            staffNameDisplay: staffNameDisplayValue,
            treatmentTimeMinutes: totalTreatmentMinutes,
            treatmentItems: selectedTreatmentItems.length > 0 ? selectedTreatmentItems : undefined,
            // For single manual entry, treatmentItem is MANUALLY_ENTER_ID, actual name is in manualItemName
            // For backward compatibility or display, if treatmentItems are used, treatmentItem could be a summary.
            treatmentItem: isManualSingleItem ? manualItemName : (selectedTreatmentItems[0]?.id || formData.treatmentItem)
        };
        
        onSave(entryToSave, category);
    };

    if (!isOpen) return null;
    const itemLabel = category === 'private' ? '診療科目' : '商品';

    if (masterItems.length === 0 && category === 'private') { // Allow product sales without master items (manual entry)
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md text-center transform transition-all">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">{itemLabel} 新規入力</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                    <p className="text-gray-700">マスター項目が未登録です。<br/>「マスター設定」から{itemLabel}を追加してください。</p>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={onClose}>閉じる</button>
                </div>
            </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">{editingEntry ? `${itemLabel} 記録編集` : `${itemLabel} 新規入力`}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Date Input */}
                    <div>
                        <label htmlFor="entryDateGeneral" className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                        <input type="date" id="entryDateGeneral" name="date" value={formData.date} onChange={handleInputChange} className="form-input w-full"/>
                    </div>
                    
                    {/* Patient Selector (optional for products) */}
                     <div className="relative">
                        <label htmlFor="patientSearchGeneral" className="block text-sm font-medium text-gray-700 mb-1">患者 {category === 'private' ? '*' : '(任意)'}</label>
                        <input 
                            type="text" id="patientSearchGeneral" placeholder="IDまたは氏名で検索..."
                            value={patientSearch} onChange={handlePatientSearchChange}
                            onFocus={() => setShowPatientDropdown(true)}
                            // onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)}
                            className="form-input w-full"
                        />
                        {formData.patientId && patients.find(p=>p.id === formData.patientId) && <p className="text-xs text-blue-600 mt-1">選択中: {patients.find(p=>p.id === formData.patientId)?.name} (ID: {formData.patientId})</p>}
                        {showPatientDropdown && filteredPatients.length > 0 && (
                            <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {filteredPatients.map(p => (
                                    <li key={p.id} className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer"
                                        onMouseDown={() => handlePatientSelect(p)}>
                                        {p.name} (ID: {p.id})
                                    </li>
                                ))}
                            </ul>
                        )}
                         {showPatientDropdown && filteredPatients.length === 0 && patientSearch && (
                            <p className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 px-3 py-2 text-sm text-gray-500">一致する患者が見つかりません。</p>
                        )}
                    </div>

                    {/* Multi-Item Selector */}
                    <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700">提供{itemLabel}</h4>
                        <div className="flex items-end space-x-2">
                            <div className="flex-1">
                                <label htmlFor="itemSelectorId" className="block text-xs font-medium text-gray-600">マスター{itemLabel}選択</label>
                                <select id="itemSelectorId" value={itemSelectorId} onChange={(e) => setItemSelectorId(e.target.value)} className="form-select w-full mt-1 text-sm">
                                    <option value="">-- {itemLabel}を選択 --</option>
                                    {masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name} (¥{mi.unitPrice.toLocaleString()})</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="itemSelectorQuantity" className="block text-xs font-medium text-gray-600">数量</label>
                                <input type="number" id="itemSelectorQuantity" value={itemSelectorQuantity} onChange={(e) => setItemSelectorQuantity(parseInt(e.target.value) || 1)} min="1" className="form-input w-20 mt-1 text-sm"/>
                            </div>
                            <button type="button" onClick={handleAddTreatmentItem} className="px-3 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 rounded-md self-end">追加</button>
                        </div>
                        {selectedTreatmentItems.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {selectedTreatmentItems.map(item => {
                                    const master = masterItems.find(mi => mi.id === item.id);
                                    return (
                                        <div key={item.id} className="flex justify-between items-center p-1.5 bg-white border rounded text-xs">
                                            <span>{master?.name || '不明な項目'}</span>
                                            <div className="flex items-center space-x-1">
                                                <span>単価: ¥{(master?.unitPrice || 0).toLocaleString()}</span>
                                                <span>x</span>
                                                <input type="number" value={item.quantity} onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)} min="1" className="form-input w-12 h-6 text-xs p-1"/>
                                                <span>= ¥{((master?.unitPrice || 0) * item.quantity).toLocaleString()}</span>
                                                <button type="button" onClick={() => handleRemoveTreatmentItem(item.id)} className="text-red-500 hover:text-red-700 p-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                     {/* Manual single item entry - Keep for flexibility or if no master items */}
                     {masterItems.length === 0 && category === 'products' && ( // Only show if no master items for products
                        <>
                            <p className="text-xs text-gray-500 mt-2">マスター項目がないため、手入力モードです。</p>
                            <input type="hidden" name="treatmentItem" value={MANUALLY_ENTER_ID} />
                            <div>
                                <label htmlFor="manualItemName" className="block text-sm font-medium text-gray-700 mb-1">{itemLabel}名 (手入力) *</label>
                                <input type="text" id="manualItemName" name="manualItemName" value={manualItemName} onChange={(e) => setManualItemName(e.target.value)} className="form-input w-full"/>
                            </div>
                        </>
                    )}
                     {/* Total Amount (auto-calculated from selected items) */}
                    <div>
                        <label htmlFor="amountGeneral" className="block text-sm font-medium text-gray-700 mb-1">合計金額 (円) *</label>
                        <input type="number" id="amountGeneral" name="amount" value={formData.amount} 
                               onChange={handleInputChange} 
                               readOnly={selectedTreatmentItems.length > 0} // ReadOnly if multi-items are used
                               className={`form-input w-full ${selectedTreatmentItems.length > 0 ? 'bg-gray-100' : ''}`}/>
                    </div>

                    {/* Staff, Time, Memo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">診療時間 {category === 'products' ? '(任意)' : ''}</label>
                        <div className="flex items-center space-x-2">
                            <input type="number" name="treatmentHours" value={treatmentHours} onChange={handleInputChange} min="0" placeholder="時間" className="form-input w-20"/> <span className="text-sm text-gray-600">時間</span>
                            <input type="number" name="treatmentMinutes" value={treatmentMinutes} onChange={handleInputChange} min="0" max="59" placeholder="分" className="form-input w-20"/> <span className="text-sm text-gray-600">分</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="staffIdGeneral" className="block text-sm font-medium text-gray-700 mb-1">担当名 {category === 'private' ? '*' : '(任意)'}</label>
                        <select id="staffIdGeneral" name="staffId" value={formData.staffId} onChange={handleInputChange} className="form-select w-full">
                            <option value="">{category === 'products' && !formData.staffId ? '担当なし' : '選択してください'}</option>
                            {staffMembers.sort((a,b)=>a.name.localeCompare(b.name,'ja')).map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="memoGeneral" className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                        <textarea id="memoGeneral" name="memo" value={formData.memo} onChange={handleInputChange} rows={2} className="form-textarea w-full"></textarea>
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

export default GeneralSaleEntryModal;