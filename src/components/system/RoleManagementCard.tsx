import { Card } from "@/components/ui/card";
import { RoleManagementHeader } from "./roles/RoleManagementHeader";
import { RolesTable } from "./roles/RolesTable";

export const RoleManagementCard = () => {
  return (
    <Card className="p-6 space-y-6">
      <RoleManagementHeader />
      <RolesTable />
    </Card>
  );
};