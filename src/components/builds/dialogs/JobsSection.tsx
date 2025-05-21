
import React from "react";
import { JobRun } from "@/utils/githubWorkflowApp/types";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import JobCard from "./JobCard";

interface JobsSectionProps {
  jobs: JobRun[];
  loading: boolean;
  error: string | null;
  onCopyReleaseInfo: (job: JobRun) => void;
  onCopyAllReleaseInfo: () => void;
}

const JobsSection = ({ 
  jobs, 
  loading, 
  error, 
  onCopyReleaseInfo,
  onCopyAllReleaseInfo 
}: JobsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Build Jobs</h3>
        {!loading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCopyAllReleaseInfo}
            title="Copy release information"
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy</span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <div className="p-4 border border-destructive text-destructive rounded-md">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No build-publish jobs found for this workflow run
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onCopyReleaseInfo={onCopyReleaseInfo} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsSection;
