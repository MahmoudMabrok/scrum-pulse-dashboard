
import { decrypt } from './encryptionUtil';

export interface GithubSettings {
  token: string;
  organization: string;
  repository: string;
  baseUrl: string;
  teamMembers: string[];
}

export type DateFilter = 'all' | 'week' | 'two_weeks';

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
  dissmissed: number;
  repository: string;
  approvalUsers?: string[];
  dismissalUsers?: string[];
}

export interface ReviewDetail {
  id: number;
  prNumber: number;
  prTitle: string;
  repository: string;
  state: string;
  submittedAt: string;
  url: string;
}

export interface CommentDetail {
  id: number;
  prNumber: number;
  prTitle: string;
  repository: string;
  body: string;
  createdAt: string;
  url: string;
}

export interface TeamMember {
  login: string;
  prs: PullRequest[];
  commentsGiven: number;
  approvalsGiven: number;
  reviewDetails?: ReviewDetail[];
  commentDetails?: CommentDetail[];
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

const getDateFilterQuery = (filter: DateFilter): string => {
  if (filter === 'all') return '';
  
  const now = new Date();
  let daysAgo = filter === 'week' ? 7 : 14; // 7 days for 'week', 14 for 'two_weeks'
  
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - daysAgo);
  
  // Format as YYYY-MM-DD for GitHub's query syntax
  const formattedDate = pastDate.toISOString().split('T')[0];
  
  return ` updated:>=${formattedDate}`;
};

export const fetchPullRequestsForUser = async (username: string, dateFilter: DateFilter = 'all', limit = 10): Promise<PullRequest[]> => {
  const settings = getStoredSettings();
  if (!settings || !settings.organization || !settings.repository) {
    throw new Error('GitHub settings not configured');
  }
  
  // Adding date filter to the query
  let query = `repo:${settings.organization}/${settings.repository} author:${username}`;
  
  // If we're searching within an org instead of a specific repo
  if (settings.repository === '*') {
    query = `org:${settings.organization} author:${username}`;
  }
  
  // Add date filter if it's not 'all'
  query += getDateFilterQuery(dateFilter);
  
  const searchUrl = `/search/issues?q=${encodeURIComponent(query)}+is:pr&sort=updated&order=desc&per_page=${limit}`;
  const searchResults = await fetchWithAuth(searchUrl);
  
  const prs: PullRequest[] = [];
  
  for (const item of searchResults.items) {
    // Fetch PR details to get merged status
    const prUrl = item.pull_request.url;
    const prDetails = await fetchWithAuth(prUrl);
    
    // Fetch PR reviews using the correct endpoint
    const reviewsUrl = `/repos/${prDetails.base.repo.full_name}/pulls/${item.number}/reviews`;
    const reviews = await fetchWithAuth(reviewsUrl);
    
    // Fetch PR comments using the correct endpoint
    const commentsUrl = `/repos/${prDetails.base.repo.full_name}/pulls/${item.number}/comments`;
    const comments = await fetchWithAuth(commentsUrl);
    
    let status: 'open' | 'closed' | 'merged' = 'open';
    if (prDetails.merged) {
      status = 'merged';
    } else if (prDetails.state === 'closed') {
      status = 'closed';
    }
    
    // Count all APPROVED reviews and collect usernames
    const approvalUsers: string[] = [];
    const dismissalUsers: string[] = [];
    
    reviews.forEach((review: any) => {
      if (review.state === 'APPROVED') {
        approvalUsers.push(review.user.login);
      } else if (review.state === 'DISMISSED') {
        dismissalUsers.push(review.user.login);
      }
    });
    
    const approvals = approvalUsers.length;
    const dissmissed = dismissalUsers.length;
    
    // Count all comments (including review comments)
    const commentsCount = comments.length + reviews.filter((review: any) => 
      review.body && review.body.trim().length > 0 && review.state === 'COMMENTED'
    ).length;
    
    prs.push({
      id: item.id,
      number: item.number,
      title: item.title,
      url: item.html_url,
      author: item.user.login,
      status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      comments: commentsCount,
      approvals,
      dissmissed,
      repository: prDetails.base.repo.full_name,
      approvalUsers,
      dismissalUsers
    });
  }
  
  return prs;
};

