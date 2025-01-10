import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useAuthSession } from "@/hooks/useAuthSession";
import ProtectedRoutes from "@/components/routing/ProtectedRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function AppContent() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dashboard-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <ProtectedRoutes session={session} />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;