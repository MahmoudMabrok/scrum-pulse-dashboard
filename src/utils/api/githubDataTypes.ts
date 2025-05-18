
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
