
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkflowRun } from "@/utils/githubWorkflowApp/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStatusBadge } from "./BuildsUtils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import PRDetailsCard from "./dialogs/PRDetailsCard";
import JobsSection from "./dialogs/JobsSection";
import { useJobsData } from "./dialogs/useJobsData";

interface BuildDetailsDialogProps {
  run: WorkflowRun;
  open: boolean;
  onClose: () => void;
}

const BuildDetailsDialog = ({ run, open, onClose }: BuildDetailsDialogProps) => {
  const { jobs, loading, error } = useJobsData(run, open);
  const { toast } = useToast();
  
  // Format date strings to DD-MM-YYYY
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd-MM-yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Format time strings to HH:MM:SS
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm:ss");
    } catch (error) {
      return "";
    }
  };

  // copyMethod to copy release information to clipboard for all jobs combined
  const copyAllReleaseInfo = () => {
    if (jobs.length === 0) {
      toast({
        title: "No data to copy",
        description: "There is no release information available to copy",
        variant: "default"
      });
      return;
    }

    // Format copy content for all jobs
    const copyText = jobs.map(job =>
      job.parsedReleases?.map(release =>
        `${extractName(job.name)} Version: ${release.version} Build: ${release.buildNumber}`
      ).join('\n\n') || ""
    ).join('\n\n');

    navigator.clipboard.writeText(copyText)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Release information copied to clipboard",
          variant: "default"
        });
      })
      .catch(err => {
        console.error("Copy failed:", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy information to clipboard",
          variant: "destructive"
        });
      });
  };

  // Function to extract names from the job name
  const extractName = (message: string) => {
    const regex = /\(([^)]+)\)/;
    const match = message.match(regex);
    if (match && match[1]) {
      return match[1].split(",").map(name => name.trim());
    }
    return [];
  }

  const copyReleaseInfo = (job: typeof jobs[0]) => {
    if (!job.parsedReleases || job.parsedReleases.length === 0) {
      toast({
        title: "No data to copy",
        description: "There is no release information available to copy",
        variant: "default"
      });
      return;
    }

    // Format copy content for each release
    const copyText = job.parsedReleases.map(release =>
      `${extractName(job.name)} Version: ${release.version} Build: ${release.buildNumber}`
    ).join('\n\n');

    navigator.clipboard.writeText(copyText)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Release information copied to clipboard",
          variant: "default"
        });
      })
      .catch(err => {
        console.error("Copy failed:", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy information to clipboard",
          variant: "destructive"
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Workflow Run #{run.run_number}</span>
            {getStatusBadge(run.status, run.conclusion)}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            ID: {run.id} • Created: {formatDate(run.created_at)} {formatTime(run.created_at)}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-6 p-1">
            {/* Jobs Section */}
            <JobsSection 
              jobs={jobs} 
              loading={loading} 
              error={error}
              onCopyReleaseInfo={copyReleaseInfo}
              onCopyAllReleaseInfo={copyAllReleaseInfo}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BuildDetailsDialog;
