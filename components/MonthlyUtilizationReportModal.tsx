import React from 'react';
import { MonthlyUtilizationReportModalProps } from '../types';
import { CloseIcon } from './icons';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO'; // Added import
import { ja } from 'date-fns/locale/ja';

const MonthlyUtilizationReportModal: React.FC<MonthlyUtilizationReportModalProps> = ({
    isOpen,
    onClose,
    reportData,
    currentReportMonth,
    onNavigateMonth
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">月次ユニット稼働率レポート</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="閉じる"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
                    <button
                        onClick={() => onNavigateMonth('prev')}
                        className="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                    >
                        前月
                    </button>
                    <h4 className="text-md font-semibold text-gray-700">
                        {format(currentReportMonth, 'yyyy年 M月', { locale: ja })}
                    </h4>
                    <button
                        onClick={() => onNavigateMonth('next')}
                        className="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                    >
                        次月
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {reportData ? (
                        <>
                            <div className="text-sm text-gray-600 mb-3">
                                <p>対象月: {format(parseISO(reportData.month + '-01'), 'yyyy年 M月', { locale: ja })}</p>
                                <p>診療日数: {reportData.operatingDays} 日</p>
                            </div>

                            <h5 className="text-md font-semibold text-gray-700 mb-2">ユニット別 月間平均稼働率</h5>
                            {reportData.unitsUsage.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                    {reportData.unitsUsage.map(unitUsage => (
                                        <li key={unitUsage.unitId} className="flex justify-between p-2 bg-gray-50 rounded-md">
                                            <span className="text-gray-800">{unitUsage.unitName}:</span>
                                            <span className="font-semibold text-blue-600">{unitUsage.utilizationRate.toFixed(1)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">ユニット情報がありません。</p>
                            )}

                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <h5 className="text-md font-semibold text-gray-700 mb-1">全ユニット 月間平均稼働率</h5>
                                <p className="text-2xl font-bold text-green-600">
                                    {reportData.overallAverageUtilization.toFixed(1)}%
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-8">稼働率データを計算中です...</p>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                        onClick={onClose}
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonthlyUtilizationReportModal;