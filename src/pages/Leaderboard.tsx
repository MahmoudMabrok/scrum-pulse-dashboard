
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
import { fetchTeamData, generateLeaderboard, TeamMember } from "@/utils/githubApi";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Leaderboard = () => {
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

  const leaderboardData = generateLeaderboard(teamData);

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
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
                {leaderboardData.sort((a, b) => b.totalPRs - a.totalPRs).map((member, index) => (
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
