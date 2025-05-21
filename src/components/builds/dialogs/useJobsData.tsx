
import { useState, useEffect } from "react";
import { WorkflowRun, JobRun } from "@/utils/githubWorkflowApp/types";
import { fetchWorkflowJobs, fetchJobLogs, parseReleaseInfo } from "@/utils/githubWorkflowApp";
import { useToast } from "@/hooks/use-toast";

export const useJobsData = (run: WorkflowRun, open: boolean) => {
  const [jobs, setJobs] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const loadJobs = async () => {
        setLoading(true);
        setError(null);
        try {
          const jobsData = await fetchWorkflowJobs(run);
          // Filter jobs that include "build-publish" in the title
          const filteredJobs = jobsData.filter(job =>
            job.name.toLowerCase().includes("build-publish")
          );
          setJobs(filteredJobs);

          // Fetch logs for all filtered jobs in parallel
          await Promise.all(filteredJobs.map(async (job, index) => {
            try {
              const logs = await fetchJobLogs(job.id);
              const parsedReleases = parseReleaseInfo(logs);

              setJobs(prevJobs => {
                const newJobs = [...prevJobs];
                newJobs[index] = {
                  ...newJobs[index],
                  logs,
                  parsedReleases
                };
                return newJobs;
              });
            } catch (err) {
              console.error(`Error loading logs for job ${job.id}:`, err);
            }
          }));

        } catch (err) {
          console.error("Error loading jobs:", err);
          setError("Failed to load job details. Please try again later.");
          toast({
            title: "Error",
            description: "Failed to load job details. Please try again later.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };

      loadJobs();
    }
  }, [open, run, toast]);

  return { jobs, loading, error, setJobs };
};
