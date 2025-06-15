
import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { MonthlySalesChartData } from '../types';

interface MonthlySalesComboChartProps {
  actualSalesData: MonthlySalesChartData[]; // Example: { month: '1月', value: 100000 }
  monthlyTarget: number;
}

const MonthlySalesComboChart: React.FC<MonthlySalesComboChartProps> = ({ actualSalesData, monthlyTarget }) => {
  const chartData = actualSalesData.map(item => ({
    name: item.month,
    売上実績: item.value,
    月間目標: monthlyTarget > 0 ? monthlyTarget : undefined, // Only show target line if target > 0
  }));

  const formatNumberWithUnit = (num: number, unit: string): string => {
    if (unit === '円') {
        return `${num.toLocaleString()}${unit}`;
    }
    const formattedNum = parseFloat(num.toFixed(1)); 
    return `${formattedNum.toLocaleString()}${unit}`;
  };

  const formatYAxisTick = (value: number): string => {
    if (value === 0) return '0円'; // Changed from '0' to '0円'

    const oneOkunen = 100_000_000;
    const oneManen = 10_000;

    if (Math.abs(value) >= oneOkunen) {
        const num = value / oneOkunen;
        return formatNumberWithUnit(num, '億円');
    } else if (Math.abs(value) >= oneManen) {
        const num = value / oneManen;
        return formatNumberWithUnit(num, '万円');
    } else {
        return formatNumberWithUnit(value, '円');
    }
  };

  return (
    <div className="h-80 md:h-96 w-full p-4 bg-white rounded-lg shadow">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            top: 20, right: 0, left: 25, bottom: 5, // Increased left margin for Y-axis label
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
          <YAxis 
            stroke="#666" 
            tickFormatter={formatYAxisTick} 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '売上金額', 
              angle: -90, 
              position: 'left', 
              offset: 10, 
              style: { textAnchor: 'middle', fill: '#666', fontSize: '12px' } 
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`¥${value.toLocaleString()}`, name]}
            labelStyle={{ color: '#333', fontWeight: 'bold', marginBottom: '4px' }}
            itemStyle={{ color: '#555' }}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid #ccc', 
              borderRadius: '4px', 
              padding: '8px 12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
          {/* Changed Bar to Line for 売上実績 */}
          <Line 
            type="monotone" 
            dataKey="売上実績" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            name="売上実績" 
            dot={{ r: 3 }} 
            activeDot={{ r: 6 }} 
          />
          {monthlyTarget > 0 && (
            <Line type="monotone" dataKey="月間目標" stroke="#10b981" strokeWidth={2} name="月間目標" dot={false} activeDot={{ r: 5 }}/>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesComboChart;
