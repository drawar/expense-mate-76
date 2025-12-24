import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TransactionSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const TransactionSearchBar = ({
  searchQuery,
  onSearchChange,
}: TransactionSearchBarProps) => {
  return (
    <div className="relative flex-grow">
      <SearchIcon
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        style={{ strokeWidth: 2.5 }}
      />
      <Input
        placeholder="Search transactions..."
        className="pl-9"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default TransactionSearchBar;
