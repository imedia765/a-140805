import { useState } from 'react';
import { Card } from "@/components/ui/card";
import RoleManagementHeader from "./roles/RoleManagementHeader";
import { RolesTable } from "./roles/RolesTable";

const RoleManagementCard = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Card className="p-6 space-y-6">
      <RoleManagementHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <RolesTable searchTerm={searchTerm} />
    </Card>
  );
};

export default RoleManagementCard;