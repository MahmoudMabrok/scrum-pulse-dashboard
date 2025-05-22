
import { fetchWithAuth, getStoredSettings } from './githubAuth';
import { TeamMember, PullRequest } from './githubDataTypes';
import { fetchPullRequestsForUser, extractReviewDetails, extractCommentDetails } from './githubPRs';
import { DateFilter } from './githubDateFilters';
import { differenceInHours } from 'date-fns';

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
        commentsReceived: 0, // Will calculate after gathering all PRs
        approvalsGiven: 0, // Will calculate after gathering all PRs
        reviewDetails: [],
        commentDetails: [],
        commentsFromOthers: [],
      });
    } catch (error) {
      console.error(`Error fetching data for ${username}:`, error);
      // Add the user with empty data
      teamData.push({
        login: username,
        prs: [],
        commentsGiven: 0,
        commentsReceived: 0,
        approvalsGiven: 0,
        reviewDetails: [],
        commentDetails: [],
        commentsFromOthers: [],
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
          // Skip if the reviewer is the PR author (don't count comments on own PRs)
          if (reviewer === pr.author) {
            continue;
          }
          
          // Count approvals and track last approval date
          if (review.state === 'APPROVED' || review.state === 'DISMISSED') {
            teamData[memberIndex].approvalsGiven += 1;
            
            // Add detailed review info
            if (!teamData[memberIndex].reviewDetails) {
              teamData[memberIndex].reviewDetails = [];
            }
            
            const reviewDetails = extractReviewDetails(pr, review, reviewer);
            teamData[memberIndex].reviewDetails.push(reviewDetails);
            
            // Track last approval date
            if (review.state === 'APPROVED') {
              const approvalDate = new Date(review.submitted_at);
              if (!teamData[memberIndex].lastApprovalDate || 
                  new Date(teamData[memberIndex].lastApprovalDate) < approvalDate) {
                teamData[memberIndex].lastApprovalDate = review.submitted_at;
              }
            }
          }
          
          // Count comments in reviews (only if not commenting on own PR)
          if (review.body && review.body.trim().length > 0 && review.state === 'COMMENTED') {
            teamData[memberIndex].commentsGiven += 1;
            
            // Add detailed comment info
            if (!teamData[memberIndex].commentDetails) {
              teamData[memberIndex].commentDetails = [];
            }
            
            const commentDetail = extractCommentDetails(pr, review, reviewer);
            commentDetail.author = reviewer;
            commentDetail.prAuthor = pr.author;
            teamData[memberIndex].commentDetails.push(commentDetail);
            
            // Add this comment to the PR author's received comments
            const prAuthorIndex = teamData.findIndex(member => member.login === pr.author);
            if (prAuthorIndex !== -1) {
              if (!teamData[prAuthorIndex].commentsFromOthers) {
                teamData[prAuthorIndex].commentsFromOthers = [];
              }
              teamData[prAuthorIndex].commentsReceived += 1;
              teamData[prAuthorIndex].commentsFromOthers.push(commentDetail);
            }
          }
        }
      }
      
      // Count PR comments
      for (const comment of comments) {
        const commenter = comment.user.login;
        const memberIndex = teamData.findIndex(member => member.login === commenter);
        
        if (memberIndex !== -1) {
          // Skip if commenter is the PR author (don't count comments on own PRs)
          if (commenter === pr.author) {
            continue;
          }
          
          teamData[memberIndex].commentsGiven += 1;
          
          // Add detailed comment info
          if (!teamData[memberIndex].commentDetails) {
            teamData[memberIndex].commentDetails = [];
          }
          
          const commentDetail = extractCommentDetails(pr, comment, commenter);
          commentDetail.author = commenter;
          commentDetail.prAuthor = pr.author;
          teamData[memberIndex].commentDetails.push(commentDetail);
          
          // Add this comment to the PR author's received comments
          const prAuthorIndex = teamData.findIndex(member => member.login === pr.author);
          if (prAuthorIndex !== -1) {
            if (!teamData[prAuthorIndex].commentsFromOthers) {
              teamData[prAuthorIndex].commentsFromOthers = [];
            }
            teamData[prAuthorIndex].commentsReceived += 1;
            teamData[prAuthorIndex].commentsFromOthers.push(commentDetail);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching reviews/comments for PR #${pr.number}:`, error);
    }
  }
  
  // Calculate average review time for each team member
  for (const member of teamData) {
    if (member.reviewDetails && member.reviewDetails.length > 0) {
      let totalReviewTimeHours = 0;
      let reviewCount = 0;
      
      for (const review of member.reviewDetails) {
        // Find the corresponding PR to get creation date
        const pr = allPRs.find(p => 
          p.number === review.prNumber && 
          p.repository === review.repository
        );
        
        if (pr) {
          const prCreationDate = new Date(pr.created_at);
          const reviewSubmissionDate = new Date(review.submittedAt);
          const hoursTaken = differenceInHours(reviewSubmissionDate, prCreationDate);
          
          if (hoursTaken > 0) {
            totalReviewTimeHours += hoursTaken;
            reviewCount++;
          }
        }
      }
      
      if (reviewCount > 0) {
        member.averageReviewTime = Math.round(totalReviewTimeHours / reviewCount);
      }
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
    commentsReceived: member.commentsReceived,
    averageReviewTime: member.averageReviewTime,
    lastApprovalDate: member.lastApprovalDate,
  }));
};
