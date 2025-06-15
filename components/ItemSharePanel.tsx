import React, { useMemo } from 'react';
import { DailySaleEntry, MasterItem, ChartDataItem, ItemSharePanelProps } from '../types';
import { CHART_COLORS, OTHER_MANUAL_ENTRY_NAME } from '../constants';
import SimpleDonutChart from './SimpleDonutChart'; // Assuming this component exists

type TableDisplayMasterItem = MasterItem & {
    actualSales: number;
    sharePercentage: number;
    targetAchievementRateDisplay: string;
};

const ItemSharePanel: React.FC<ItemSharePanelProps> = ({ categoryKey, categorySalesData, categoryMasterItems }) => {
    
    const aggregatedData = useMemo(() => {
        const salesByMasterItem: Map<string, { name: string; totalAmount: number; unitPrice?: number; annualTarget?: number; }> = new Map();
        categoryMasterItems.forEach(mi => {
            salesByMasterItem.set(mi.id, { name: mi.name, totalAmount: 0, unitPrice: mi.unitPrice, annualTarget: mi.annualTarget });
        });

        let otherManualSalesAmount = 0;
        let otherManualItemsCount = 0;

        categorySalesData.forEach(sale => {
            if (sale.treatmentItems && sale.treatmentItems.length > 0) { // New multi-item structure
                sale.treatmentItems.forEach(ti => {
                    if (salesByMasterItem.has(ti.id)) {
                        const current = salesByMasterItem.get(ti.id)!;
                        const master = categoryMasterItems.find(cmi => cmi.id === ti.id);
                        current.totalAmount += (master ? master.unitPrice : 0) * ti.quantity;
                    } else { // Item ID not in master list (should ideally not happen if data is clean)
                        // This case might require more robust handling or logging.
                        // For now, treat as part of "other manual" if ID isn't a known master.
                        const master = categoryMasterItems.find(cmi => cmi.id === ti.id); // Re-check, though unlikely
                        otherManualSalesAmount += (master ? master.unitPrice : 0) * ti.quantity; 
                        if (!master) otherManualItemsCount++;
                    }
                });
            } else if (salesByMasterItem.has(sale.treatmentItem)) { // Old single-item (master ID) structure
                const current = salesByMasterItem.get(sale.treatmentItem)!;
                current.totalAmount += sale.amount;
            } else { // Manually entered item name (old structure) or unmapped item
                otherManualSalesAmount += sale.amount;
                otherManualItemsCount++;
            }
        });
        
        const totalCategorySalesFromMasters = Array.from(salesByMasterItem.values()).reduce((sum, item) => sum + item.totalAmount, 0);
        const totalCategorySales = totalCategorySalesFromMasters + otherManualSalesAmount;

        const chartDataItems: ChartDataItem[] = [];
        const tableDataItems: TableDisplayMasterItem[] = [];
        let colorIndex = 0;

        categoryMasterItems.forEach(mi => {
            const saleData = salesByMasterItem.get(mi.id);
            const actualSales = saleData ? saleData.totalAmount : 0;
            const sharePercentage = totalCategorySales > 0 ? (actualSales / totalCategorySales) * 100 : 0;
            
            let targetAchievementRateDisplay = "ー"; // Default for no target or no sales
            if (mi.annualTarget !== undefined && mi.annualTarget > 0) {
                const rate = (actualSales / mi.annualTarget) * 100;
                targetAchievementRateDisplay = `${rate.toFixed(1)}%`;
            } else if (mi.annualTarget !== undefined && mi.annualTarget <= 0 && actualSales > 0) {
                 targetAchievementRateDisplay = "∞"; // Sales with 0 target
            } else if (mi.annualTarget !== undefined) {
                 targetAchievementRateDisplay = "目標 ¥0";
            } else {
                 targetAchievementRateDisplay = "目標未設定";
            }


            tableDataItems.push({ ...mi, actualSales, sharePercentage, targetAchievementRateDisplay });
            
            if (actualSales > 0) {
                 chartDataItems.push({
                    name: mi.name, value: actualSales, percentage: sharePercentage,
                    color: CHART_COLORS[colorIndex % CHART_COLORS.length]
                });
                colorIndex++;
            }
        });

        if (otherManualSalesAmount > 0) {
            const sharePercentage = totalCategorySales > 0 ? (otherManualSalesAmount / totalCategorySales) * 100 : 0;
            const otherName = `${OTHER_MANUAL_ENTRY_NAME}${otherManualItemsCount > 1 ? ` (${otherManualItemsCount}項目)`: ''}`;
            chartDataItems.push({
                name: otherName, value: otherManualSalesAmount, percentage: sharePercentage,
                color: CHART_COLORS[colorIndex % CHART_COLORS.length]
            });
            tableDataItems.push({
                id: 'other_manual', name: otherName, unitPrice: 0, category: categoryKey,
                actualSales: otherManualSalesAmount, sharePercentage: sharePercentage,
                targetAchievementRateDisplay: "ー", 
            });
        }
        
        chartDataItems.sort((a, b) => b.value - a.value); // Sort for chart display
        tableDataItems.sort((a,b) => { // Sort for table display
            if (b.actualSales !== a.actualSales) return b.actualSales - a.actualSales;
            if (a.id === 'other_manual') return 1; 
            if (b.id === 'other_manual') return -1;
            return a.name.localeCompare(b.name); 
        });

        return { chartDataItems, tableDataItems, totalCategorySales };

    }, [categorySalesData, categoryMasterItems, categoryKey]);


    if (categoryMasterItems.length === 0 && aggregatedData.totalCategorySales === 0) {
        return <p className="text-center text-gray-500 py-4">このカテゴリに登録されているマスター項目および売上データはありません。</p>;
    }
    if (aggregatedData.totalCategorySales === 0 && aggregatedData.chartDataItems.length === 0) {
        return <p className="text-center text-gray-500 py-4">このカテゴリの売上実績はまだありません。</p>;
    }

    return (
        <div className="py-4 space-y-8">
            <SimpleDonutChart 
                data={aggregatedData.chartDataItems} 
                title={`${categoryKey === 'private' ? '自費治療' : '物販'} 売上構成比 (年間)`} 
                width={320} height={320} donutThickness={60}
            />
            
            <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">詳細データ</h4>
                {aggregatedData.tableDataItems.length > 0 ? (
                    <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{categoryKey === 'private' ? '診療科目名' : '商品名'}</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500">単価(円)</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500">項目別年間目標(円)</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500">目標達成率(%)</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500">実績売上(年)</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500">構成比(%)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {aggregatedData.tableDataItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-800 font-medium">{item.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-right">{item.id !== 'other_manual' && item.unitPrice > 0 ? item.unitPrice.toLocaleString() : '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-right">{item.id !== 'other_manual' && item.annualTarget !== undefined ? `¥${item.annualTarget.toLocaleString()}` : (item.id !== 'other_manual' ? '未設定' : 'ー')}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-right">{item.targetAchievementRateDisplay}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 text-right font-semibold">¥{item.actualSales.toLocaleString()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-right">{item.sharePercentage.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="bg-gray-100">
                            <tr>
                                <td colSpan={4} className="px-4 py-2 text-right text-gray-600 font-bold">合計</td>
                                <td className="px-4 py-2 text-right text-gray-700 font-bold">¥{aggregatedData.totalCategorySales.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right text-gray-700 font-bold">100.0%</td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">表示する詳細データがありません。</p>
                )}
            </div>
        </div>
    );
};

export default ItemSharePanel;