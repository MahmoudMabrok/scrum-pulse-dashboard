
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
  author: string;  // Added to track who wrote the comment
  prAuthor: string; // Added to track who owns the PR
}

export interface TeamMember {
  login: string;
  prs: PullRequest[];
  commentsGiven: number;
  commentsReceived: number; // Added field for tracking received comments
  approvalsGiven: number;
  reviewDetails?: ReviewDetail[];
  commentDetails?: CommentDetail[];
  commentsFromOthers?: CommentDetail[]; // Added to store comments received from others
  lastApprovalDate?: string; // Added to track last approval date
  averageReviewTime?: number; // Added to track average review time (in hours)
}

export interface LeaderboardItem {
  login: string;
  totalPRs: number;
  totalCommentsGiven: number;
  totalApprovalsGiven: number;
  commentsReceived: number;
  averageReviewTime?: number;
  lastApprovalDate?: string;
}

export interface PRInfo {
  number: string;
  title: string;
}
