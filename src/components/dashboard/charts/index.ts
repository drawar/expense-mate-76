// components/dashboard/charts/index.ts
export { default as BaseChart } from './BaseChart';
export { default as BarChart } from './BarChart';
export { default as PieChart } from './PieChart';
export * from './ChartTooltip';

// Also export types
export type { BarChartProps } from './BarChart';
export type { ChartDataItem } from './PieChart';
