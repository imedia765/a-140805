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
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          member_number,
          full_name,
          auth_user_id,
          user_roles!inner (
            role
          )
        `)
        .ilike('full_name', `%${searchTerm}%`)
        .order('full_name');

      if (error) throw error;

      return data.map((user: any) => ({
        id: user.id,
        member_number: user.member_number,
        full_name: user.full_name,
        roles: user.user_roles.map((r: any) => r.role)
      }));
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