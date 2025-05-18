
import { decrypt } from '../encryptionUtil';

export interface GithubSettings {
  token: string;
  organization: string;
  repository: string;
  baseUrl: string;
  teamMembers: string[];
}

/**
 * Retrieves GitHub settings from localStorage
 */
export const getStoredSettings = (): GithubSettings | null => {
  const settingsStr = localStorage.getItem('github_settings');
  if (!settingsStr) return null;
  
  const settings = JSON.parse(settingsStr);
  if (settings.token) {
    settings.token = decrypt(settings.token);
  }
  
  return settings;
};

/**
 * Fetches data from GitHub API with proper authentication
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<any> => {
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
