
import { decrypt } from './encryptionUtil';
import { fetchWorkflowArtifactData } from './githubWorkflowApp';

export interface WorkflowSettings {
  workflowIds: string[];
}

export interface WorkflowRun {
  id: number;
  name: string;
  workflowId: number;
  conclusion: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_number: number;
  run_attempt: number;
  display_title: string;
  event: string;
  repository: string;
  branch: string;
  commit: string;
  commit_message: string;
  actor: string;
  jobs_url: string;
  prs?: string;
}

export interface JobRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string;
  steps: JobStep[];
}

export interface JobStep {
  name: string;
  status: string;
  conclusion: string;
  number: number;
}

const getStoredSettings = () => {
  const settingsStr = localStorage.getItem('github_settings');
  if (!settingsStr) return null;
  
  const settings = JSON.parse(settingsStr);
  if (settings.token) {
    settings.token = decrypt(settings.token);
  }
  
  return settings;
};

const getWorkflowSettings = (): WorkflowSettings => {
  const savedSettings = localStorage.getItem('workflow_settings');
  if (!savedSettings) {
    return { workflowIds: [] };
  }
  return JSON.parse(savedSettings);
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const settings = getStoredSettings();
  if (!settings || !settings.token) {
    throw new Error('GitHub token not configured');
  }
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${settings.token}`,
    ...options.headers,
  };
  
  const baseUrl = settings.baseUrl || 'https://api.github.com';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
  }
  
  return response.json();
};

export const fetchWorkflowRuns = async ( specificWorkflowId: string | null = null): Promise<WorkflowRun[]> => {
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

      // For organization-wide settings
      let repoPath = settings.repository;
      if (repoPath === '*') {
        // If user selected all repos, we'll need to limit to a specific repo for workflow API
        repoPath = settings.organization;
      }


  for (const workflowId of workflowsToFetch) {
    try {
    
      
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

  // loop on runs run get prs into it 
  for (const run of allRuns) {
    try {
      const data = await fetchWorkflowArtifactData(run);
      if (data ) {
        run.prs = data.prs;
      }
    } catch (error) {
      console.error(`Error fetching PRs for run ${run.id}:`, error);
    }
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

