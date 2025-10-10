import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FinanceTransaction } from '../../types';
import { format, startOfMonth, subMonths, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';

interface FinancialChartProps {
  transactions: FinanceTransaction[];
}

const FinancialChart: React.FC<FinancialChartProps> = ({ transactions }) => {
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    const labels: string[] = [];
    const revenueData: number[] = [];
    const expenseData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      labels.push(format(month, 'MMM', { locale: ptBR }));

      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
      });

      const monthlyRevenue = monthTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyExpense = monthTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + t.amount, 0);

      revenueData.push(monthlyRevenue);
      expenseData.push(monthlyExpense);
    }
    return { labels, revenueData, expenseData };
  }, [transactions]);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    legend: {
      data: ['Receita', 'Despesa'],
      textStyle: { color: theme === 'dark' ? '#cbd5e1' : '#475569' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.labels,
      axisLine: { lineStyle: { color: theme === 'dark' ? '#475569' : '#d1d5db' } },
      axisLabel: { color: theme === 'dark' ? '#94a3b8' : '#6b7280' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: true, lineStyle: { color: theme === 'dark' ? '#475569' : '#d1d5db' } },
      axisLabel: { color: theme === 'dark' ? '#94a3b8' : '#6b7280' },
      splitLine: { lineStyle: { color: theme === 'dark' ? '#334155' : '#e5e7eb' } }
    },
    series: [
      {
        name: 'Receita',
        type: 'bar',
        stack: 'Total',
        label: { show: false },
        emphasis: { focus: 'series' },
        data: chartData.revenueData,
        itemStyle: { color: '#22c55e' } // green-500
      },
      {
        name: 'Despesa',
        type: 'bar',
        stack: 'Total',
        label: { show: false },
        emphasis: { focus: 'series' },
        data: chartData.expenseData,
        itemStyle: { color: '#ef4444' } // red-500
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '350px' }} theme={theme} />;
};

export default FinancialChart;
