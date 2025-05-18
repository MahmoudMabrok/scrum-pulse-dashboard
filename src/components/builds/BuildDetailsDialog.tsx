
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
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { format } from "date-fns";

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

  const copyReleaseInfo = (job: JobRun) => {
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
            {/* Pull Requests Section */}
            {run.prs && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Pull Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <HoverCard>
                    <HoverCardTrigger>
                      <span className="underline decoration-dotted cursor-help">
                        {run.prs}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p>Pull request numbers associated with this workflow run</p>
                    </HoverCardContent>
                  </HoverCard>
                </CardContent>
              </Card>
            )}

            {/* Jobs Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Build Jobs</h3>
                {!loading && <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyAllReleaseInfo()}
                  title="Copy release information"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy</span>
                </Button>
                }
              </div>


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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyReleaseInfo(job)}
                              title="Copy release information"
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy</span>
                            </Button>
                            {getStatusBadge(job.status, job.conclusion)}
                          </div>
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
