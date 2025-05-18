
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
import { Button } from "@/components/ui/button";
import { fetchTeamData, TeamMember, DateFilter, generateLeaderboardData } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Loader, AlertTriangle, Info, Calendar, MessageSquare, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import MemberDetailsDialog from "@/components/leaderboard/MemberDetailsDialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";

const Leaderboard = () => {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<'totalPRs' | 'totalCommentsGiven' | 'totalApprovalsGiven'>('totalApprovalsGiven');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  // Use the query with date filter parameter
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

  const handleMemberDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd-MM-yyyy");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Loader className="h-5 w-5 animate-spin" />
          <span>Loading leaderboard data...</span>
        </div>
        <LoadingSkeletons />
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
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
        <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No team members found. Please add team members in the settings to view the leaderboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Generate leaderboard data from the team data
  const leaderboardData = generateLeaderboardData(teamData);
  
  // Sort the leaderboard data based on the selected sort field
  const sortedLeaderboardData = [...leaderboardData].sort((a, b) => b[sortField] - a[sortField]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
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
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeaderboardData.map((member, index) => {
                  const teamMember = teamData.find(tm => tm.login === member.login);
                  return (
                    <TableRow key={member.login}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{member.login}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar size={16} className="text-muted-foreground" />
                          {member.totalPRs}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={16} className="text-muted-foreground" />
                          {member.totalCommentsGiven}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Check size={16} className="text-muted-foreground" />
                          {member.totalApprovalsGiven}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => teamMember && handleMemberDetails(teamMember)}
                          disabled={!teamMember}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MemberDetailsDialog 
        member={selectedMember} 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
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
