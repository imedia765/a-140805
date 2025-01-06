import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RoleBadge from "@/components/profile/RoleBadge";

interface UserWithRoles {
  id: string;
  member_number: string;
  full_name: string;
  roles: string[];
}

interface RolesTableProps {
  searchTerm: string;
}

export const RolesTable = ({ searchTerm }: RolesTableProps) => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      // First get members matching the search term
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, member_number, full_name, auth_user_id')
        .ilike('full_name', `%${searchTerm}%`)
        .order('full_name');

      if (membersError) throw membersError;

      // Then get roles for each member
      const usersWithRoles: UserWithRoles[] = [];
      
      for (const member of members || []) {
        if (member.auth_user_id) {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', member.auth_user_id);

          if (rolesError) throw rolesError;

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member Number</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Roles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users?.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.member_number}</TableCell>
            <TableCell>{user.full_name}</TableCell>
            <TableCell className="flex gap-2">
              {user.roles.map((role, index) => (
                <RoleBadge key={`${user.id}-${role}-${index}`} role={role} />
              ))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};