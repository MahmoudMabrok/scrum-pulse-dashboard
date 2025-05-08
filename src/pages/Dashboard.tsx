
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchTeamData, TeamMember, PullRequest } from "@/utils/githubApi";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [hasSettings, setHasSettings] = useState(false);

  useEffect(() => {
    const settings = localStorage.getItem("github_settings");
    setHasSettings(!!settings);
  }, []);

  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ["teamData"],
    queryFn: fetchTeamData,
    enabled: hasSettings,
    onError: (err) => {
      toast({
        title: "Error fetching data",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  if (!hasSettings) {
    return (
      <div className="container mx-auto">
        <Alert>
          <AlertTitle>Settings Required</AlertTitle>
          <AlertDescription>
            Please configure your GitHub settings before using the dashboard.
            <a href="/settings" className="ml-2 text-blue-500 hover:underline">
              Go to Settings
            </a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-6">Team Pull Request Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="mb-3">
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between mt-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="container mx-auto">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load team data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl font-bold mb-6">Team Pull Request Activity</h2>
      
      {teamData.length === 0 ? (
        <Alert>
          <AlertTitle>No Team Members</AlertTitle>
          <AlertDescription>
            Please add team members in the settings to view their PR activity.
            <a href="/settings" className="ml-2 text-blue-500 hover:underline">
              Go to Settings
            </a>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamData.map((member) => (
            <Card key={member.login} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>{member.login}</CardTitle>
                <CardDescription>
                  {member.prs.length} recent pull requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {member.prs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No recent PRs found</p>
                ) : (
                  member.prs.map((pr) => (
                    <PullRequestItem key={pr.id} pr={pr} />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const PullRequestItem = ({ pr }: { pr: PullRequest }) => {
  let statusColor = "";
  switch (pr.status) {
    case "open":
      statusColor = "bg-github-open text-white";
      break;
    case "merged":
      statusColor = "bg-github-merged text-white";
      break;
    case "closed":
      statusColor = "bg-github-closed text-white";
      break;
  }

  return (
    <div className="mb-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
      <a 
        href={pr.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-sm font-medium hover:underline"
      >
        {pr.title}
      </a>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColor}>
            {pr.status}
          </Badge>
          <span>#{pr.number}</span>
        </div>
        <div className="flex items-center gap-2">
          <span title="Comments">{pr.comments} 💬</span>
          <span title="Approvals">{pr.approvals} ✅</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
