
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateLeaderboard, fetchTeamData } from "@/utils/githubApi";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Leaderboard = () => {
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

  const leaderboardData = teamData ? generateLeaderboard(teamData) : [];

  if (!hasSettings) {
    return (
      <div className="container mx-auto">
        <Alert>
          <AlertTitle>Settings Required</AlertTitle>
          <AlertDescription>
            Please configure your GitHub settings before viewing the leaderboard.
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
        <h2 className="text-2xl font-bold mb-6">Team Leaderboard</h2>
        <p>Loading leaderboard data...</p>
      </div>
    );
  }

  if (error || !leaderboardData) {
    return (
      <div className="container mx-auto">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load leaderboard data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const chartData = leaderboardData.map(item => ({
    name: item.login,
    totalPRs: item.totalPRs,
    totalCommentsGiven: item.totalCommentsGiven,
    totalApprovalsGiven: item.totalApprovalsGiven
  }));

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl font-bold mb-6">Team Leaderboard</h2>
      
      {leaderboardData.length === 0 ? (
        <Alert>
          <AlertTitle>No Team Data</AlertTitle>
          <AlertDescription>
            Please add team members in the settings to view the leaderboard.
            <a href="/settings" className="ml-2 text-blue-500 hover:underline">
              Go to Settings
            </a>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Team Activity Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalPRs" name="Pull Requests" fill="#58a6ff" />
                    <Bar dataKey="totalCommentsGiven" name="Comments" fill="#f0883e" />
                    <Bar dataKey="totalApprovalsGiven" name="Approvals" fill="#2ea043" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Team Member</th>
                      <th className="text-right py-3 px-4">PRs</th>
                      <th className="text-right py-3 px-4">Comments</th>
                      <th className="text-right py-3 px-4">Approvals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((item) => (
                      <tr key={item.login} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{item.login}</td>
                        <td className="text-right py-3 px-4">{item.totalPRs}</td>
                        <td className="text-right py-3 px-4">{item.totalCommentsGiven}</td>
                        <td className="text-right py-3 px-4">{item.totalApprovalsGiven}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
