
import React from "react";
import { JobRun, ReleaseInfo } from "@/utils/githubWorkflowApp/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStatusBadge } from "../BuildsUtils";
import { Copy } from "lucide-react";

interface JobCardProps {
  job: JobRun;
  onCopyReleaseInfo: (job: JobRun) => void;
}

const JobCard = ({ job, onCopyReleaseInfo }: JobCardProps) => {
  // Function to extract names from the job name
  const extractName = (message: string) => {
    const regex = /\(([^)]+)\)/;
    const match = message.match(regex);
    if (match && match[1]) {
      return match[1].split(",").map(name => name.trim());
    }
    return [];
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{job.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopyReleaseInfo(job)}
              title="Copy release information"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy</span>
            </Button>
            {getStatusBadge(job.status, job.conclusion)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {job.parsedReleases && job.parsedReleases.length > 0 ? (
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
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No release information available for this job
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCard;
