
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MiniLineChartDataPoint {
  date: string; // Formatted as MM月DD日
  value: number;
}

interface MiniLineChartProps {
  data: MiniLineChartDataPoint[];
  color?: string;
  height?: number;
}

const MiniLineChart: React.FC<MiniLineChartProps> = ({ data, color = "#8884d8", height = 150 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-gray-500 text-sm">データがありません</div>;
  }
  
  // Format Y-axis ticks to be more concise (e.g., 10k, 1M)
  const formatYAxisTick = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} strokeOpacity={0.7} />
          <YAxis tickFormatter={formatYAxisTick} tick={{ fontSize: 10 }} strokeOpacity={0.7} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '4px', fontSize: '12px', padding: '4px 8px' }}
            itemStyle={{ color: color }}
            formatter={(value: number) => [`¥${value.toLocaleString()}`, "売上"]}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="売上" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniLineChart;
