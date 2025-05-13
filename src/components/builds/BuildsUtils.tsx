
import { Badge } from "@/components/ui/badge";
import React from "react";

export const getStatusBadge = (status: string, conclusion: string | null) => {
  if (status === "completed") {
    if (conclusion === "success") {
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">Success</Badge>;
    } else if (conclusion === "failure" || conclusion === "cancelled") {
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-600">{conclusion}</Badge>;
    } else {
      return <Badge variant="outline">{conclusion}</Badge>;
    }
  } else if (status === "in_progress") {
    return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-600">In Progress</Badge>;
  } else {
    return <Badge variant="outline">{status}</Badge>;
  }
};
