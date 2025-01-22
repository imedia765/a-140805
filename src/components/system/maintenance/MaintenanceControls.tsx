import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MaintenanceControls = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: maintenanceSettings, isLoading } = useQuery({
    queryKey: ['maintenanceSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const toggleMaintenance = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('maintenance_settings')
        .update({ 
          is_enabled: !maintenanceSettings?.is_enabled,
          enabled_at: !maintenanceSettings?.is_enabled ? new Date().toISOString() : null,
          enabled_by: !maintenanceSettings?.is_enabled ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', maintenanceSettings?.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['maintenanceSettings'] });
      
      toast({
        title: !maintenanceSettings?.is_enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        description: !maintenanceSettings?.is_enabled 
          ? "Only administrators can access the system now" 
          : "System is now accessible to all users",
      });
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast({
        title: "Error",
        description: "Failed to toggle maintenance mode",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-dashboard-card border-white/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dashboard-card border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-dashboard-warning" />
            <CardTitle className="text-xl text-white">Maintenance Mode</CardTitle>
          </div>
          <Switch
            checked={maintenanceSettings?.is_enabled || false}
            onCheckedChange={toggleMaintenance}
            disabled={isUpdating}
          />
        </div>
        <CardDescription className="text-dashboard-muted">
          When enabled, only administrators can access the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {maintenanceSettings?.is_enabled && (
            <div className="bg-dashboard-warning/10 border border-dashboard-warning/20 rounded-lg p-4">
              <p className="text-dashboard-warning text-sm">
                System is currently in maintenance mode. Regular users and collectors cannot access the system.
              </p>
            </div>
          )}
          <div className="text-sm text-dashboard-muted">
            {maintenanceSettings?.is_enabled ? (
              <p>
                Maintenance mode was enabled on{' '}
                {new Date(maintenanceSettings.enabled_at).toLocaleString()}
              </p>
            ) : (
              <p>Maintenance mode is currently disabled</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceControls;