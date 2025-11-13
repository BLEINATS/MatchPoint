import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';

interface DonutChartProps {
  data: Record<string, number>;
  title: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, title }) => {
  const { theme } = useTheme();

  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: theme === 'dark' ? '#cbd5e1' : '#475569' },
      formatter: (name: string) => {
          const item = chartData.find(d => d.name === name);
          const value = item ? item.value : 0;
          return `${name}: ${formatCurrency(value)}`;
      },
      icon: 'circle'
    },
    series: [{
      name: title,
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['75%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
          formatter: (params: any) => `${params.name}\n${formatCurrency(params.value)}`,
          color: theme === 'dark' ? '#fff' : '#000'
        }
      },
      labelLine: { show: false },
      data: chartData,
    }],
    color: ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#64748b']
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700 h-full">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <ReactECharts option={option} style={{ height: '300px' }} theme={theme} />
    </div>
  );
};

export default DonutChart;
