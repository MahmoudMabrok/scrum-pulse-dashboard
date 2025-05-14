
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkflowRun, JobRun, ReleaseInfo } from "@/utils/githubWorkflowApp/types";
import { fetchWorkflowJobs, fetchWorkflowArtifacts, fetchJobLogs, parseReleaseInfo } from "@/utils/githubWorkflowApp";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobDetails from "./JobDetails";
import { getStatusBadge } from "./BuildsUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState as useToastState } from "@/hooks/use-toast";

interface BuildDetailsDialogProps {
  run: WorkflowRun;
  open: boolean;
  onClose: () => void;
}

const BuildDetailsDialog = ({ run, open, onClose }: BuildDetailsDialogProps) => {
  const [jobs, setJobs] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { toast } = useToastState();

  useEffect(() => {
    if (open) {
      const loadJobs = async () => {
        setLoading(true);
        setError(null);
        try {
          const jobsData = await fetchWorkflowJobs(run);
          setJobs(jobsData);
        } catch (err) {
          console.error("Error loading jobs:", err);
          setError("Failed to load job details. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      loadJobs();
    }
  }, [open, run]);

  const fetchLogs = async (jobIndex: number) => {
    if (jobIndex === activeJobIndex && jobs[jobIndex].logs) {
      // Logs already loaded
      return;
    }

    setActiveJobIndex(jobIndex);
    setLoadingLogs(true);
    
    try {
      const jobId = jobs[jobIndex].id;
      const logs = await fetchJobLogs(jobId);
      
      // Update the job with logs and parsed releases
      const parsedReleases = parseReleaseInfo(logs);
      
      setJobs(prevJobs => {
        const newJobs = [...prevJobs];
        newJobs[jobIndex] = {
          ...newJobs[jobIndex],
          logs,
          parsedReleases
        };
        return newJobs;
      });
    } catch (err) {
      console.error("Error loading job logs:", err);
      toast({
        title: "Error",
        description: "Failed to load job logs. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl h-[80vh] max-h-[800px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Workflow Run #{run.run_number}</span>
            {getStatusBadge(run.status, run.conclusion)}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4 overflow-x-auto flex-wrap">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Name</h3>
                    <p>{run.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Repository</h3>
                    <p>{run.repository}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Branch</h3>
                    <p>{run.branch}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Commit</h3>
                    <p>
                      {run.commit}{" "}
                      <span className="text-sm text-muted-foreground">
                        ({run.commit_message})
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Triggered By</h3>
                    <p>{run.actor}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Event</h3>
                    <p>{run.event}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Created</h3>
                    <p>{formatDate(run.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Updated</h3>
                    <p>{formatDate(run.updated_at)}</p>
                  </div>
                </div>
                
                {run.prs && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                      Pull Requests
                    </h3>
                    <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm whitespace-pre-wrap">
                      {run.prs}
                    </pre>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Links</h3>
                  <div className="flex gap-2">
                    <a 
                      href={run.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center"
                    >
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="jobs" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <div className="p-4 border border-destructive text-destructive rounded-md">
                  {error}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">No job information available</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {jobs.map((job, index) => (
                      <Badge
                        key={job.id}
                        variant={activeJobIndex === index ? "secondary" : "outline"}
                        className="cursor-pointer"
                        onClick={() => fetchLogs(index)}
                      >
                        {job.name}
                      </Badge>
                    ))}
                  </div>
                  
                  {jobs[activeJobIndex] && (
                    <JobDetails 
                      job={jobs[activeJobIndex]} 
                      loading={loadingLogs} 
                    />
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="artifacts" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Artifacts view is coming soon. For now, you can use the GitHub link to view artifacts.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BuildDetailsDialog;
