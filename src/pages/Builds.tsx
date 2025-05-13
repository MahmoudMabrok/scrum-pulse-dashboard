
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Info, 
  Loader, 
  RefreshCcw, 
  Search, 
  X,
  FileText,
  Github
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchWorkflowRuns, fetchWorkflowJobs, WorkflowRun, JobRun } from "@/utils/githubWorkflow";
import { useToast } from "@/components/ui/use-toast";

const Builds = () => {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refetch with loading state
  const { toast } = useToast();
  
  // Get workflow settings from localStorage
  const getWorkflowSettings = () => {
    const savedSettings = localStorage.getItem('workflow_settings');
    if (!savedSettings) {
      return { workflowIds: [] };
    }
    return JSON.parse(savedSettings);
  };
  
  const workflowSettings = getWorkflowSettings();
  
  // Set initial active workflow ID when component mounts
  useEffect(() => {
    if (workflowSettings.workflowIds.length > 0 && !activeWorkflowId) {
      setActiveWorkflowId(workflowSettings.workflowIds[0]);
    }
  }, []);
  
  const { 
    data: workflowRuns, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["workflowRuns", searchQuery, activeWorkflowId, refreshKey],
    queryFn: () => fetchWorkflowRuns(searchQuery, activeWorkflowId),
    enabled: !!activeWorkflowId,
  });
  
  const { 
    data: jobRuns, 
    isLoading: isLoadingJobs 
  } = useQuery({
    queryKey: ["workflowJobs", selectedRun?.id, refreshKey],
    queryFn: () => selectedRun ? fetchWorkflowJobs(selectedRun) : Promise.resolve([]),
    enabled: !!selectedRun,
  });
  
  const handleSearch = () => {
    setSearchQuery(search);
  };
  
  const handleClearSearch = () => {
    setSearch("");
    setSearchQuery("");
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // Increment to trigger refetch with loading state
    toast({
      title: "Refreshing data",
      description: "Fetching the latest workflow information"
    });
  };
  
  const handleTabChange = (workflowId: string) => {
    setActiveWorkflowId(workflowId);
    setSelectedRun(null); // Clear selected run when changing tabs
  };
  
  const getStatusBadge = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") {
        return <Badge variant="green">Success</Badge>;
      } else if (conclusion === "failure" || conclusion === "cancelled") {
        return <Badge variant="red">{conclusion}</Badge>;
      } else {
        return <Badge variant="outline">{conclusion}</Badge>;
      }
    } else if (status === "in_progress") {
      return <Badge variant="yellow">In Progress</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Component to display build logs with step details
  const BuildLogs = ({ job }: { job: JobRun }) => {
    return (
      <div className="space-y-2 bg-muted/30 p-2 rounded-md">
        <h4 className="text-sm font-semibold">Job Logs</h4>
        {job.steps.map((step) => (
          <div key={step.number} className="border-l-2 pl-2 py-1 text-sm" 
            style={{ 
              borderColor: 
                step.conclusion === "success" ? "green" : 
                step.conclusion === "failure" ? "red" : 
                "gray" 
            }}
          >
            <div className="flex justify-between">
              <div>
                <span className="font-mono text-xs">[{step.number}]</span> {step.name}
              </div>
              {getStatusBadge(step.status, step.conclusion)}
            </div>
            {step.conclusion === "failure" && (
              <div className="mt-1 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-1.5 rounded">
                <p className="font-semibold">Error detected</p>
                <p>Step failed. Check GitHub for detailed error logs.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  if (workflowSettings.workflowIds.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Workflow Builds</h2>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>No Workflows Configured</AlertTitle>
          <AlertDescription>
            You haven't added any workflow IDs yet. Please go to Settings and add workflow IDs to track GitHub Actions builds.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Workflow Builds</h2>
        <Button onClick={handleRefresh} size="sm" variant="outline">
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Refreshing
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      <Tabs value={activeWorkflowId || ""} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="mb-4">
          {workflowSettings.workflowIds.map((id) => (
            <TabsTrigger key={id} value={id}>
              Workflow {id}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {workflowSettings.workflowIds.map((workflowId) => (
          <TabsContent key={workflowId} value={workflowId}>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  placeholder="Search builds by name, branch, commit, status..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
                {search && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
            
            {isLoading ? (
              <LoadingSkeletons />
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>
                  <p>Failed to load workflow data. Please check your GitHub settings and ensure your token has the correct permissions.</p>
                  <p className="mt-2 text-muted-foreground">Error: {(error as Error).message || "Unknown error"}</p>
                </AlertDescription>
              </Alert>
            ) : !workflowRuns || workflowRuns.length === 0 ? (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>No Workflow Data</AlertTitle>
                <AlertDescription>
                  No workflow runs found for this workflow ID. Please verify the workflow ID is correct or try a different one.
                </AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Workflow Runs</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workflow</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Commit</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Created</TableHead>
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
                          <TableCell>{run.branch}</TableCell>
                          <TableCell>
                            <div className="font-mono text-xs">{run.commit}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {run.commit_message}
                            </div>
                          </TableCell>
                          <TableCell>{run.actor}</TableCell>
                          <TableCell>
                            <div>{new Date(run.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(run.created_at).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedRun(run)}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Workflow Details: {run.name}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                                    <div className="col-span-2">
                                      <h3 className="text-sm font-semibold">Commit Message</h3>
                                      <p className="text-sm">{run.commit_message}</p>
                                    </div>
                                  </div>
                                  
                                  <h3 className="font-semibold mb-2">Jobs</h3>
                                  {isLoadingJobs ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Loader className="h-4 w-4 animate-spin" />
                                      <span>Loading jobs...</span>
                                    </div>
                                  ) : jobRuns && jobRuns.length > 0 ? (
                                    <div className="space-y-4">
                                      {jobRuns.map((job) => (
                                        <Card key={job.id} className="overflow-hidden">
                                          <CardHeader className="py-3">
                                            <div className="flex items-center justify-between">
                                              <CardTitle className="text-base">{job.name}</CardTitle>
                                              {getStatusBadge(job.status, job.conclusion)}
                                            </div>
                                          </CardHeader>
                                          <CardContent className="py-2">
                                            <Tabs defaultValue="steps">
                                              <TabsList>
                                                <TabsTrigger value="steps">Steps</TabsTrigger>
                                                <TabsTrigger value="logs">Logs</TabsTrigger>
                                              </TabsList>
                                              <TabsContent value="steps">
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead className="w-12">#</TableHead>
                                                      <TableHead>Step</TableHead>
                                                      <TableHead className="text-right">Status</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {job.steps.map((step) => (
                                                      <TableRow key={step.number}>
                                                        <TableCell>{step.number}</TableCell>
                                                        <TableCell>{step.name}</TableCell>
                                                        <TableCell className="text-right">
                                                          {getStatusBadge(step.status, step.conclusion)}
                                                        </TableCell>
                                                      </TableRow>
                                                    ))}
                                                  </TableBody>
                                                </Table>
                                              </TabsContent>
                                              <TabsContent value="logs">
                                                <ScrollArea className="h-[300px] rounded-md border p-4">
                                                  <BuildLogs job={job} />
                                                </ScrollArea>
                                              </TabsContent>
                                            </Tabs>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">No job information available.</p>
                                  )}
                                  
                                  <div className="mt-4 flex justify-center space-x-4">
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
                                        // Implementation would depend on GitHub API
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
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const LoadingSkeletons = () => (
  <div className="space-y-4">
    <div className="flex gap-2 mb-6">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-20" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Builds;

