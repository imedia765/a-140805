import { useState, useEffect } from "react";
import { Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = window.innerWidth <= 768;

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

  const handleAuthError = async (error: AuthError) => {
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

    console.log('Initializing auth session...');
    
    const initializeSession = async () => {
      try {
        setLoading(true);
        console.log('Fetching current session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session fetch error:', error);
          await handleAuthError(error);
          return;
        }
        
        if (mounted) {
          console.log('Setting session state:', currentSession?.user?.id);
          setSession(currentSession);
          if (currentSession?.user) {
            console.log('Session initialized for user:', currentSession.user.id);
            if (window.location.pathname === '/login') {
              window.location.href = '/';
            }
          } else {
            console.log('No active session found');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
      } catch (error: any) {
        console.error('Session initialization error:', error);
        if (mounted) {
          await handleSignOut(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const setupAuthListener = () => {
      const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          platform: isMobile ? 'mobile' : 'desktop'
        });
        
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
          console.log('User signed out or token refresh failed');
          window.location.href = '/login';
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('User signed in, updating session');
          setSession(currentSession);
          await queryClient.invalidateQueries();
          
          if (window.location.pathname === '/login') {
            console.log('Redirecting to home after sign in');
            window.location.href = '/';
          }
        }
        
        setLoading(false);
      });

      return authSubscription;
    };

    const authSubscription = setupAuthListener();
    initializeSession();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, [queryClient, toast, isMobile]);

  return { session, loading, handleSignOut };
}