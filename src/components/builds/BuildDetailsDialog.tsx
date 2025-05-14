import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkflowRun, JobRun } from "@/utils/githubWorkflowApp/types";
import { fetchWorkflowJobs, fetchJobLogs, parseReleaseInfo } from "@/utils/githubWorkflowApp";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { getStatusBadge } from "./BuildsUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface BuildDetailsDialogProps {
  run: WorkflowRun;
  open: boolean;
  onClose: () => void;
}

const BuildDetailsDialog = ({ run, open, onClose }: BuildDetailsDialogProps) => {
  const [jobs, setJobs] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const loadJobs = async () => {
        setLoading(true);
        setError(null);
        try {
          const jobsData = await fetchWorkflowJobs(run);
          // Filter jobs that include "build-publish" in the title
          const filteredJobs = jobsData.filter(job => 
            job.name.toLowerCase().includes("build-publish")
          );
          setJobs(filteredJobs);
          
          // Fetch logs for all filtered jobs in parallel
          await Promise.all(filteredJobs.map(async (job, index) => {
            try {
              const logs = await fetchJobLogs(job.id);
              const parsedReleases = parseReleaseInfo(logs);
              
              setJobs(prevJobs => {
                const newJobs = [...prevJobs];
                newJobs[index] = {
                  ...newJobs[index],
                  logs,
                  parsedReleases
                };
                return newJobs;
              });
            } catch (err) {
              console.error(`Error loading logs for job ${job.id}:`, err);
            }
          }));
          
        } catch (err) {
          console.error("Error loading jobs:", err);
          setError("Failed to load job details. Please try again later.");
          toast({
            title: "Error",
            description: "Failed to load job details. Please try again later.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };

      loadJobs();
    }
  }, [open, run, toast]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Workflow Run #{run.run_number}</span>
            {getStatusBadge(run.status, run.conclusion)}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-1">
            {/* Pull Requests Section */}
            {run.prs && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Pull Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm whitespace-pre-wrap">
                    {run.prs}
                  </pre>
                </CardContent>
              </Card>
            )}
            
            {/* Jobs Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Build Jobs</h3>
              
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : error ? (
                <div className="p-4 border border-destructive text-destructive rounded-md">
                  {error}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No build-publish jobs found for this workflow run
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                      <CardHeader className="py-3 bg-muted/30">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="text-base">{job.name}</CardTitle>
                          {getStatusBadge(job.status, job.conclusion)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {job.parsedReleases && job.parsedReleases.length > 0 ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            {job.parsedReleases.map((release, index) => (
                              <div 
                                key={index} 
                                className="border rounded-lg p-4 shadow-sm bg-card"
                              >
                                <div className="flex items-center mb-2">
                                  <span className="text-lg font-semibold">
                                    {release.type}
                                  </span>
                                  <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    Build {release.buildNumber}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Version: <span className="text-foreground font-medium">{release.version}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No release information available for this job
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BuildDetailsDialog;