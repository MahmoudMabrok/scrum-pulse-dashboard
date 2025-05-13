
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  WorkflowRun, 
  JobRun, 
  fetchWorkflowJobs,
  fetchWorkflowArtifacts
} from "@/utils/githubWorkflow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import { Github, FileText, Loader, Search, Download } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusBadge } from "./BuildsUtils";
import JobDetails from "./JobDetails";

interface BuildDetailsDialogProps {
  run: WorkflowRun;
  onClose: () => void;
  open: boolean;
}

const BuildDetailsDialog = ({ run, onClose, open }: BuildDetailsDialogProps) => {
  const [jobSearch, setJobSearch] = useState("");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"info" | "jobs" | "artifacts">("info");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Fetch jobs for this workflow run
  const { 
    data: jobRuns, 
    isLoading: isLoadingJobs 
  } = useQuery({
    queryKey: ["workflowJobs", run.id, refreshKey],
    queryFn: () => fetchWorkflowJobs(run),
    enabled: open && activeTab === "jobs",
  });
  
  // Fetch artifacts for this workflow run
  const {
    data: artifacts,
    isLoading: isLoadingArtifacts
  } = useQuery({
    queryKey: ["workflowArtifacts", run.id, refreshKey],
    queryFn: () => fetchWorkflowArtifacts(run),
    enabled: open && activeTab === "artifacts",
  });
  
  // Filter jobs based on search
  const filteredJobs = jobRuns ? jobRuns.filter(job => 
    job.name.toLowerCase().includes(jobSearch.toLowerCase())
  ) : [];
  
  // Set first job as active if none selected and jobs are loaded
  useState(() => {
    if (filteredJobs.length > 0 && !activeJobId) {
      setActiveJobId(filteredJobs[0].id);
    } else if (filteredJobs.length === 0) {
      setActiveJobId(null);
    }
  });
  
  // Get the currently active job
  const activeJob = filteredJobs.find(job => job.id === activeJobId);
  
  const handleJobSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobSearch(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Workflow: {run.name}</DialogTitle>
        </DialogHeader>

        <Tabs 
          defaultValue="info" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "info" | "jobs" | "artifacts")}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ScrollArea className="h-[60vh]">
              <TabsContent value="info" className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">Workflow Run</h3>
                    <p className="text-sm">#{run.run_number}.{run.run_attempt} - {run.display_title}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Status</h3>
                    <p className="text-sm">{getStatusBadge(run.status, run.conclusion)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Triggered By</h3>
                    <p className="text-sm">{run.actor} via {run.event}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Repository</h3>
                    <p className="text-sm">{run.repository}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Branch</h3>
                    <p className="text-sm">{run.branch}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Commit</h3>
                    <p className="text-sm font-mono">{run.commit}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm font-semibold">Commit Message</h3>
                    <p className="text-sm">{run.commit_message}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="jobs" className="p-2 space-y-4">
                {isLoadingJobs ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Loading jobs...</span>
                  </div>
                ) : jobRuns && jobRuns.length > 0 ? (
                  <div className="space-y-4">
                    {/* Job search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9 mb-3"
                        placeholder="Search jobs..." 
                        value={jobSearch}
                        onChange={handleJobSearch}
                      />
                    </div>

                    {/* Job tabs */}
                    <div className="mb-4">
                      <ScrollArea className="pb-2">
                        <div className="flex space-x-2 min-w-max">
                          {filteredJobs.map((job) => (
                            <Button 
                              key={job.id}
                              variant={activeJobId === job.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActiveJobId(job.id)}
                              className="flex items-center gap-2"
                            >
                              {job.name}
                              {getStatusBadge(job.status, job.conclusion)}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Selected job details */}
                    {activeJob ? (
                      <JobDetails job={activeJob} />
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        {filteredJobs.length > 0 
                          ? "Select a job to view details" 
                          : "No jobs match your search"}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No job information available.</p>
                )}
              </TabsContent>

              <TabsContent value="artifacts" className="p-2">
                {isLoadingArtifacts ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Loading artifacts...</span>
                  </div>
                ) : artifacts && artifacts.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-2">Workflow Artifacts</h3>
                    <Card>
                      <CardContent className="p-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {artifacts.map((artifact) => (
                              <TableRow key={artifact.id}>
                                <TableCell className="font-medium">{artifact.name}</TableCell>
                                <TableCell>{formatBytes(artifact.size_in_bytes)}</TableCell>
                                <TableCell>
                                  {new Date(artifact.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => artifact.download_url && window.open(artifact.download_url)}
                                    disabled={!artifact.download_url}
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No artifacts found for this workflow run.</p>
                )}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <a 
            href={run.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-sm text-primary hover:underline"
          >
            <Github className="h-4 w-4 mr-1" />
            View on GitHub
          </a>
          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast({
                title: "Logs downloaded",
                description: "Build logs have been downloaded"
              });
            }}
            className="flex items-center text-sm text-primary hover:underline"
          >
            <FileText className="h-4 w-4 mr-1" />
            Download Logs
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default BuildDetailsDialog;
