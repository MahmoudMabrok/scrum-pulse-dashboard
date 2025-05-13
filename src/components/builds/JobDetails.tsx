
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobRun } from "@/utils/githubWorkflow";
import { getStatusBadge } from "./BuildsUtils";

interface JobDetailsProps {
  job: JobRun;
}

const JobDetails = ({ job }: JobDetailsProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{job.name}</CardTitle>
          {getStatusBadge(job.status, job.conclusion)}
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <Tabs defaultValue="steps">
          <TabsList>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="steps">
            <div className="max-h-[50vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.steps.map((step) => (
                    <TableRow key={step.number}>
                      <TableCell>{step.number}</TableCell>
                      <TableCell>{step.name}</TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(step.status, step.conclusion)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <BuildLogs job={job} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Component to display build logs with step details
const BuildLogs = ({ job }: { job: JobRun }) => {
  return (
    <div className="space-y-2 bg-muted/30 p-2 rounded-md">
      <h4 className="text-sm font-semibold">Job Logs</h4>
      {job.steps.map((step) => (
        <div key={step.number} className="border-l-2 pl-2 py-1 text-sm" 
          style={{ 
            borderColor: 
              step.conclusion === "success" ? "green" : 
              step.conclusion === "failure" ? "red" : 
              "gray" 
          }}
        >
          <div className="flex justify-between">
            <div>
              <span className="font-mono text-xs">[{step.number}]</span> {step.name}
            </div>
            {getStatusBadge(step.status, step.conclusion)}
          </div>
          {step.conclusion === "failure" && (
            <div className="mt-1 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-1.5 rounded">
              <p className="font-semibold">Error detected</p>
              <p>Step failed. Check GitHub for detailed error logs.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default JobDetails;
