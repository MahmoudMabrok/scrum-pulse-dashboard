
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchWorkflowRuns } from "@/utils/githubWorkflow";
import { useToast } from "@/components/ui/use-toast";
import LoadingSkeletons from "@/components/builds/LoadingSkeletons";
import BuildList from "@/components/builds/BuildList";
import { useIsMobile } from "@/hooks/use-mobile";

const Builds = () => {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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
  
  const handleSearch = () => {
    setSearchQuery(search);
  };
  
  const handleClearSearch = () => {
    setSearch("");
    setSearchQuery("");
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest workflow information"
    });
  };
  
  const handleTabChange = (workflowId: string) => {
    setActiveWorkflowId(workflowId);
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
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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
        <div className="overflow-x-auto">
          <TabsList className="mb-4 inline-flex">
            {workflowSettings.workflowIds.map((id) => (
              <TabsTrigger key={id} value={id}>
                Workflow {id}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {workflowSettings.workflowIds.map((workflowId) => (
          <TabsContent key={workflowId} value={workflowId}>
            <div className="flex flex-col md:flex-row gap-2 mb-6">
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
                  <BuildList workflowRuns={workflowRuns} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Builds;
