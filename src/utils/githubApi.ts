
import { decrypt } from './encryptionUtil';

export interface GithubSettings {
  token: string;
  organization: string;
  repository: string;
  baseUrl: string;
  teamMembers: string[];
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  url: string;
  author: string;
  status: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  comments: number;
  approvals: number;
  repository: string;
}

export interface TeamMember {
  login: string;
  prs: PullRequest[];
  commentsGiven: number;
  approvalsGiven: number;
}

export interface LeaderboardItem {
  login: string;
  totalPRs: number;
  totalCommentsGiven: number;
  totalApprovalsGiven: number;
}

const getStoredSettings = (): GithubSettings | null => {
  const settingsStr = localStorage.getItem('github_settings');
  if (!settingsStr) return null;
  
  const settings = JSON.parse(settingsStr);
  if (settings.token) {
    settings.token = decrypt(settings.token);
  }
  
  return settings;
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

export const fetchPullRequestsForUser = async (username: string, limit = 10): Promise<PullRequest[]> => {
  const settings = getStoredSettings();
  if (!settings || !settings.organization || !settings.repository) {
    throw new Error('GitHub settings not configured');
  }
  
  let query = `repo:${settings.organization}/${settings.repository} author:${username}`;
  
  // If we're searching within an org instead of a specific repo
  if (settings.repository === '*') {
    query = `org:${settings.organization} author:${username}`;
  }
  
  const searchUrl = `/search/issues?q=${encodeURIComponent(query)}+is:pr&sort=updated&order=desc&per_page=${limit}`;
  const searchResults = await fetchWithAuth(searchUrl);
  
  const prs: PullRequest[] = [];
  
  for (const item of searchResults.items) {
    // Fetch PR details to get merged status
    const prUrl = item.pull_request.url;
    const prDetails = await fetchWithAuth(prUrl);
    
    // Fetch PR reviews to count approvals
    const reviewsUrl = `${prUrl}/reviews`;
    const reviews = await fetchWithAuth(reviewsUrl);
    
    let status: 'open' | 'closed' | 'merged' = 'open';
    if (prDetails.merged) {
      status = 'merged';
    } else if (prDetails.state === 'closed') {
      status = 'closed';
    }
    
    // Count approvals (APPROVED reviews)
    const approvals = reviews.filter((review: any) => review.state === 'APPROVED').length;
    
    prs.push({
      id: item.id,
      number: item.number,
      title: item.title,
      url: item.html_url,
      author: item.user.login,
      status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      comments: item.comments,
      approvals,
      repository: prDetails.base.repo.full_name,
    });
  }
  
  return prs;
};

export const fetchTeamData = async (): Promise<TeamMember[]> => {
  const settings = getStoredSettings();
  if (!settings || !settings.teamMembers || !settings.teamMembers.length) {
    return [];
  }
  
  const teamData: TeamMember[] = [];
  const allPRs: PullRequest[] = [];
  
  // Process each team member
  for (const username of settings.teamMembers) {
    try {
      const prs = await fetchPullRequestsForUser(username);
      allPRs.push(...prs);
      
      teamData.push({
        login: username,
        prs,
        commentsGiven: 0, // Will calculate after gathering all PRs
        approvalsGiven: 0, // Will calculate after gathering all PRs
      });
    } catch (error) {
      console.error(`Error fetching data for ${username}:`, error);
      // Add the user with empty data
      teamData.push({
        login: username,
        prs: [],
        commentsGiven: 0,
        approvalsGiven: 0,
      });
    }
  }

  // Fetch reviews data for all PRs to determine comments and approvals given by team members
  for (const pr of allPRs) {
    try {
      // Get the reviews for this PR to calculate approvals given
      const prReviewsUrl = `/repos/${pr.repository}/pulls/${pr.number}/reviews`;
      const reviews = await fetchWithAuth(prReviewsUrl);
      
      // Get comments for this PR to calculate comments given
      const prCommentsUrl = `/repos/${pr.repository}/pulls/${pr.number}/comments`;
      const comments = await fetchWithAuth(prCommentsUrl);
      
      // Update team members' stats based on who reviewed and commented
      for (const review of reviews) {
        const reviewer = review.user.login;
        const memberIndex = teamData.findIndex(member => member.login === reviewer);
        
        if (memberIndex !== -1) {
          // Count this as an approval if the review state is APPROVED
          if (review.state === 'APPROVED') {
            teamData[memberIndex].approvalsGiven += 1;
          }
          
          // Count comments in reviews
          if (review.body && review.body.trim().length > 0) {
            teamData[memberIndex].commentsGiven += 1;
          }
        }
      }
      
      // Count normal PR comments
      for (const comment of comments) {
        const commenter = comment.user.login;
        const memberIndex = teamData.findIndex(member => member.login === commenter);
        
        if (memberIndex !== -1) {
          teamData[memberIndex].commentsGiven += 1;
        }
      }
    } catch (error) {
      console.error(`Error fetching reviews/comments for PR #${pr.number}:`, error);
    }
  }
  
  return teamData;
};

export const generateLeaderboard = (teamData: TeamMember[]): LeaderboardItem[] => {
  return teamData.map(member => ({
    login: member.login,
    totalPRs: member.prs.length,
    totalCommentsGiven: member.commentsGiven,
    totalApprovalsGiven: member.approvalsGiven,
  }));
};
