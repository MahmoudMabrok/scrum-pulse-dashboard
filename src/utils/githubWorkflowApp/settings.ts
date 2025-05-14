
import { WorkflowSettings, WorkflowConfig } from './types';
import { decrypt } from '../encryptionUtil';

export const getStoredSettings = () => {
  const settingsStr = localStorage.getItem('github_settings');
  if (!settingsStr) return null;
  
  const settings = JSON.parse(settingsStr);
  if (settings.token) {
    settings.token = decrypt(settings.token);
  }
  
  return settings;
};

export const getWorkflowSettings = (): WorkflowSettings => {
  const savedSettings = localStorage.getItem('workflow_settings');
  if (!savedSettings) {
    return { workflowIds: [] };
  }
  
  const settings = JSON.parse(savedSettings);
  
  // Handle migration from old format to new format
  if (settings.workflowIds && Array.isArray(settings.workflowIds) && 
      settings.workflowIds.length > 0 && typeof settings.workflowIds[0] === 'string') {
    // Convert old format (array of strings) to new format (array of objects)
    settings.workflowIds = settings.workflowIds.map((id: string) => ({
      id,
      name: `Workflow ${id}`,
      pageSize: 10
    }));
    
    // Save the migrated settings
    localStorage.setItem('workflow_settings', JSON.stringify(settings));
  }
  
  return settings;
};

export const saveWorkflowSettings = (settings: WorkflowSettings): void => {
  localStorage.setItem('workflow_settings', JSON.stringify(settings));
};

export const addWorkflow = (workflow: WorkflowConfig): void => {
  const settings = getWorkflowSettings();
  settings.workflowIds.push(workflow);
  saveWorkflowSettings(settings);
};

export const updateWorkflow = (updatedWorkflow: WorkflowConfig): void => {
  const settings = getWorkflowSettings();
  const index = settings.workflowIds.findIndex(wf => wf.id === updatedWorkflow.id);
  
  if (index !== -1) {
    settings.workflowIds[index] = updatedWorkflow;
    saveWorkflowSettings(settings);
  }
};

export const deleteWorkflow = (workflowId: string): void => {
  const settings = getWorkflowSettings();
  settings.workflowIds = settings.workflowIds.filter(wf => wf.id !== workflowId);
  saveWorkflowSettings(settings);
};
