
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Info, 
  Loader, 
  RefreshCcw,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchWorkflowRuns, WorkflowConfig, WorkflowRun } from "@/utils/githubWorkflowApp";
import { getWorkflowSettings } from "@/utils/githubWorkflowApp/settings";
import { useToast } from "@/hooks/use-toast";
import LoadingSkeletons from "@/components/builds/LoadingSkeletons";
import BuildList from "@/components/builds/BuildList";
import BuildPagination from "@/components/builds/BuildPagination";
import BuildsFilters from "@/components/builds/BuildsFilters";
import { useIsMobile } from "@/hooks/use-mobile";

const Builds = () => {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [filteredRuns, setFilteredRuns] = useState<WorkflowRun[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const workflowSettings = getWorkflowSettings();
  const activeWorkflow = workflowSettings.workflowIds.find(wf => wf.id === activeWorkflowId) || null;
  
  // Set initial active workflow ID and page size when component mounts
  useEffect(() => {
    if (workflowSettings.workflowIds.length > 0 && !activeWorkflowId) {
      setActiveWorkflowId(workflowSettings.workflowIds[0].id);
      if (workflowSettings.workflowIds[0].pageSize) {
        setPageSize(workflowSettings.workflowIds[0].pageSize);
      }
    }
  }, [workflowSettings.workflowIds]);

  // Update page size when active workflow changes
  useEffect(() => {
    if (activeWorkflow && activeWorkflow.pageSize) {
      setPageSize(activeWorkflow.pageSize);
    }
  }, [activeWorkflow]);
  
  const { 
    data: workflowRuns, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["workflowRuns", activeWorkflowId, currentPage, pageSize, refreshKey],
    queryFn: () => fetchWorkflowRuns(
      search, 
      activeWorkflowId,
      {
        page: currentPage,
        per_page: pageSize
      }
    ),
    enabled: !!activeWorkflowId,
  });

  // Apply local filters whenever runs data changes or filters change
  useEffect(() => {
    if (!workflowRuns) {
      setFilteredRuns(null);
      return;
    }
    
    let results = [...workflowRuns];
    
    // Apply branch filter locally
    if (branch) {
      results = results.filter(run => 
        run.branch.toLowerCase().includes(branch.toLowerCase())
      );
    }
    
    // Apply search filter locally
    if (search) {
      results = results.filter(run => 
        run.prs?.toLowerCase().includes(search.toLowerCase()) || 
        run.name.toLowerCase().includes(search.toLowerCase()) || 
        run.commit_message.toLowerCase().includes(search.toLowerCase()) ||
        String(run.id).includes(search)
      );
    }
    
    setFilteredRuns(results);
  }, [workflowRuns, branch, search]);
  
  const handleSearch = () => {
    // Local search is already handled in the useEffect above
    console.log("Search applied:", search);
  };
  
  const handleClearFilters = () => {
    setSearch("");
    setBranch("");
    setFilteredRuns(workflowRuns);
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
    setCurrentPage(1); // Reset to first page when changing workflows
    setBranch(""); // Clear branch filter
    setSearch(""); // Clear search filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    refetch();
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
    refetch();
  };
  
  // Estimate total pages based on the current page size and data
  useEffect(() => {
    if (workflowRuns && workflowRuns.length === pageSize) {
      // If we have a full page of results, there might be more pages
      setTotalPages(Math.max(currentPage + 1, totalPages));
    } else if (workflowRuns && workflowRuns.length === 0 && currentPage > 1) {
      // If we have no results and we're not on page 1, we've gone too far
      setTotalPages(currentPage - 1);
    } else if (workflowRuns && workflowRuns.length < pageSize && currentPage === 1) {
      // If we have less than a full page of results on page 1, there's only 1 page
      setTotalPages(1);
    }
  }, [workflowRuns, currentPage, pageSize]);
  
  if (workflowSettings.workflowIds.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-6">
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
  
  // Use the filtered runs if available, otherwise use the original workflow runs
  const displayRuns = filteredRuns || workflowRuns;
  
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
            {workflowSettings.workflowIds.map((workflow) => (
              <TabsTrigger key={workflow.id} value={workflow.id}>
                {workflow.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {workflowSettings.workflowIds.map((workflow) => (
          <TabsContent key={workflow.id} value={workflow.id}>
            <div className="mb-6">
              <BuildsFilters
                search={search}
                branch={branch}
                onSearchChange={setSearch}
                onBranchChange={setBranch}
                onSearch={handleSearch}
                onClear={handleClearFilters}
              />
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
            ) : !displayRuns || displayRuns.length === 0 ? (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>No Workflow Data</AlertTitle>
                <AlertDescription>
                  {branch || search ? 
                    "No workflow runs found matching your filters. Try adjusting your search criteria." :
                    "No workflow runs found for this workflow ID. Please verify the workflow ID is correct or try a different one."
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {branch ? `Builds for branch: ${branch}` : 'Latest Workflow Runs'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BuildList workflowRuns={displayRuns} />
                  
                  {/* Only show pagination if we have runs or are on a page > 1 */}
                  {(workflowRuns && (workflowRuns.length > 0 || currentPage > 1)) && (
                    <BuildPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  )}
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
