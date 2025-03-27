
import React from 'react';
import SpendingByCategoryCard from './PieChartCard';
import SummaryCard from './SummaryCard';
import PointsSummaryCard from './PointsSummaryCard';

const SummaryCardGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="col-span-1">
        <SummaryCard />
      </div>
      <div className="col-span-1">
        <SpendingByCategoryCard />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <PointsSummaryCard />
      </div>
    </div>
  );
};

export default SummaryCardGrid;
