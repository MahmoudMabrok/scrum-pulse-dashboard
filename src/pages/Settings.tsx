
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { encrypt, decrypt } from "@/utils/encryptionUtil";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

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
  const [newTeamMember, setNewTeamMember] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const storedSettings = localStorage.getItem("github_settings");
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      // Decrypt the token if it exists
      if (parsedSettings.token) {
        parsedSettings.token = decrypt(parsedSettings.token);
      }
      setSettings(parsedSettings);
    }
  }, []);

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

    // Save settings with encrypted token
    const settingsToSave = {
      ...settings,
      token: encrypt(settings.token),
    };
    
    localStorage.setItem("github_settings", JSON.stringify(settingsToSave));
    
    toast({
      title: "Settings Saved",
      description: "Your GitHub settings have been saved successfully",
    });
  };

  const handleAddTeamMember = () => {
    if (!newTeamMember.trim()) return;
    
    if (settings.teamMembers.includes(newTeamMember.trim())) {
      toast({
        title: "Duplicate Member",
        description: "This team member is already in the list",
        variant: "destructive",
      });
      return;
    }
    
    setSettings({
      ...settings,
      teamMembers: [...settings.teamMembers, newTeamMember.trim()],
    });
    
    setNewTeamMember("");
  };

  const handleRemoveTeamMember = (member: string) => {
    setSettings({
      ...settings,
      teamMembers: settings.teamMembers.filter(m => m !== member),
    });
  };

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
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
              
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.github.com"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Use default for GitHub.com or your GitHub Enterprise URL
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
                Add GitHub handles of your team members to track
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
      </Tabs>
    </div>
  );
};

export default Settings;
