import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRoutesProps {
  session: Session | null;
}

const AuthWrapper = ({ session }: { session: Session | null }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth state change in router:', event, {
        platform: isMobile ? 'mobile' : 'desktop',
        path: window.location.pathname
      });
      
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        console.log('User signed out or token refresh failed, redirecting to login');
        if (isMobile) {
          window.location.href = '/login';
        } else {
          navigate('/login', { replace: true });
        }
      } else if (event === 'SIGNED_IN' && currentSession) {
        console.log('User signed in, redirecting to home');
        if (isMobile) {
          window.location.href = '/';
        } else {
          navigate('/', { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Navigation error:', event.error);
      
      if (event.error?.name === 'ChunkLoadError' || event.message?.includes('Failed to fetch')) {
        toast({
          title: "Navigation Error",
          description: "There was a problem loading the page. Please try refreshing.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [toast]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? (
            <Index />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={session ? "/" : "/login"} replace />
        }
      />
    </Routes>
  );
};

const ProtectedRoutes = ({ session }: ProtectedRoutesProps) => {
  return (
    <BrowserRouter basename="/">
      <AuthWrapper session={session} />
    </BrowserRouter>
  );
};

export default ProtectedRoutes;