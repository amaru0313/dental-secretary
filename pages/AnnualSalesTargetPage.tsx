import React, { useState, useEffect, useMemo } from 'react';
import { DailySaleEntry, AnnualSalesCategoryKey, AnnualSalesTargetPageProps, MasterItem } from '../types';
import { formatDateForDisplay, getCurrentDateYYYYMMDD, formatMinutesToHoursAndMinutes } from '../utils';
import MonthlySalesComboChart from '../components/MonthlySalesComboChart';
import ItemSharePanel from '../components/ItemSharePanel'; // New component
import PageTitle from '../components/PageTitle';

const AnnualSalesTargetPage: React.FC<AnnualSalesTargetPageProps> = ({ 
    categoryKey, pageTitle, allPatients, allStaff, allMasterItems, clinicSettings, 
    onSaleEntryUpdate, onEditEntryRequest, onOpenMasterSettings
}) => {
    // Sales data is now part of annualSalesData prop managed by App.tsx
    // For this page, we need to filter it based on categoryKey
    const [dailySalesData, setDailySalesData] = useState<DailySaleEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'itemShare'>('all');

    // Effect to update local daily sales when annualSalesData (from App.tsx) or categoryKey changes
    useEffect(() => {
        // This effect will run when onSaleEntryUpdate is called from App.tsx,
        // which implies annualSalesData in App.tsx has been updated.
        // We need to get the updated annualSalesData. For now, we'll assume App.tsx re-renders this component
        // with new props. If not, we'd need to load from localStorage here or App.tsx needs to pass down the full sales data.
        // Let's assume App.tsx passes the full `annualSalesData` and this component filters it.
        // This is a temporary solution before full data flow from App state is implemented.
        const storedSalesJSON = localStorage.getItem('dentalAppAnnualSalesData'); // Re-fetch for now
        if (storedSalesJSON) {
            try {
                const allSales = JSON.parse(storedSalesJSON);
                setDailySalesData(allSales[categoryKey] || []);
            } catch (error) {
                console.error(`Failed to parse ${categoryKey} sales for page:`, error);
                setDailySalesData([]);
            }
        }
    }, [categoryKey, onSaleEntryUpdate]); // onSaleEntryUpdate acts as a trigger


    const currentYear = new Date().getFullYear();
    const salesForCurrentYear = dailySalesData.filter(entry => new Date(entry.date).getFullYear() === currentYear);
    const totalAnnualSales = salesForCurrentYear.reduce((sum, entry) => sum + entry.amount, 0);
    
    let annualTargetAmount: number | undefined;
    if (categoryKey === 'insurance') annualTargetAmount = clinicSettings.annualTargetInsurance;
    else if (categoryKey === 'private') annualTargetAmount = clinicSettings.annualTargetPrivate;
    else if (categoryKey === 'products') annualTargetAmount = clinicSettings.annualTargetProducts;

    const annualTargetAchievedPercentage = annualTargetAmount && annualTargetAmount > 0 ? (totalAnnualSales / annualTargetAmount) * 100 : 0;

    const monthlySales = useMemo(() => {
        const salesByMonth: { [month: string]: number } = {};
        const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
        monthNames.forEach(m => salesByMonth[m] = 0);

        salesForCurrentYear.forEach(entry => {
            const monthIndex = new Date(entry.date).getMonth();
            salesByMonth[monthNames[monthIndex]] = (salesByMonth[monthNames[monthIndex]] || 0) + entry.amount;
        });
        return monthNames.map(monthName => ({
            month: monthName,
            value: salesByMonth[monthName]
        }));
    }, [salesForCurrentYear]);

    const monthlyTarget = annualTargetAmount && annualTargetAmount > 0 ? annualTargetAmount / 12 : 0;
    
    const todayDate = getCurrentDateYYYYMMDD();
    const todaysEntries = dailySalesData.filter(entry => entry.date === todayDate)
                            .sort((a,b) => (b.id > a.id ? 1 : -1)); 
    
    const getTreatmentItemDisplayName = (entry: DailySaleEntry): string => {
        if (entry.treatmentItems && entry.treatmentItems.length > 0) {
            return entry.treatmentItems.map(ti => {
                const masterItem = allMasterItems.find(mi => mi.id === ti.id);
                return `${masterItem ? masterItem.name : '不明な項目'} (x${ti.quantity})`;
            }).join(', ');
        }
        // Fallback for single item or old data structure
        const masterItem = allMasterItems.find(item => item.id === entry.treatmentItem);
        return masterItem ? masterItem.name : entry.treatmentItem;
    };


    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <PageTitle title={pageTitle} />
                <div className="flex space-x-3 mt-2 sm:mt-0 self-end sm:self-center">
                    {(categoryKey === 'private' || categoryKey === 'products') && (
                        <button 
                            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            onClick={() => onOpenMasterSettings(categoryKey)}
                        >
                            マスター設定
                        </button>
                    )}
                    <button 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        onClick={() => onEditEntryRequest(undefined, categoryKey)}
                    >
                        新規入力
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-5 rounded-lg shadow-md">
                    <h3 className="text-md font-semibold text-gray-700 mb-1">年間の売上目標</h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {annualTargetAmount !== undefined ? 
                            `¥${annualTargetAmount.toLocaleString()}` : 
                            <span className="text-gray-400 text-xl">未設定</span>
                        }
                    </p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-md">
                    <h3 className="text-md font-semibold text-gray-700 mb-1">年間の売上達成率</h3>
                    <p className="text-xs text-gray-500 mb-0.5">
                        (実績: ¥{totalAnnualSales.toLocaleString()})
                    </p>
                    {annualTargetAmount !== undefined && annualTargetAmount > 0 ? (
                        <>
                            <p className="text-2xl font-bold text-green-600">{annualTargetAchievedPercentage.toFixed(1)}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(annualTargetAchievedPercentage, 100)}%` }}></div>
                            </div>
                        </>
                    ) : (
                         <p className="text-gray-400 text-xl mt-1.5">{totalAnnualSales > 0 ? '目標未設定' : (annualTargetAmount === 0 ? '目標 ¥0' : '目標未設定')}</p>
                    )}
                </div>
            </div>
            
            <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
                        <button 
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('all')}
                            aria-current={activeTab === 'all' ? 'page' : undefined}
                        >
                            月次推移
                        </button>
                        {categoryKey !== 'insurance' && (
                            <button 
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === 'itemShare' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                onClick={() => setActiveTab('itemShare')}
                                aria-current={activeTab === 'itemShare' ? 'page' : undefined}
                            >
                                {categoryKey === 'private' ? '治療項目別シェア' : '商品別シェア'}
                            </button>
                        )}
                    </nav>
                </div>

                <div className="pt-2 sm:pt-4">
                    {activeTab === 'all' && (
                        <div>
                            <h4 className="text-md sm:text-lg font-semibold text-gray-700 text-center mb-1 sm:mb-3">月次売上推移 ({currentYear}年)</h4>
                            <MonthlySalesComboChart
                              actualSalesData={monthlySales}
                              monthlyTarget={monthlyTarget}
                            />
                        </div>
                    )}
                    {activeTab === 'itemShare' && (categoryKey === 'private' || categoryKey === 'products') && (
                        <ItemSharePanel 
                            categoryKey={categoryKey}
                            categorySalesData={salesForCurrentYear} // Pass current year sales
                            categoryMasterItems={allMasterItems.filter(item => item.category === categoryKey)}
                        />
                    )}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md flex-1 flex flex-col overflow-hidden">
                <h3 className="text-md font-semibold text-gray-700 mb-3">本日 ({formatDateForDisplay(todayDate)}) の登録記録</h3>
                {todaysEntries.length > 0 ? (
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">患者名</th>
                                    {categoryKey === 'insurance' && <th className="px-4 py-2 text-left font-medium text-gray-500">保険点数</th>}
                                    {(categoryKey === 'private' || categoryKey === 'products') && <th className="px-4 py-2 text-left font-medium text-gray-500">{categoryKey === 'private' ? '診療科目' : '商品名'}</th>}
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">金額(円)</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">担当名</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">診療時間</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">メモ</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {todaysEntries.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap text-gray-700" title={entry.patientNameDisplay}>{entry.patientNameDisplay}</td>
                                        {categoryKey === 'insurance' && <td className="px-4 py-2 whitespace-nowrap text-gray-500">{entry.insurancePoints || 0}点</td>}
                                        {(categoryKey === 'private' || categoryKey === 'products') && <td className="px-4 py-2 whitespace-nowrap text-gray-500 max-w-xs truncate" title={getTreatmentItemDisplayName(entry)}>{getTreatmentItemDisplayName(entry)}</td>}
                                        <td className="px-4 py-2 whitespace-nowrap text-gray-500">¥{entry.amount.toLocaleString()}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-gray-500" title={entry.staffNameDisplay}>{entry.staffNameDisplay || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-gray-500">{formatMinutesToHoursAndMinutes(entry.treatmentTimeMinutes)}</td>
                                        <td className="px-4 py-2 text-gray-500 max-w-xs truncate" title={entry.memo}>{entry.memo || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <button 
                                                className="text-indigo-600 hover:text-indigo-900 text-xs"
                                                onClick={() => onEditEntryRequest(entry, categoryKey)}
                                            >
                                                編集
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">本日の登録記録はありません。</p>
                )}
            </div>
        </div>
    );
};

export default AnnualSalesTargetPage;