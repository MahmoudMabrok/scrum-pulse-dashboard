
import { useState } from "react";
import { WorkflowRun } from "@/utils/githubWorkflow";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BuildDetailsDialog from "./BuildDetailsDialog";
import { getStatusBadge } from "./BuildsUtils";
import { format } from "date-fns";

interface BuildListProps {
  workflowRuns: WorkflowRun[];
}

const BuildList = ({ workflowRuns }: BuildListProps) => {
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd-MM-yyyy");
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm:ss");
  };
  
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Branch</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="hidden md:table-cell">PRs</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflowRuns.map((run) => (
            <TableRow key={run.id}>
              <TableCell>
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => setSelectedRun(run)}
                >
                  #{run.id}
                </Button>
              </TableCell>
              <TableCell>{getStatusBadge(run.status, run.conclusion)}</TableCell>
              <TableCell className="hidden md:table-cell">{run.branch}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div>{formatDate(run.created_at)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(run.created_at)}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div>{run.prs}</div>
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedRun(run)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {selectedRun && (
        <BuildDetailsDialog 
          run={selectedRun} 
          onClose={() => setSelectedRun(null)} 
          open={!!selectedRun}
        />
      )}
    </>
  );
};

export default BuildList;
