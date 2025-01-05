import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Settings, Users, UserCheck, History, LogOut, Database } from "lucide-react";
import { UserRole } from "@/hooks/useRoleAccess";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

interface SidePanelProps {
  onTabChange: (value: string) => void;
  userRole: UserRole;
}

const SidePanel = ({ onTabChange, userRole }: SidePanelProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await queryClient.invalidateQueries();
      await queryClient.resetQueries();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const getTabs = () => {
    const tabs = [
      {
        value: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['member', 'collector', 'admin']
      },
      {
        value: 'users',
        label: 'Users',
        icon: Users,
        roles: ['collector', 'admin']
      },
      {
        value: 'collectors',
        label: 'Collectors',
        icon: UserCheck,
        roles: ['admin']
      },
      {
        value: 'audit',
        label: 'Audit Logs',
        icon: History,
        roles: ['admin']
      },
      {
        value: 'system',
        label: 'System Tools',
        icon: Database,
        roles: ['admin']
      },
      {
        value: 'settings',
        label: 'Settings',
        icon: Settings,
        roles: ['admin']
      }
    ];

    return tabs.filter(tab => {
      if (!userRole) return false;
      return tab.roles.includes(userRole);
    });
  };

  return (
    <div className="h-full w-full glass-card border-r border-white/10 flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6">
          <h2 className="text-xl font-medium mb-6">Navigation</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6">
          <Tabs 
            defaultValue="dashboard" 
            orientation="vertical" 
            className="w-full"
            onValueChange={onTabChange}
          >
            <TabsList className="flex flex-col h-auto bg-transparent text-white">
              {getTabs().map(({ value, label, icon: Icon }) => (
                <TabsTrigger 
                  key={value}
                  value={value} 
                  className="w-full justify-start gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="w-full p-4 border-t border-white/10 bg-dashboard-dark">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-dashboard-accent1 hover:text-white hover:bg-dashboard-card rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default SidePanel;
