
import { GridIcon, TableIcon, SortAscIcon, SortDescIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
export type ViewMode = 'grid' | 'table';

interface TransactionSortAndViewProps {
  sortOption: SortOption;
  viewMode: ViewMode;
  onSortChange: (value: SortOption) => void;
  onViewChange: (value: ViewMode) => void;
}

const TransactionSortAndView = ({
  sortOption,
  viewMode,
  onSortChange,
  onViewChange,
}: TransactionSortAndViewProps) => {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={sortOption}
        onValueChange={(value) => onSortChange(value as SortOption)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-desc">
            <div className="flex items-center">
              <SortDescIcon className="h-4 w-4 mr-2" />
              Newest First
            </div>
          </SelectItem>
          <SelectItem value="date-asc">
            <div className="flex items-center">
              <SortAscIcon className="h-4 w-4 mr-2" />
              Oldest First
            </div>
          </SelectItem>
          <SelectItem value="amount-desc">
            <div className="flex items-center">
              <SortDescIcon className="h-4 w-4 mr-2" />
              Highest Amount
            </div>
          </SelectItem>
          <SelectItem value="amount-asc">
            <div className="flex items-center">
              <SortAscIcon className="h-4 w-4 mr-2" />
              Lowest Amount
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <div className="hidden sm:flex border rounded-md">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-r-none"
          onClick={() => onViewChange('grid')}
        >
          <GridIcon className="h-4 w-4" />
          <span className="sr-only">Grid View</span>
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-l-none"
          onClick={() => onViewChange('table')}
        >
          <TableIcon className="h-4 w-4" />
          <span className="sr-only">Table View</span>
        </Button>
      </div>
    </div>
  );
};

export default TransactionSortAndView;
