
import { fetchWithAuth } from './api';
import { getStoredSettings, getWorkflowSettings } from './settings';
import { WorkflowRun, JobRun, WorkflowSettings } from './types';

export type { WorkflowRun, JobRun, WorkflowSettings };
export { getWorkflowSettings };

export const fetchWorkflowRuns = async (search: string = '', specificWorkflowId: string | null = null): Promise<WorkflowRun[]> => {
  const settings = getStoredSettings();
  if (!settings || !settings.organization || !settings.repository) {
    throw new Error('GitHub settings not configured');
  }
  
  const workflowSettings = getWorkflowSettings();
  if (!workflowSettings.workflowIds.length) {
    return [];
  }
  
  const allRuns: WorkflowRun[] = [];
  
  // If a specific workflow ID is provided, only fetch that one
  const workflowsToFetch = specificWorkflowId 
    ? [specificWorkflowId] 
    : workflowSettings.workflowIds;
  
  for (const workflowId of workflowsToFetch) {
    try {
      // For organization-wide settings
      let repoPath = settings.repository;
      if (repoPath === '*') {
        // If user selected all repos, we'll need to limit to a specific repo for workflow API
        repoPath = settings.organization;
      }
      
      const endpoint = `/repos/${settings.organization}/${repoPath}/actions/workflows/${workflowId}/runs?per_page=10`;
      const data = await fetchWithAuth(endpoint);
      
      if (data.workflow_runs && Array.isArray(data.workflow_runs)) {
        const runs = data.workflow_runs.map((run: any) => ({
          id: run.id,
          name: run.name,
          workflowId: run.workflow_id,
          conclusion: run.conclusion,
          status: run.status,
          created_at: run.created_at,
          updated_at: run.updated_at,
          html_url: run.html_url,
          run_number: run.run_number,
          run_attempt: run.run_attempt,
          display_title: run.display_title || run.name,
          event: run.event,
          repository: run.repository?.full_name || `${settings.organization}/${repoPath}`,
          branch: run.head_branch || 'unknown',
          commit: run.head_sha?.substring(0, 7) || 'unknown',
          commit_message: run.head_commit?.message || 'No commit message',
          actor: run.actor?.login || 'unknown',
          jobs_url: run.jobs_url
        }));
        
        allRuns.push(...runs);
      }
    } catch (error) {
      console.error(`Error fetching workflow ${workflowId}:`, error);
    }
  }
  
  // Sort runs by creation date (newest first)
  allRuns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  // Filter by search term if provided
  if (search && search.trim() !== '') {
    const searchLower = search.toLowerCase();
    return allRuns.filter(run => 
      run.name.toLowerCase().includes(searchLower) ||
      run.display_title.toLowerCase().includes(searchLower) ||
      run.actor.toLowerCase().includes(searchLower) ||
      run.branch.toLowerCase().includes(searchLower) ||
      run.commit.toLowerCase().includes(searchLower) ||
      run.commit_message.toLowerCase().includes(searchLower) ||
      run.repository.toLowerCase().includes(searchLower) ||
      run.status.toLowerCase().includes(searchLower) ||
      (run.conclusion && run.conclusion.toLowerCase().includes(searchLower))
    );
  }
  
  return allRuns;
};

export const fetchWorkflowJobs = async (run: WorkflowRun): Promise<JobRun[]> => {
  try {
    const data = await fetchWithAuth(run.jobs_url);
    
    if (data.jobs && Array.isArray(data.jobs)) {
      return data.jobs.map((job: any) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        started_at: job.started_at,
        completed_at: job.completed_at,
        steps: job.steps?.map((step: any) => ({
          name: step.name,
          status: step.status,
          conclusion: step.conclusion,
          number: step.number
        })) || []
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching jobs for run ${run.id}:`, error);
    return [];
  }
};
