
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchTeamData, TeamMember } from "@/utils/githubApi";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ["teamData"],
    queryFn: fetchTeamData,
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
        <LoadingSkeletons />
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <Card className="mb-6">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>Failed to load team data. Please check your GitHub settings and ensure your token has the correct permissions.</p>
            <p className="mt-2 text-muted-foreground">Error: {error?.message || "Unknown error"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayMember = selectedMember 
    ? teamData.find(member => member.login === selectedMember)
    : teamData[0];

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

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
                  <p>No pull requests found for this user.</p>
                ) : (
                  <ul className="list-none space-y-2">
                    {member.prs.map((pr) => (
                      <li key={pr.id} className="border rounded-md p-4">
                        <a href={pr.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                          {pr.title}
                        </a>
                        <p className="text-sm text-muted-foreground">
                          Status: <Badge variant="secondary">{pr.status}</Badge> | Repository: {pr.repository}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(pr.created_at).toLocaleDateString()} | Updated: {new Date(pr.updated_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Comments: {pr.comments} | Approvals: {pr.approvals}
                        </p>
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