export const fetchTeamData = async (dateFilter: DateFilter = 'all'): Promise<TeamMember[]> => {
  const settings = getStoredSettings();
  if (!settings || !settings.teamMembers || !settings.teamMembers.length) {
    return [];
  }
  
  const teamData: TeamMember[] = [];
  const allPRs: PullRequest[] = [];
  
  // Process each team member
  for (const username of settings.teamMembers) {
    try {
      const prs = await fetchPullRequestsForUser(username, dateFilter);
      allPRs.push(...prs);
      
      teamData.push({
        login: username,
        prs,
        commentsGiven: 0, // Will calculate after gathering all PRs
        approvalsGiven: 0, // Will calculate after gathering all PRs
        reviewDetails: [],
        commentDetails: [],
      });
    } catch (error) {
      console.error(`Error fetching data for ${username}:`, error);
      // Add the user with empty data
      teamData.push({
        login: username,
        prs: [],
        commentsGiven: 0,
        approvalsGiven: 0,
        reviewDetails: [],
        commentDetails: [],
      });
    }
  }

  // Fetch reviews data for all PRs to determine comments and approvals given by team members
  for (const pr of allPRs) {
    try {
      // Use the specific reviews endpoint for each PR
      const prReviewsUrl = `/repos/${pr.repository}/pulls/${pr.number}/reviews`;
      const reviews = await fetchWithAuth(prReviewsUrl);
      
      // Use the specific comments endpoint for each PR
      const prCommentsUrl = `/repos/${pr.repository}/pulls/${pr.number}/comments`;
      const comments = await fetchWithAuth(prCommentsUrl);
      
      // Update team members' stats based on who reviewed and commented
      for (const review of reviews) {
        const reviewer = review.user.login;
        const memberIndex = teamData.findIndex(member => member.login === reviewer);
        
        if (memberIndex !== -1) {
          // Count approvals
          if (review.state === 'APPROVED' || review.state === 'DISMISSED') {
            teamData[memberIndex].approvalsGiven += 1;
            
            // Add detailed review info
            if (!teamData[memberIndex].reviewDetails) {
              teamData[memberIndex].reviewDetails = [];
            }
            
            teamData[memberIndex].reviewDetails.push({
              id: review.id,
              prNumber: pr.number,
              prTitle: pr.title,
              repository: pr.repository,
              state: review.state,
              submittedAt: review.submitted_at,
              url: pr.url,
            });
          }
          
          // Count comments in reviews
          if (review.body && review.body.trim().length > 0 && review.state === 'COMMENTED') {
            teamData[memberIndex].commentsGiven += 1;
            
            // Add detailed comment info
            if (!teamData[memberIndex].commentDetails) {
              teamData[memberIndex].commentDetails = [];
            }
            
            teamData[memberIndex].commentDetails.push({
              id: review.id,
              prNumber: pr.number,
              prTitle: pr.title,
              repository: pr.repository,
              body: review.body,
              createdAt: review.submitted_at,
              url: pr.url,
            });
          }
        }
      }
      
      // Count PR comments
      for (const comment of comments) {
        const commenter = comment.user.login;
        const memberIndex = teamData.findIndex(member => member.login === commenter);
        
        if (memberIndex !== -1) {
          teamData[memberIndex].commentsGiven += 1;
          
          // Add detailed comment info
          if (!teamData[memberIndex].commentDetails) {
            teamData[memberIndex].commentDetails = [];
          }
          
          teamData[memberIndex].commentDetails.push({
            id: comment.id,
            prNumber: pr.number,
            prTitle: pr.title,
            repository: pr.repository,
            body: comment.body,
            createdAt: comment.created_at,
            url: pr.url,
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching reviews/comments for PR #${pr.number}:`, error);
    }
  }
  
  return teamData;
};
