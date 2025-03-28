
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartCardProps {
  title: string;
  data: ChartData[];
}

const PieChartCard = ({ title, data }: PieChartCardProps) => {
  // Precalculate percentages and prepare display data to avoid calculations during render
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total * 100) : 0
    }));
  }, [data]);
  
  // Memoize tooltip formatter for better performance
  const tooltipFormatter = useMemo(() => {
    return (value: number) => formatCurrency(value, 'USD');
  }, []);
  
  // Return empty state early to avoid rendering unnecessary components
  if (processedData.length === 0) {
    return (
      <Card className="chart-container h-full flex flex-col rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
        <CardHeader className="pb-0 pt-4">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow py-4">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chart-container h-full flex flex-col rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
      <CardHeader className="pb-0 pt-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow py-4">
        <div className="flex flex-col md:flex-row h-full">
          {/* Chart on the left with memoized rendering */}
          <div className="w-full md:w-1/2 min-h-[240px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  // Disable labels for better performance
                  isAnimationActive={false}
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={tooltipFormatter}
                  labelFormatter={(name) => name}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '8px 12px',
                    backgroundColor: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Labels with pre-calculated percentages */}
          <div className="w-full md:w-1/2 md:pl-4 mt-4 md:mt-0 flex items-center">
            <div className="grid grid-cols-1 gap-2 w-full max-h-[240px] overflow-y-auto pr-2">
              {processedData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center text-xs">
                  <div 
                    className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate max-w-[180px]" title={entry.name}>
                    {entry.name}
                  </span>
                  <span className="ml-1 font-medium whitespace-nowrap">
                    {entry.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PieChartCard;
