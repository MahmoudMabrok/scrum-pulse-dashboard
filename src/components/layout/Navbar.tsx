
import { SidebarTrigger } from "@/components/ui/sidebar";

const Navbar = () => {
  return (
    <header className="border-b">
      <div className="flex h-14 items-center px-4">
        <SidebarTrigger />
        <div className="ml-4 flex-1">
          <h1 className="text-lg font-semibold">Scrum Pulse Dashboard</h1>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
