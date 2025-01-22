import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSignOut = async (skipStorageClear = false) => {
    console.log('[Auth] Starting sign out process...');
    if (isLoggingOut) {
      console.log('[Auth] Logout already in progress, skipping...');
      return;
    }

    try {
      setIsLoggingOut(true);
      setLoading(true);
      
      console.log('[Auth] Clearing query cache...');
      await queryClient.resetQueries();
      await queryClient.clear();
      
      if (!skipStorageClear) {
        console.log('[Auth] Clearing local storage...');
        localStorage.clear();
        sessionStorage.clear();
      }
      
      console.log('[Auth] Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('[Auth] Sign out successful');
      setSession(null);
      window.location.href = '/login';
      
    } catch (error: any) {
      console.error('[Auth] Error during sign out:', error);
      toast({
        title: "Error signing out",
        description: error.message.includes('502') 
          ? "Failed to connect to the server. Please check your network connection and try again."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Session hook mounted');

    const initializeSession = async () => {
      try {
        console.log('[Auth] Initializing session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session initialization error:', error);
          throw error;
        }

        if (currentSession) {
          // Check if system is in maintenance mode
          const { data: maintenanceData, error: maintenanceError } = await supabase
            .from('maintenance_settings')
            .select('is_enabled')
            .single();

          if (maintenanceError) {
            console.error('[Auth] Error checking maintenance mode:', maintenanceError);
          } else if (maintenanceData?.is_enabled) {
            // Check if user is admin
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', currentSession.user.id);

            const isAdmin = roles?.some(r => r.role === 'admin');

            if (!isAdmin) {
              console.log('[Auth] Non-admin user blocked during maintenance mode');
              await handleSignOut(false);
              toast({
                title: "System Maintenance",
                description: "System is currently under maintenance. Only administrators can access the system.",
                variant: "destructive",
              });
              return;
            }
          }
        }
        
        if (mounted) {
          console.log('[Auth] Setting session state:', {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
            timestamp: new Date().toISOString()
          });
          setSession(currentSession);
          setLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Session initialization failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log('[Auth] Auth state changed:', {
        event,
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        console.log('[Auth] User signed out or token refresh failed');
        window.location.href = '/login';
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Check maintenance mode on sign in
        const { data: maintenanceData } = await supabase
          .from('maintenance_settings')
          .select('is_enabled')
          .single();

        if (maintenanceData?.is_enabled) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentSession?.user.id);

          const isAdmin = roles?.some(r => r.role === 'admin');

          if (!isAdmin) {
            console.log('[Auth] Non-admin user blocked during maintenance mode');
            await handleSignOut(false);
            toast({
              title: "System Maintenance",
              description: "System is currently under maintenance. Only administrators can access the system.",
              variant: "destructive",
            });
            return;
          }
        }

        console.log('[Auth] User signed in or token refreshed');
        setSession(currentSession);
        queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      }
      
      setLoading(false);
    });

    initializeSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  return { session, loading, handleSignOut };
}