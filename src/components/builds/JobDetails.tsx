
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobRun } from "@/utils/githubWorkflowApp/types";
import { getStatusBadge } from "./BuildsUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface JobDetailsProps {
  job: JobRun;
  loading?: boolean;
}

const JobDetails = ({ job, loading = false }: JobDetailsProps) => {
  return (
    <Card className="overflow-hidden">
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
            <TabsTrigger value="releases">Releases</TabsTrigger>
          </TabsList>
          <TabsContent value="steps">
            <div className="max-h-[50vh] overflow-auto">
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
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <BuildLogs job={job} />
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="releases">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : job.parsedReleases && job.parsedReleases.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Release Information</h3>
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
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No release information available for this job
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Component to display build logs with step details
const BuildLogs = ({ job }: { job: JobRun }) => {
  if (!job.logs) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Click on the job to load logs
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
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
      
      <div className="bg-black text-green-400 font-mono text-xs p-4 rounded overflow-x-auto">
        <pre className="whitespace-pre-wrap">{job.logs}</pre>
      </div>
    </div>
  );
};

export default JobDetails;
