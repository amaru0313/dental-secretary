import React, { useMemo } from 'react';
import { AnnualSalesDataStorage, ClinicSettingsData, DailySaleEntry, AnnualSalesCategoryKey } from '../types';
import { ANNUAL_SALES_STORAGE_KEY, CLINIC_SETTINGS_STORAGE_KEY } from '../constants';
import { loadFromLocalStorage, getCurrentDateYYYYMMDD, getPastNDates, formatDateForDisplay } from '../utils';
import PageTitle from '../components/PageTitle';
import MiniLineChart from '../components/MiniLineChart';
import ProgressDonutChart from '../components/ProgressDonutChart';
import { format } from 'date-fns/format';
import { ja } from 'date-fns/locale/ja';

const DashboardPage: React.FC = () => {
  const clinicSettings = loadFromLocalStorage<ClinicSettingsData>(CLINIC_SETTINGS_STORAGE_KEY, {});
  const allSales = loadFromLocalStorage<AnnualSalesDataStorage>(ANNUAL_SALES_STORAGE_KEY, { insurance: [], private: [], products: [] });

  const today = getCurrentDateYYYYMMDD();
  const currentDateObj = new Date();
  const formattedCurrentDate = format(currentDateObj, 'yyyy年MM月dd日 (E)', { locale: ja });

  const currentYear = currentDateObj.getFullYear();
  const currentMonth = currentDateObj.getMonth(); // 0-indexed

  // --- Row 1: Today's Summary ---
  const todaysSalesEntries = useMemo(() => {
    return (Object.values(allSales) as DailySaleEntry[][])
      .flat()
      .filter(sale => sale.date === today);
  }, [allSales, today]);

  const todaysPatientCount = useMemo(() => {
    const patientIds = new Set<string>();
    todaysSalesEntries.forEach(sale => {
      if (sale.patientId) { // Ensure patientId exists
        patientIds.add(sale.patientId);
      }
    });
    return patientIds.size;
  }, [todaysSalesEntries]);

  const todaysTotalSales = useMemo(() => {
    return todaysSalesEntries.reduce((sum, sale) => sum + sale.amount, 0);
  }, [todaysSalesEntries]);

  // --- Row 2: 7-Day Sales Trends ---
  const last7Days = useMemo(() => getPastNDates(7).reverse(), []); // Reversed for chronological order

  const getCategorySalesForLast7Days = (category: AnnualSalesCategoryKey): { date: string, value: number }[] => {
    const categorySales = allSales[category] || [];
    return last7Days.map(date => {
      const dailyTotal = categorySales
        .filter(sale => sale.date === date)
        .reduce((sum, sale) => sum + sale.amount, 0);
      return { date: formatDateForDisplay(date, 'dd日'), value: dailyTotal }; 
    });
  };

  const salesTrendData = {
    insurance: getCategorySalesForLast7Days('insurance'),
    private: getCategorySalesForLast7Days('private'),
    products: getCategorySalesForLast7Days('products'),
  };
  
  // --- Row 3: Monthly Target Progress ---
  const getMonthlyProgress = (category: AnnualSalesCategoryKey) => {
    const annualTarget = clinicSettings[('annualTarget' + category.charAt(0).toUpperCase() + category.slice(1)) as keyof ClinicSettingsData] as number | undefined || 0;
    const monthlyTarget = annualTarget / 12;

    const categorySales = allSales[category] || [];
    const currentMonthSales = categorySales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getFullYear() === currentYear && saleDate.getMonth() === currentMonth;
      })
      .reduce((sum, sale) => sum + sale.amount, 0);

    const progressPercentage = monthlyTarget > 0 ? (currentMonthSales / monthlyTarget) * 100 : 0;
    
    return {
        title: category === 'insurance' ? '保険診療' : category === 'private' ? '自費治療' : '物販',
        percentage: progressPercentage, 
        actualSales: currentMonthSales,
        targetSales: monthlyTarget
    };
  };

  const progressData = {
    insurance: getMonthlyProgress('insurance'),
    private: getMonthlyProgress('private'),
    products: getMonthlyProgress('products'),
  };

  const chartColors: Record<AnnualSalesCategoryKey, string> = {
    insurance: '#3b82f6', // blue-500
    private: '#10b981',   // green-500
    products: '#f59e0b',  // amber-500
  };


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="ダッシュボード > 売上/月" />
        <p className="text-xs text-gray-500 whitespace-nowrap">
          {formattedCurrentDate}
        </p>
      </div>

      {/* Row 1: Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">本日の患者数</h3>
          <p className="text-4xl font-bold text-blue-600">{todaysPatientCount}<span className="text-xl ml-1">人</span></p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">本日の売上総額</h3>
          <p className="text-4xl font-bold text-green-600">¥{todaysTotalSales.toLocaleString()}</p>
        </div>
      </div>

      {/* Row 2: 7-Day Sales Trends */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">カテゴリ別 売上推移 (直近7日間)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['insurance', 'private', 'products'] as AnnualSalesCategoryKey[]).map(cat => (
            <div key={cat} className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">
                {cat === 'insurance' ? '保険診療' : cat === 'private' ? '自費治療' : '物販'}
              </h4>
              <MiniLineChart
                data={salesTrendData[cat]}
                color={chartColors[cat]}
                height={200} 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Row 3: Monthly Target Progress */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">カテゴリ別 月目標進捗 ({currentYear}年 {currentMonth + 1}月)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(['insurance', 'private', 'products'] as AnnualSalesCategoryKey[]).map(cat => {
            const data = progressData[cat];
            return (
              <div key={cat} className="bg-white p-3 rounded-lg shadow-md flex flex-col items-center">
                <h4 className="text-md font-semibold text-gray-700 mb-1">{data.title}</h4>
                <ProgressDonutChart
                  percentage={Math.min(data.percentage, 100)} 
                  color={chartColors[cat]}
                  size={220} 
                  strokeWidth={20} 
                />
                <div className="text-center mt-2 text-xs text-gray-600">
                    <p>実績: ¥{data.actualSales.toLocaleString()}</p>
                    <p>目標: ¥{data.targetSales > 0 ? data.targetSales.toLocaleString() : "未設定"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
