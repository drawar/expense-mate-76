
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
  // Custom label for pie charts that avoids text scaling issues
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent 
  }: any) => {
    // Don't render labels directly on the chart to avoid scaling issues
    return null;
  };

  return (
    <Card className="chart-container h-full">
      <CardHeader className="pb-0 pt-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value, 'USD')}
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
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
        
        {/* Improved legend styling to prevent overflow */}
        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto px-2">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate max-w-[120px]" title={entry.name}>
                  {entry.name}
                </span>
                <span className="ml-1 font-medium whitespace-nowrap">
                  {(entry.value / data.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PieChartCard;
