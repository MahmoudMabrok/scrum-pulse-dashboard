
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

  // Parse the PR numbers from the string if prDetails is not provided
  const prNumbers = prDetails 
    ? prDetails.map(pr => pr.number) 
    : prs.split(', ');

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Pull Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {prDetails && Array.isArray(prDetails) ? (
            // If we have PR details, use them to show tooltips
            prDetails.map((pr) => (
              <TooltipProvider key={pr.number}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="cursor-help hover:bg-accent"
                    >
                      #{pr.number}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {pr.title}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))
          ) : (
            // Fallback to just showing PR numbers without tooltips if we don't have details
            prNumbers.map((prNumber, index) => (
              <Badge key={index} variant="outline">
                #{prNumber}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PRDetailsCard;
