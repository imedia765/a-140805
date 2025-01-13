import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSignOut = async (skipStorageClear = false) => {
    try {
      console.log('Starting sign out process...');
      setLoading(true);
      
      await queryClient.resetQueries();
      await queryClient.clear();
      
      if (!skipStorageClear) {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('Sign out successful');
      setSession(null);
      
      window.location.href = '/login';
      
    } catch (error: any) {
      console.error('Error during sign out:', error);
      toast({
        title: "Error signing out",
        description: error.message.includes('502') 
          ? "Network connection error. Please check your connection and try again."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = async (error: any) => {
    console.error('Auth error:', error);
    
    if (error.message.includes('refresh_token_not_found') || 
        error.message.includes('invalid refresh token')) {
      console.log('Token refresh failed, signing out...');
      await handleSignOut(true);
      
      toast({
        title: "Session Expired",
        description: "Please sign in again",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    console.log('Initializing auth session...');
    
    const initializeSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          handleAuthError(error);
          return;
        }

        if (mounted) {
          console.log('Session initialized:', {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id
          });
          
          setSession(currentSession);
          setLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error during session initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const setupAuthListener = () => {
      const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id
        });

        if (event === 'SIGNED_OUT') {
          setSession(null);
          queryClient.clear();
          window.location.href = '/';
        } else if (event === 'SIGNED_IN') {
          setSession(currentSession);
          window.location.href = '/';
        } else {
          setSession(currentSession);
        }
      });

      authSubscription = data;
      return data;
    };

    setupAuthListener();
    initializeSession();

    return () => {
      mounted = false;
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, [queryClient, toast]);

  return {
    session,
    loading,
    handleSignOut
  };
};
