import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface ProgressDonutChartProps {
  percentage: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  title?: string;
}

const ProgressDonutChart: React.FC<ProgressDonutChartProps> = ({
  percentage,
  color = "#3b82f6", // Default to blue-500
  size = 150,
  strokeWidth = 15,
  title
}) => {
  const validPercentage = Math.max(0, Math.min(100, percentage || 0)); // Ensure percentage is between 0 and 100

  // COLORS[0] is progress, COLORS[1] is background
  const COLORS = [color, '#e5e7eb']; // Progress color, background color (gray-200)

  const outerRadius = size / 2;
  const innerRadius = outerRadius - strokeWidth * 1.5;

  return (
    <div style={{ width: size, height: size, position: 'relative' }} role="progressbar" aria-valuenow={validPercentage} aria-valuemin={0} aria-valuemax={100} title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Background Pie: Full grey circle */}
          <Pie
            data={[{value: 100}]}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill={COLORS[1]} // Background color
            stroke={COLORS[1]} // Background stroke color
            paddingAngle={0}
            dataKey="value"
            startAngle={90} // Full circle from top
            endAngle={90 + 360} // Full circle
            isAnimationActive={false}
          >
            <Label
              value={`${validPercentage.toFixed(1)}%`}
              position="center"
              fill={color}
              fontSize={size / 6}
              fontWeight="bold"
              dy={5}
            />
          </Pie>
          {/* Progress Pie: Colored arc on top */}
          {validPercentage > 0 && ( // Only render progress arc if there is progress
            <Pie
              data={[{ value: 1 }]} // Single dummy data item for the arc
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={0}
              dataKey="value"
              startAngle={90} // Start from top
              endAngle={90 + (360 * (validPercentage / 100))} // Angle based on percentage, clockwise
              cornerRadius={validPercentage > 0 && validPercentage < 100 ? strokeWidth / 2 : 0} // Rounded ends unless full/empty
              isAnimationActive={true} // Allow animation for progress update
            >
              <Cell fill={color} stroke={color} />
            </Pie>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressDonutChart;
