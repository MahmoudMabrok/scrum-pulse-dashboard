
import React from "react";
import { PRInfo } from "@/utils/githubWorkflowApp/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface PRDetailsCardProps {
  prs: string;
  prDetails?: PRInfo[];
}

const PRDetailsCard = ({ prs, prDetails }: PRDetailsCardProps) => {
  // Create a mapping of PR numbers to their titles for tooltips
  const prTitleMap = new Map();
  if (prDetails && Array.isArray(prDetails)) {
    prDetails.forEach(pr => {
      prTitleMap.set(pr.number, pr.title);
    });
  }

  if (!prs) return null;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Pull Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {prDetails?.map(({title, number}) => (
            <TooltipProvider key={title}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="cursor-help hover:bg-accent"
                  >
                    #{number}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {title}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PRDetailsCard;
