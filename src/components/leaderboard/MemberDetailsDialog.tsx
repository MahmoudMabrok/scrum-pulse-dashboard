
import React, { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Check } from "lucide-react";
import { TeamMember, ReviewDetail, CommentDetail } from "@/utils/githubApi";

interface MemberDetailsDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberDetailsDialog = ({
  member,
  open,
  onOpenChange,
}: MemberDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState("approvals");

  if (!member) return null;

  // Sort reviews by date descending
  const sortedReviews = [...(member.reviewDetails || [])].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  // Sort comments by date descending
  const sortedComments = [...(member.commentDetails || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Activity: {member.login}</DialogTitle>
          <DialogDescription>
            View detailed activity for this team member
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Check size={16} />
              <span>Approvals ({sortedReviews.length})</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span>Comments ({sortedComments.length})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="approvals" className="mt-4">
            {sortedReviews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>PR</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-muted-foreground" />
                          {format(new Date(review.submittedAt), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger>
                            <span className="underline decoration-dotted cursor-help">
                              #{review.prNumber}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent>
                            <p>{review.prTitle}</p>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>{review.repository}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={review.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View PR
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No approvals found for this member
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="mt-4">
            {sortedComments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>PR</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-muted-foreground" />
                          {format(new Date(comment.createdAt), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger>
                            <span className="underline decoration-dotted cursor-help">
                              #{comment.prNumber}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent>
                            <p>{comment.prTitle}</p>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[200px]" title={comment.body}>
                          {comment.body}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={comment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View PR
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No comments found for this member
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsDialog;
