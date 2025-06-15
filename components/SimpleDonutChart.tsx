import React from 'react';
import { ChartDataItem, SimpleDonutChartProps } from '../types';

const SimpleDonutChart: React.FC<SimpleDonutChartProps> = ({
    data,
    width = 300,
    height = 300,
    donutThickness = 50,
    title
}) => {
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius - donutThickness;
    const centerX = width / 2;
    const centerY = height / 2;

    const noDataMessage = (
        <div className="flex flex-col items-center justify-center h-full text-gray-500" style={{ width, height }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7c0-1.1.9-2 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">表示するデータがありません。</p>
        </div>
    );

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center">
                {title && <h4 className="text-md font-semibold text-gray-700 mb-3 text-center">{title}</h4>}
                {noDataMessage}
            </div>
        );
    }

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    if (totalValue === 0) {
        return (
            <div className="flex flex-col items-center">
                 {title && <h4 className="text-md font-semibold text-gray-700 mb-3 text-center">{title}</h4>}
                {noDataMessage}
            </div>
        );
    }

    let currentAngle = -Math.PI / 2; // Start at 12 o'clock

    const paths = data.map((item, index) => {
        if (item.value === 0) return null;
        const angle = (item.value / totalValue) * 2 * Math.PI;

        const x1 = centerX + radius * Math.cos(currentAngle);
        const y1 = centerY + radius * Math.sin(currentAngle);
        const nextAngle = currentAngle + angle;
        const x2 = centerX + radius * Math.cos(nextAngle);
        const y2 = centerY + radius * Math.sin(nextAngle);

        const x3 = centerX + innerRadius * Math.cos(nextAngle);
        const y3 = centerY + innerRadius * Math.sin(nextAngle);
        const x4 = centerX + innerRadius * Math.cos(currentAngle);
        const y4 = centerY + innerRadius * Math.sin(currentAngle);

        const largeArcFlag = angle > Math.PI ? 1 : 0;

        const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
            'Z'
        ].join(' ');
        
        currentAngle = nextAngle; // Update currentAngle for the next segment

        return <path key={index} d={pathData} fill={item.color} />;
    }).filter(Boolean);

    return (
        <div className="flex flex-col items-center">
            {title && <h4 className="text-md font-semibold text-gray-700 mb-3 text-center">{title}</h4>}
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={title || "Donut chart"}>
                {paths}
            </svg>
            <ul className="mt-4 space-y-1 text-xs max-w-xs w-full">
                {data.filter(item => item.value > 0).map((item, index) => (
                    <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                            <span className="text-gray-600 truncate" title={item.name}>{item.name}</span>
                        </div>
                        <div className="text-gray-700 font-medium">
                           <span>{item.percentage.toFixed(1)}%</span>
                           <span className="text-gray-500 ml-1">(¥{item.value.toLocaleString()})</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SimpleDonutChart;