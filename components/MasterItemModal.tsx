import React, { useState, useEffect } from 'react';
import { MasterItem, MasterItemFormData, MasterItemModalProps } from '../types';
import { MASTER_ITEMS_STORAGE_KEY } from '../constants';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils';
import { CloseIcon } from './icons';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const MasterItemModal: React.FC<MasterItemModalProps> = ({ isOpen, onClose, category, existingMasterItems, onMasterItemsUpdate }) => {
    const [items, setItems] = useState<MasterItem[]>(existingMasterItems);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState<MasterItem | null>(null);
    const [formData, setFormData] = useState<MasterItemFormData>({ name: '', unitPrice: '', annualTarget: '' });
    const [formError, setFormError] = useState<string | null>(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<MasterItem | null>(null);
    
    useEffect(() => {
        setItems(existingMasterItems);
    }, [existingMasterItems, isOpen]);

    const resetForm = () => {
        setFormData({ name: '', unitPrice: '', annualTarget: '' });
        setIsEditing(null);
        setShowForm(false);
        setFormError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) { setFormError('項目名は必須です。'); return false; }
        const unitPriceNum = parseFloat(formData.unitPrice as string);
        if (isNaN(unitPriceNum) || unitPriceNum < 0) { setFormError('単価は0以上の数値を入力してください。'); return false; }
        if (formData.annualTarget !== '' && formData.annualTarget !== undefined) {
            const annualTargetNum = parseFloat(formData.annualTarget as string);
            if (isNaN(annualTargetNum) || annualTargetNum < 0) { setFormError('年間目標は0以上の数値を入力してください。'); return false; }
        }
        setFormError(null);
        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const unitPrice = parseFloat(formData.unitPrice as string);
        const annualTarget = formData.annualTarget !== '' && formData.annualTarget !== undefined ? parseFloat(formData.annualTarget as string) : undefined;

        let updatedItems;
        if (isEditing) {
            updatedItems = items.map(item => item.id === isEditing.id ? { ...isEditing, name: formData.name, unitPrice, annualTarget } : item);
        } else {
            const newItem: MasterItem = { 
                id: Date.now().toString(), 
                name: formData.name, 
                unitPrice, 
                category,
                annualTarget
            };
            updatedItems = [...items, newItem];
        }
        
        // Save all master items (not just this category's)
        const allStoredItems = loadFromLocalStorage<MasterItem[]>(MASTER_ITEMS_STORAGE_KEY, []);
        const otherCategoryItems = allStoredItems.filter(item => item.category !== category);
        const newMasterList = [...otherCategoryItems, ...updatedItems];
        
        saveToLocalStorage(MASTER_ITEMS_STORAGE_KEY, newMasterList);
        setItems(updatedItems); // Update local state for this modal
        onMasterItemsUpdate(); // Notify App.tsx to reload all master items
        resetForm();
    };

    const handleEdit = (item: MasterItem) => {
        setIsEditing(item);
        setFormData({ name: item.name, unitPrice: item.unitPrice.toString(), annualTarget: item.annualTarget?.toString() || '' });
        setShowForm(true);
        setFormError(null);
    };

    const requestDelete = (item: MasterItem) => {
        setItemToDelete(item);
        setShowConfirmDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const updatedItems = items.filter(item => item.id !== itemToDelete.id);
        
        const allStoredItems = loadFromLocalStorage<MasterItem[]>(MASTER_ITEMS_STORAGE_KEY, []);
        const otherCategoryItems = allStoredItems.filter(item => item.category !== category);
        const newMasterList = [...otherCategoryItems, ...updatedItems];

        saveToLocalStorage(MASTER_ITEMS_STORAGE_KEY, newMasterList);
        setItems(updatedItems);
        onMasterItemsUpdate();
        setShowConfirmDeleteModal(false);
        setItemToDelete(null);
        if (isEditing?.id === itemToDelete.id) resetForm(); // If deleting the item being edited
    };

    if (!isOpen) return null;
    const categoryName = category === 'private' ? '自費治療項目' : '物販商品';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">{categoryName} マスター設定</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5" /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {!showForm && (
                        <button 
                            onClick={() => { setIsEditing(null); setFormData({ name: '', unitPrice: '', annualTarget: '' }); setShowForm(true); }}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                        >
                            新規{categoryName}追加
                        </button>
                    )}

                    {showForm && (
                        <div className="p-4 border rounded-md bg-gray-50 space-y-3">
                            <h4 className="text-md font-semibold text-gray-700">{isEditing ? `${categoryName}編集` : `新規${categoryName}追加`}</h4>
                            <div>
                                <label htmlFor="masterItemName" className="block text-sm font-medium text-gray-700 mb-1">項目名 *</label>
                                <input type="text" id="masterItemName" name="name" value={formData.name} onChange={handleFormChange} className="form-input w-full"/>
                            </div>
                            <div>
                                <label htmlFor="masterItemUnitPrice" className="block text-sm font-medium text-gray-700 mb-1">単価 (円) *</label>
                                <input type="number" id="masterItemUnitPrice" name="unitPrice" value={formData.unitPrice} onChange={handleFormChange} min="0" className="form-input w-full"/>
                            </div>
                            <div>
                                <label htmlFor="masterItemAnnualTarget" className="block text-sm font-medium text-gray-700 mb-1">年間目標金額 (円) (任意)</label>
                                <input type="number" id="masterItemAnnualTarget" name="annualTarget" value={formData.annualTarget} onChange={handleFormChange} min="0" className="form-input w-full"/>
                            </div>
                            {formError && <p className="text-sm text-red-600">{formError}</p>}
                            <div className="flex justify-end space-x-2">
                                <button className="px-3 py-1.5 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md" onClick={resetForm}>キャンセル</button>
                                <button className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md" onClick={handleSubmit}>{isEditing ? '更新' : '追加'}</button>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-md font-semibold text-gray-700 mt-3 mb-2">登録済み{categoryName}リスト</h4>
                        {items.length === 0 ? (
                            <p className="text-sm text-gray-500">登録されている{categoryName}はありません。</p>
                        ) : (
                            <ul className="space-y-2 max-h-72 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                                {items.sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                                    <li key={item.id} className="flex justify-between items-center p-2 bg-white border rounded-md shadow-sm text-sm">
                                        <div>
                                            <span className="font-medium text-gray-800">{item.name}</span>
                                            <span className="text-gray-600 ml-2">(単価: ¥{item.unitPrice.toLocaleString()})</span>
                                            {item.annualTarget !== undefined && <span className="text-gray-500 text-xs ml-2">(年間目標: ¥{item.annualTarget.toLocaleString()})</span>}
                                        </div>
                                        <div className="space-x-2">
                                            <button className="text-xs text-indigo-600 hover:text-indigo-900" onClick={() => handleEdit(item)}>編集</button>
                                            <button className="text-xs text-red-600 hover:text-red-900" onClick={() => requestDelete(item)}>削除</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={onClose}>閉じる</button>
                </div>
            </div>
            <ConfirmDeleteModal
                isOpen={showConfirmDeleteModal}
                onClose={() => {setShowConfirmDeleteModal(false); setItemToDelete(null);}}
                onConfirm={confirmDelete}
                itemName={itemToDelete?.name}
                message={`本当に「${itemToDelete?.name}」を削除しますか？この操作は元に戻せません。`}
            />
        </div>
    );
};

export default MasterItemModal;