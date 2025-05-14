
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkflowConfig } from '@/utils/githubWorkflowApp/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface WorkflowFormProps {
  workflow?: WorkflowConfig;
  open: boolean;
  onClose: () => void;
  onSave: (workflow: WorkflowConfig) => void;
}

const WorkflowForm = ({ workflow, open, onClose, onSave }: WorkflowFormProps) => {
  const [workflowId, setWorkflowId] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [pageSize, setPageSize] = useState('10');
  const { toast } = useToast();

  // Initialize form with existing workflow data if provided
  useEffect(() => {
    if (workflow) {
      setWorkflowId(workflow.id);
      setWorkflowName(workflow.name);
      setPageSize(workflow.pageSize.toString());
    } else {
      // Reset form for new workflow
      setWorkflowId('');
      setWorkflowName('');
      setPageSize('10');
    }
  }, [workflow, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!workflowId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Workflow ID is required',
        variant: 'destructive',
      });
      return;
    }

    if (!workflowName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Workflow name is required',
        variant: 'destructive',
      });
      return;
    }

    const pageSizeNum = parseInt(pageSize, 10);
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      toast({
        title: 'Validation Error',
        description: 'Page size must be a number between 1 and 100',
        variant: 'destructive',
      });
      return;
    }

    onSave({
      id: workflowId.trim(),
      name: workflowName.trim(),
      pageSize: pageSizeNum,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {workflow ? 'Edit Workflow' : 'Add New Workflow'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workflowId">Workflow ID</Label>
            <Input
              id="workflowId"
              placeholder="e.g. 12345"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              disabled={!!workflow} // Disable editing ID for existing workflows
            />
            <p className="text-sm text-muted-foreground">
              The numeric ID of your GitHub workflow
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="workflowName">Display Name</Label>
            <Input
              id="workflowName"
              placeholder="e.g. Build and Test"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pageSize">Page Size</Label>
            <Input
              id="pageSize"
              type="number"
              min="1"
              max="100"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Number of workflow runs to fetch per page (1-100)
            </p>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {workflow ? 'Update' : 'Add'} Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowForm;
