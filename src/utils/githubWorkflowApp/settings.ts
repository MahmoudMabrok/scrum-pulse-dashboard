
import { WorkflowSettings } from './types';
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
  return JSON.parse(savedSettings);
};
