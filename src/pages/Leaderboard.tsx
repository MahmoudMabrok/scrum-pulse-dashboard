
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchTeamData, TeamMember } from "@/utils/githubApi";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

// Helper function to generate leaderboard data directly from team data
const generateLeaderboardData = (teamData: TeamMember[]) => {
  return teamData.map((member) => ({
    login: member.login,
    totalPRs: member.prs.length,
    totalCommentsGiven: member.commentsGiven,
    totalApprovalsGiven: member.approvalsGiven,
  }));
};

const Leaderboard = () => {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<'totalPRs' | 'totalCommentsGiven' | 'totalApprovalsGiven'>('totalApprovalsGiven');

  // Use the same query as Dashboard to avoid duplicate API calls
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
        <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
        <LoadingSkeletons />
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
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

  // Generate leaderboard data directly from the team data
  const leaderboardData = generateLeaderboardData(teamData);
  
  // Sort the leaderboard data based on the selected sort field
  const sortedLeaderboardData = [...leaderboardData].sort((a, b) => b[sortField] - a[sortField]);

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Sort by:</p>
            <div className="flex gap-4">
              <button
                className={`px-3 py-1 rounded text-sm ${sortField === 'totalPRs' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                onClick={() => setSortField('totalPRs')}
              >
                PRs Created
              </button>
              <button
                className={`px-3 py-1 rounded text-sm ${sortField === 'totalCommentsGiven' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                onClick={() => setSortField('totalCommentsGiven')}
              >
                Comments Given
              </button>
              <button
                className={`px-3 py-1 rounded text-sm ${sortField === 'totalApprovalsGiven' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                onClick={() => setSortField('totalApprovalsGiven')}
              >
                Approvals Given
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Rank</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>PRs Created</TableHead>
                  <TableHead>Comments Given</TableHead>
                  <TableHead>Approvals Given</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeaderboardData.map((member, index) => (
                  <TableRow key={member.login}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{member.login}</TableCell>
                    <TableCell>{member.totalPRs}</TableCell>
                    <TableCell>{member.totalCommentsGiven}</TableCell>
                    <TableCell>{member.totalApprovalsGiven}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LoadingSkeletons = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

export default Leaderboard;
