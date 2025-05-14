
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BuildsFiltersProps {
  search: string;
  branch: string;
  onSearchChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

const BuildsFilters = ({
  search,
  branch,
  onSearchChange,
  onBranchChange,
  onSearch,
  onClear
}: BuildsFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search input */}
        <div>
          <Label htmlFor="search-input" className="text-sm mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              className="pl-9"
              placeholder="Search builds by name, commit, status..." 
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
            />
            {search && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Branch filter */}
        <div>
          <Label htmlFor="branch-input" className="text-sm mb-1 block">Branch</Label>
          <div className="relative">
            <Input
              id="branch-input"
              placeholder="Filter by branch name" 
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
            />
            {branch && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => onBranchChange('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button onClick={onSearch} className="flex-1 md:flex-none">Search</Button>
        <Button onClick={onClear} variant="outline">Clear Filters</Button>
      </div>
    </div>
  );
};

export default BuildsFilters;
