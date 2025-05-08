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

const Leaderboard = () => {
  const { toast } = useToast();

  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ["teamData"],
    queryFn: fetchTeamData,
    retry: 1,
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
        <div className="text-center my-12">Loading leaderboard data...</div>
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

export default Leaderboard;
