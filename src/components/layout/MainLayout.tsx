
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, BarChart, Settings, Github } from "lucide-react";
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar>
        <div className="py-4 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4">
            <Github className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Scrum Pulse</h1>
          </div>
        </div>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/leaderboard">
                      <BarChart className="h-4 w-4 mr-2" />
                      <span>Leaderboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
