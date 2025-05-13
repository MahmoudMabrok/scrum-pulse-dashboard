
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
  artifacts_url?: string;
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

export interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  download_url: string;
}
export interface ArtifactData {
  prs: string
}