import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";

type UserRole = {
  user_id: string;
  role: Database['public']['Enums']['app_role'];
  full_name: string;
  member_number: string;
  roles?: Database['public']['Enums']['app_role'][];
}

const ITEMS_PER_PAGE = 7;

const getHighestRole = (roles: Database['public']['Enums']['app_role'][]): Database['public']['Enums']['app_role'] => {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('collector')) return 'collector';
  return 'member';
};

const RoleManagementCard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['users-with-roles', searchTerm, currentPage],
    queryFn: async () => {
      // First get members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('auth_user_id, full_name, member_number')
        .or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`)
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      if (membersError) throw membersError;

      // Then get all roles for these users
      const userIds = members.map(m => m.auth_user_id).filter(Boolean);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Map roles to users
      const usersWithRoles = members.map(member => {
        const userRoles = roles.filter(role => role.user_id === member.auth_user_id);
        const rolesList = userRoles.map(r => r.role);
        return {
          user_id: member.auth_user_id,
          full_name: member.full_name,
          member_number: member.member_number,
          roles: rolesList,
          role: rolesList.length > 0 ? getHighestRole(rolesList) : 'member'
        };
      });

      console.log('Users with roles:', usersWithRoles);
      return usersWithRoles;
    }
  });

  const handleRoleChange = async (userId: string, newRole: Database['public']['Enums']['app_role']) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: "Role Updated",
        description: `Successfully updated user role to ${newRole}`,
      });

      refetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-dashboard-card border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-dashboard-accent1" />
            <CardTitle className="text-xl font-semibold text-white">Role Management</CardTitle>
          </div>
        </div>
        <CardDescription className="text-dashboard-text mt-2">
          Manage user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dashboard-muted h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name or member number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-dashboard-card/50 border-white/10 focus:border-white/20 text-dashboard-text placeholder:text-dashboard-muted"
          />
        </div>
        
        <ScrollArea className="h-[400px] w-full rounded-md pr-4">
          <div className="space-y-4">
            {users?.map((user) => (
              <div 
                key={user.user_id} 
                className="flex items-center justify-between p-5 bg-dashboard-card/50 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <Users className="h-5 w-5 text-dashboard-accent2" />
                  <div>
                    <p className="text-white font-medium mb-1">{user.full_name}</p>
                    <p className="text-sm text-dashboard-muted">Member #{user.member_number}</p>
                    {user.roles && user.roles.length > 1 && (
                      <p className="text-xs text-dashboard-accent1 mt-1">
                        All roles: {user.roles.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <Select
                  value={user.role}
                  onValueChange={(value: Database['public']['Enums']['app_role']) => handleRoleChange(user.user_id, value)}
                >
                  <SelectTrigger className="w-[140px] bg-dashboard-card border-dashboard-accent1/20 text-dashboard-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-white/10">
                    <SelectItem value="admin" className="text-dashboard-text">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-dashboard-accent1" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="collector" className="text-dashboard-text">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-dashboard-accent2" />
                        Collector
                      </div>
                    </SelectItem>
                    <SelectItem value="member" className="text-dashboard-text">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-dashboard-accent3" />
                        Member
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="border-dashboard-accent1/20 hover:bg-dashboard-accent1/10 text-dashboard-text"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!users || users.length < ITEMS_PER_PAGE}
            className="border-dashboard-accent1/20 hover:bg-dashboard-accent1/10 text-dashboard-text"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleManagementCard;