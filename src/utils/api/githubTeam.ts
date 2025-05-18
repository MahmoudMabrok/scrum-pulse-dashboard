
import { fetchWithAuth, getStoredSettings } from './githubAuth';
import { TeamMember, PullRequest } from './githubDataTypes';
import { fetchPullRequestsForUser, extractReviewDetails, extractCommentDetails } from './githubPRs';
import { DateFilter } from './githubDateFilters';

/**
 * Fetches data for all team members
 */
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
            
            teamData[memberIndex].reviewDetails.push(
              extractReviewDetails(pr, review, reviewer)
            );
          }
          
          // Count comments in reviews
          if (review.body && review.body.trim().length > 0 && review.state === 'COMMENTED') {
            teamData[memberIndex].commentsGiven += 1;
            
            // Add detailed comment info
            if (!teamData[memberIndex].commentDetails) {
              teamData[memberIndex].commentDetails = [];
            }
            
            teamData[memberIndex].commentDetails.push(
              extractCommentDetails(pr, review, reviewer)
            );
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
          
          teamData[memberIndex].commentDetails.push(
            extractCommentDetails(pr, comment, commenter)
          );
        }
      }
    } catch (error) {
      console.error(`Error fetching reviews/comments for PR #${pr.number}:`, error);
    }
  }
  
  return teamData;
};

/**
 * Generates leaderboard data from team data
 */
export const generateLeaderboardData = (teamData: TeamMember[]) => {
  return teamData.map((member) => ({
    login: member.login,
    totalPRs: member.prs.length,
    totalCommentsGiven: member.commentsGiven,
    totalApprovalsGiven: member.approvalsGiven,
  }));
};
