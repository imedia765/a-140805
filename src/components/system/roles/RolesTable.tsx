import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge } from "@/components/profile/RoleBadge";

interface UserWithRoles {
  id: string;
  member_number: string;
  full_name: string;
  roles: string[];
}

export const RolesTable = () => {
  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['users_with_roles'],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          member_number,
          full_name,
          auth_user_id
        `);

      if (membersError) throw membersError;

      const usersWithRoles: UserWithRoles[] = [];

      for (const member of members || []) {
        if (member.auth_user_id) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', member.auth_user_id);

          usersWithRoles.push({
            id: member.id,
            member_number: member.member_number,
            full_name: member.full_name,
            roles: roles?.map(r => r.role) || []
          });
        }
      }

      return usersWithRoles;
    }
  });

  if (isLoading) return <div>Loading roles...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member Number</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Roles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersWithRoles?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.member_number}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {user.roles.map((role, index) => (
                    <RoleBadge key={index} role={role} />
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};