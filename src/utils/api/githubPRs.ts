
import { fetchWithAuth, getStoredSettings } from './githubAuth';
import { PullRequest, ReviewDetail, CommentDetail } from './githubDataTypes';
import { DateFilter, getDateFilterQuery } from './githubDateFilters';

/**
 * Fetches pull requests for a specific GitHub user
 */
export const fetchPullRequestsForUser = async (
  username: string, 
  dateFilter: DateFilter = 'all', 
  limit = 10
): Promise<PullRequest[]> => {
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

/**
 * Extracts detailed review information for a team member
 */
export const extractReviewDetails = (
  pr: PullRequest,
  review: any,
  reviewer: string
): ReviewDetail => {
  return {
    id: review.id,
    prNumber: pr.number,
    prTitle: pr.title,
    repository: pr.repository,
    state: review.state,
    submittedAt: review.submitted_at,
    url: pr.url,
  };
};

/**
 * Extracts detailed comment information for a team member
 */
export const extractCommentDetails = (
  pr: PullRequest,
  comment: any,
  commenter: string
): CommentDetail => {
  return {
    id: comment.id,
    prNumber: pr.number,
    prTitle: pr.title,
    repository: pr.repository,
    body: comment.body || "",
    createdAt: comment.created_at || comment.submitted_at,
    url: pr.url,
  };
};
