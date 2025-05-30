
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchTeamData, TeamMember, DateFilter } from "@/utils/githubApi";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

const Dashboard = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const { toast } = useToast();

  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ["teamData", dateFilter],
    queryFn: () => fetchTeamData(dateFilter),
    meta: {
      onError: () => {
        toast({
          title: "Error fetching team data",
          description: "Please check your settings and try again.",
          variant: "destructive",
        });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Loader className="h-5 w-5 animate-spin" />
          <span>Loading team data...</span>
        </div>
        <LoadingSkeletons />
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            <p>Failed to load team data. Please check your GitHub settings and ensure your token has the correct permissions.</p>
            <p className="mt-2 text-muted-foreground">Error: {error?.message || "Unknown error"}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (teamData.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No team members found. Please add team members in the settings to view their activity.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayMember = selectedMember 
    ? teamData.find(member => member.login === selectedMember)
    : teamData[0];
    
  const badgeVarient = (status: string) => {
    switch (status) {
      case "open":
        return "green";
      case "closed":
        return "red";
      case "merged":    
        return "purple";
      default:
        return "green";
    }
  };  

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time period:</span>
          <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="two_weeks">Last two weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue={displayMember?.login || teamData[0]?.login}>
        <TabsList className="mb-4">
          {teamData.map((member) => (
            <TabsTrigger 
              key={member.login} 
              value={member.login}
              onClick={() => setSelectedMember(member.login)}
            >
              {member.login}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {teamData.map((member) => (
          <TabsContent key={member.login} value={member.login}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pull Requests for {member.login}</CardTitle>
              </CardHeader>
              <CardContent>
                {member.prs.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Pull Requests</AlertTitle>
                    <AlertDescription>No pull requests found for this user.</AlertDescription>
                  </Alert>
                ) : (
                  <ul className="list-none space-y-2">
                    {member.prs.map((pr) => (
                      <li key={pr.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-1">
                          <a href={pr.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                            {pr.title}
                          </a>
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">#{pr.number}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant={badgeVarient(pr.status)}>{pr.status}</Badge> | Repository: {pr.repository}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(pr.created_at).toLocaleDateString()} | Updated: {new Date(pr.updated_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          Comments: {pr.comments} | 
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="inline-flex items-center">
                                Approvals: {pr.approvals}
                                {pr.approvalUsers && pr.approvalUsers.length > 0 && <span className="ml-1">👥</span>}
                              </TooltipTrigger>
                              {pr.approvalUsers && pr.approvalUsers.length > 0 && (
                                <TooltipContent>
                                  <p>Approvals by:</p>
                                  <ul className="list-disc pl-5">
                                    {pr.approvalUsers.map((user, idx) => (
                                      <li key={idx}>{user}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider> | 
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="inline-flex items-center">
                                Dismissed: {pr.dissmissed}
                                {pr.dismissalUsers && pr.dismissalUsers.length > 0 && <span className="ml-1">👥</span>}
                              </TooltipTrigger>
                              {pr.dismissalUsers && pr.dismissalUsers.length > 0 && (
                                <TooltipContent>
                                  <p>Dismissed by:</p>
                                  <ul className="list-disc pl-5">
                                    {pr.dismissalUsers.map((user, idx) => (
                                      <li key={idx}>{user}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const LoadingSkeletons = () => (
  <div className="space-y-4">
    <div className="flex space-x-2 mb-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-24" />
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </CardContent>
    </Card>
  </div>
);

export default Dashboard;
