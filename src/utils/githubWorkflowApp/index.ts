import { extractReleaseNotesFromZip } from '../zip';
import { fetchWithAuth } from './api';
import { getStoredSettings, getWorkflowSettings } from './settings';
import { WorkflowRun, JobRun, WorkflowSettings, WorkflowConfig, Artifact, ArtifactData, FetchParams, ReleaseInfo } from './types';

export type { WorkflowRun, JobRun, WorkflowSettings, WorkflowConfig, Artifact, FetchParams };
export { getWorkflowSettings };

const getFullRepoPath = async () => {
  const settings = getStoredSettings();
  if (!settings || !settings.organization || !settings.repository) {
    throw new Error('GitHub settings not configured');
  }
  
  let repoPath = settings.repository;
  if (repoPath === '*') {
    // If user selected all repos, we'll need to limit to a specific repo for workflow API
    repoPath = settings.organization;
  }
  
  return `${settings.organization}/${repoPath}`;
}

export const fetchWorkflowRuns = async (
  search: string = '', 
  specificWorkflowId: string | null = null,
  params: FetchParams = {}
): Promise<WorkflowRun[]> => {
  const settings = getStoredSettings();
  if (!settings || !settings.organization || !settings.repository) {
    throw new Error('GitHub settings not configured');
  }
  
  const workflowSettings = getWorkflowSettings();
  if (!workflowSettings.workflowIds.length) {
    return [];
  }
  
  const allRuns: WorkflowRun[] = [];

  const repoPath = await getFullRepoPath();
  
  // If a specific workflow ID is provided, only fetch that one
  const workflowsToFetch = specificWorkflowId 
    ? workflowSettings.workflowIds.filter(wf => wf.id === specificWorkflowId)
    : workflowSettings.workflowIds;
  
  if (workflowsToFetch.length === 0) {
    return [];
  }
  
  for (const workflow of workflowsToFetch) {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Set page size from workflow config or params
      const pageSize = params.per_page || workflow.pageSize || 10;
      queryParams.set('per_page', pageSize.toString());
      
      // Set page number if provided
      if (params.page) {
        queryParams.set('page', params.page.toString());
      }
      
      // Set branch filter if provided
      if (params.branch) {
        queryParams.set('branch', params.branch);
      }
      
      const endpoint = `/repos/${repoPath}/actions/workflows/${workflow.id}/runs?${queryParams.toString()}`;
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
          repository: run.repository?.full_name || `${repoPath}`,
          branch: run.head_branch || 'unknown',
          commit: run.head_sha?.substring(0, 7) || 'unknown',
          commit_message: run.head_commit?.message || 'No commit message',
          actor: run.actor?.login || 'unknown',
          jobs_url: run.jobs_url,
          artifacts_url: run.artifacts_url
        }));
        
        allRuns.push(...runs);
      }
    } catch (error) {
      console.error(`Error fetching workflow ${workflow.id}:`, error);
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
      (run.conclusion && run.conclusion.toLowerCase().includes(searchLower)) ||
      (run.prs && run.prs.toLowerCase().includes(searchLower))
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

export const fetchJobLogs = async (jobId: number): Promise<string> => {
  try {
    const settings = getStoredSettings();
    if (!settings || !settings.organization || !settings.repository) {
      throw new Error('GitHub settings not configured');
    }
    
    let repoPath = settings.repository;
    if (repoPath === '*') {
      repoPath = settings.organization;
    }
    
    const endpoint = `/repos/${settings.organization}/${repoPath}/actions/jobs/${jobId}/logs`;
    
    // We need raw text, not JSON
    const response = await fetch(`${settings.baseUrl || 'https://api.github.com'}${endpoint}`, {
      headers: {
        'Authorization': `token ${settings.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error fetching logs for job ${jobId}:`, error);
    return 'Failed to fetch logs.';
  }
};

export const parseReleaseInfo = (logs: string): ReleaseInfo[] => {
  const releases: ReleaseInfo[] = [];
  
  // Regex to match patterns like "Uploaded IPA successfully and created release 1.0.418-dev (720)"
  const ipaRegex = /Uploaded IPA successfully and created release ([\d.]+[^(]*) \((\d+)\)/i;
  const apkRegex = /Uploaded APK successfully and created release ([\d.]+[^(]*) \((\d+)\)/i;
  
  // Find all matches
  const ipaMatches = [...logs.matchAll(new RegExp(ipaRegex, 'gi'))];
  const apkMatches = [...logs.matchAll(new RegExp(apkRegex, 'gi'))];
  
  // Process IPA matches
  ipaMatches.forEach(match => {
    if (match[1] && match[2]) {
      releases.push({
        type: 'IPA',
        version: match[1].trim(),
        buildNumber: match[2].trim()
      });
    }
  });
  
  // Process APK matches
  apkMatches.forEach(match => {
    if (match[1] && match[2]) {
      releases.push({
        type: 'APK',
        version: match[1].trim(),
        buildNumber: match[2].trim()
      });
    }
  });
  
  return releases;
};

export const fetchWorkflowArtifacts = async (run: WorkflowRun): Promise<Artifact[]> => {
  try {
    if (!run.artifacts_url) {
      throw new Error('No artifacts URL available for this run');
    }
    
    const data = await fetchWithAuth(run.artifacts_url);
    
    if (data.artifacts && Array.isArray(data.artifacts)) {
      return data.artifacts.map((artifact: any) => ({
        id: artifact.id,
        name: artifact.name,
        size_in_bytes: artifact.size_in_bytes,
        archive_download_url: artifact.archive_download_url,
        expires_at: artifact.expires_at,
        created_at: artifact.created_at,
        updated_at: artifact.updated_at,
        download_url: artifact.archive_download_url
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching artifacts for run ${run.id}:`, error);
    return [];
  }
};

export const fetchWorkflowArtifactData = async (run: WorkflowRun): Promise<ArtifactData> => {
  console.log(`Fetching artifacts for run ${run.id}...`);

  const emptyResponse = {prs: ""};
  
  try {
    const repoPath = await getFullRepoPath();
  
    const data = await fetchWithAuth(`/repos/${repoPath}/actions/runs/${run.id}/artifacts`);

    console.log(`Fetched artifacts for run ${run.id}:`, data);

    if (data.artifacts && Array.isArray(data.artifacts) && data.artifacts.length > 0) {
      const releaseNotesArtifact = data.artifacts[0];
      
      if (!releaseNotesArtifact) {
        console.log(`No release notes artifact found for run ${run.id}`);
        return emptyResponse;
      }
      
      const zipUrl = releaseNotesArtifact.archive_download_url;
      console.log(`Artifact download URL: ${zipUrl}`);

      const settings = getStoredSettings();
      if (!settings || !settings.token) {
        throw new Error('GitHub token not configured');
      }

      const zipResponse = await fetch(zipUrl, {
        headers: {
          Authorization: `token ${settings.token}`
        }
      });
  
      if (!zipResponse.ok) {
        throw new Error(`Failed to download artifact: ${zipResponse.statusText}`);
      }

      const zipBuffer = await zipResponse.arrayBuffer();
      const releaseNotesData = await extractReleaseNotesFromZip(zipBuffer);

      console.log(`Parsed release notes data:`, releaseNotesData);
      return releaseNotesData;
    }
    
    return emptyResponse;
  } catch (error) {
    console.error(`Error fetching artifacts for run ${run.id}:`, error);
    return emptyResponse;
  }
};
