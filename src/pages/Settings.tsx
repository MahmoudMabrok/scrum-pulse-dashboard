
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { encrypt, decrypt } from "@/utils/encryptionUtil";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { WorkflowConfig } from "@/utils/githubWorkflowApp/types";
import WorkflowList from "@/components/settings/WorkflowList";
import { 
  addWorkflow, 
  updateWorkflow, 
  deleteWorkflow, 
  saveWorkflowSettings, 
  getWorkflowSettings 
} from "@/utils/githubWorkflowApp/settings";

interface Settings {
  token: string;
  baseUrl: string;
  organization: string;
  repository: string;
  teamMembers: string[];
}

const defaultSettings: Settings = {
  token: "",
  baseUrl: "https://api.github.com",
  organization: "",
  repository: "",
  teamMembers: [],
};

const Settings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [workflowSettings, setWorkflowSettings] = useState<{ workflowIds: WorkflowConfig[] }>({
    workflowIds: []
  });
  const [newTeamMember, setNewTeamMember] = useState("");
  const [githubType, setGithubType] = useState<"github" | "enterprise">("github");
  const [enterpriseDomain, setEnterpriseDomain] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings
    const storedSettings = localStorage.getItem("github_settings");
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      // Decrypt the token if it exists
      if (parsedSettings.token) {
        parsedSettings.token = decrypt(parsedSettings.token);
      }
      setSettings(parsedSettings);
      
      // Determine GitHub type from saved baseUrl
      if (parsedSettings.baseUrl && parsedSettings.baseUrl !== "https://api.github.com") {
        setGithubType("enterprise");
        // Extract domain from enterprise URL: https://DOMAIN/api/v3 -> DOMAIN
        const match = parsedSettings.baseUrl.match(/https:\/\/([^\/]+)\/api\/v3/);
        if (match && match[1]) {
          setEnterpriseDomain(match[1]);
        }
      }
    }

    // Load workflow settings
    const storedWorkflowSettings = getWorkflowSettings();
    setWorkflowSettings(storedWorkflowSettings);
  }, []);

  // Update the baseUrl whenever GitHub type or enterprise domain changes
  useEffect(() => {
    if (githubType === "github") {
      setSettings(prev => ({ ...prev, baseUrl: "https://api.github.com" }));
    } else if (githubType === "enterprise" && enterpriseDomain) {
      setSettings(prev => ({ ...prev, baseUrl: `https://${enterpriseDomain}/api/v3` }));
    }
  }, [githubType, enterpriseDomain]);

  const handleSaveSettings = () => {
    // Validate settings
    if (!settings.token) {
      toast({
        title: "Validation Error",
        description: "GitHub token is required",
        variant: "destructive",
      });
      return;
    }

    if (!settings.organization) {
      toast({
        title: "Validation Error",
        description: "GitHub organization is required",
        variant: "destructive",
      });
      return;
    }

    if (githubType === "enterprise" && !enterpriseDomain) {
      toast({
        title: "Validation Error",
        description: "Enterprise domain is required for GitHub Enterprise",
        variant: "destructive",
      });
      return;
    }

    // Save settings with encrypted token
    const settingsToSave = {
      ...settings,
      token: encrypt(settings.token),
    };
    
    localStorage.setItem("github_settings", JSON.stringify(settingsToSave));
    saveWorkflowSettings(workflowSettings);
    
    toast({
      title: "Settings Saved",
      description: "Your GitHub settings have been saved successfully",
    });
  };

  const handleAddTeamMember = () => {
    const membersToAdd = newTeamMember
      .split(",")
      .map((member) => member.trim())
      .filter((member) => member);

    if (membersToAdd.length === 0) return;

    const duplicateMembers = membersToAdd.filter((member) =>
      settings.teamMembers.includes(member)
    );

    if (duplicateMembers.length > 0) {
      toast({
        title: "Duplicate Member(s)",
        description: `The following member(s) are already in the list: ${duplicateMembers.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSettings({
      ...settings,
      teamMembers: [...settings.teamMembers, ...membersToAdd],
    });

    setNewTeamMember("");
  };

  const handleRemoveTeamMember = (member: string) => {
    setSettings({
      ...settings,
      teamMembers: settings.teamMembers.filter(m => m !== member),
    });
  };

  const handleAddWorkflow = (workflow: WorkflowConfig) => {
    // Check if the workflow ID already exists
    if (workflowSettings.workflowIds.some(w => w.id === workflow.id)) {
      toast({
        title: "Duplicate Workflow ID",
        description: "This workflow ID already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedWorkflows = {
      ...workflowSettings,
      workflowIds: [...workflowSettings.workflowIds, workflow]
    };
    
    setWorkflowSettings(updatedWorkflows);
    addWorkflow(workflow);
    
    toast({
      title: "Workflow Added",
      description: `Workflow "${workflow.name}" has been added successfully`,
    });
  };

  const handleUpdateWorkflow = (workflow: WorkflowConfig) => {
    const updatedWorkflows = {
      ...workflowSettings,
      workflowIds: workflowSettings.workflowIds.map(w => 
        w.id === workflow.id ? workflow : w
      )
    };
    
    setWorkflowSettings(updatedWorkflows);
    updateWorkflow(workflow);
    
    toast({
      title: "Workflow Updated",
      description: `Workflow "${workflow.name}" has been updated successfully`,
    });
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    const updatedWorkflows = {
      ...workflowSettings,
      workflowIds: workflowSettings.workflowIds.filter(w => w.id !== workflowId)
    };
    
    setWorkflowSettings(updatedWorkflows);
    deleteWorkflow(workflowId);
    
    toast({
      title: "Workflow Deleted",
      description: "The workflow has been removed successfully",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Configuration</CardTitle>
              <CardDescription>
                Configure your GitHub connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="token">Personal Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_***"
                  value={settings.token}
                  onChange={(e) => setSettings({ ...settings, token: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Your token needs at least 'repo' scope for private repositories
                </p>
              </div>
              
              <div className="grid gap-4">
                <Label>GitHub Type</Label>
                <RadioGroup 
                  value={githubType} 
                  onValueChange={(value) => setGithubType(value as "github" | "enterprise")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="github" id="github-com" />
                    <Label htmlFor="github-com" className="cursor-pointer">GitHub.com</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enterprise" id="github-enterprise" />
                    <Label htmlFor="github-enterprise" className="cursor-pointer">GitHub Enterprise</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {githubType === "enterprise" && (
                <div className="grid gap-2">
                  <Label htmlFor="enterpriseDomain">Enterprise Domain</Label>
                  <Input
                    id="enterpriseDomain"
                    placeholder="github.mycompany.com"
                    value={enterpriseDomain}
                    onChange={(e) => setEnterpriseDomain(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    The domain name of your GitHub Enterprise instance (without https:// or paths)
                  </p>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label>API Base URL</Label>
                <Input
                  value={settings.baseUrl}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  {githubType === "github" 
                    ? "Using GitHub.com API" 
                    : "Using GitHub Enterprise API based on your domain"}
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="organization">Organization Name</Label>
                <Input
                  id="organization"
                  placeholder="your-org"
                  value={settings.organization}
                  onChange={(e) => setSettings({ ...settings, organization: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="repository">Repository Name</Label>
                <Input
                  id="repository"
                  placeholder="your-repo (or * for all repos)"
                  value={settings.repository}
                  onChange={(e) => setSettings({ ...settings, repository: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Use * to include all repositories in the organization
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Add GitHub handles of your team members to track (support bulk add with commas sepation) 
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="GitHub username"
                  value={newTeamMember}
                  onChange={(e) => setNewTeamMember(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTeamMember();
                    }
                  }}
                />
                <Button onClick={handleAddTeamMember}>Add</Button>
              </div>
              
              <div className="mt-4">
                <Label>Team Members</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {settings.teamMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team members added</p>
                  ) : (
                    settings.teamMembers.map((member) => (
                      <div
                        key={member}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                      >
                        {member}
                        <button
                          onClick={() => handleRemoveTeamMember(member)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Workflows</CardTitle>
              <CardDescription>
                Manage GitHub Actions workflows to track build status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowList
                workflows={workflowSettings.workflowIds}
                onAdd={handleAddWorkflow}
                onUpdate={handleUpdateWorkflow}
                onDelete={handleDeleteWorkflow}
                onSaveAll={handleSaveSettings}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
