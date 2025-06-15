
import React from 'react';
import { CloseIcon } from './icons';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName?: string;
    message?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    message
}) => {
    if (!isOpen) return null;

    const confirmMessage = message || (itemName ? `本当に「${itemName}」を削除しますか？` : '本当に削除しますか？');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl m-4 sm:m-8 p-6 w-full max-w-md transform transition-all duration-300 ease-out">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">削除の確認</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="閉じる"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="py-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{confirmMessage}</p>
                </div>
                <div className="flex justify-end pt-3 border-t border-gray-200 space-x-3">
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        onClick={onClose}
                    >
                        いいえ
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        onClick={() => { onConfirm(); onClose(); }}
                    >
                        はい
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
