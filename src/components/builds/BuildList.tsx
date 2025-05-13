
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

interface BuildListProps {
  workflowRuns: WorkflowRun[];
}

const BuildList = ({ workflowRuns }: BuildListProps) => {
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workflow</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Branch</TableHead>
            <TableHead className="hidden md:table-cell">Commit</TableHead>
            <TableHead className="hidden md:table-cell">Actor</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflowRuns.map((run) => (
            <TableRow key={run.id}>
              <TableCell>
                <div className="font-medium">{run.name}</div>
                <div className="text-xs text-muted-foreground">{run.repository}</div>
              </TableCell>
              <TableCell>{getStatusBadge(run.status, run.conclusion)}</TableCell>
              <TableCell className="hidden md:table-cell">{run.branch}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="font-mono text-xs">{run.commit}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {run.commit_message}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{run.actor}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div>{new Date(run.created_at).toLocaleDateString()}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(run.created_at).toLocaleTimeString()}
                </div>
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
