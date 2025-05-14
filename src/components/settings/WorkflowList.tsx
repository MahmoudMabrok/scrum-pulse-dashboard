
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { WorkflowConfig } from '@/utils/githubWorkflowApp/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Plus } from 'lucide-react';
import WorkflowForm from './WorkflowForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkflowListProps {
  workflows: WorkflowConfig[];
  onAdd: (workflow: WorkflowConfig) => void;
  onUpdate: (workflow: WorkflowConfig) => void;
  onDelete: (workflowId: string) => void;
  onSaveAll: () => void;
}

const WorkflowList = ({ workflows, onAdd, onUpdate, onDelete, onSaveAll }: WorkflowListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);

  const handleEdit = (workflow: WorkflowConfig) => {
    setSelectedWorkflow(workflow);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (workflow: WorkflowConfig) => {
    setSelectedWorkflow(workflow);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedWorkflow) {
      onDelete(selectedWorkflow.id);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">GitHub Workflows</h3>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No workflows configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a workflow to start tracking GitHub Actions builds
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Page Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>{workflow.id}</TableCell>
                  <TableCell>{workflow.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{workflow.pageSize}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(workflow)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(workflow)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onSaveAll}>Save Settings</Button>
      </div>

      {/* Add Workflow Dialog */}
      <WorkflowForm
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={onAdd}
      />

      {/* Edit Workflow Dialog */}
      {selectedWorkflow && (
        <WorkflowForm
          workflow={selectedWorkflow}
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={onUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the workflow "{selectedWorkflow?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkflowList;
