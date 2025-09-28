import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import PatientManagement from "@/pages/PatientManagement";
import AddPatient from "@/pages/AddPatient";
import PatientDetails from "@/pages/PatientDetails";
import AttachDocumentPage from "@/pages/AttachDocumentPage";
import CommentsPage from "@/pages/CommentsPage";
import TimelinePage from "@/pages/TimelinePage";
import UserManagement from "@/pages/UserManagement";
import UserDetails from "@/pages/UserDetails";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import ReportTemplates from "@/pages/ReportTemplates";
import Settings from "@/pages/Settings";
import SEOSettings from "@/pages/SEOSettings";
import Notifications from "@/pages/Notifications";
import ChangePassword from "@/pages/ChangePassword";
import NotFound from "@/pages/not-found";
import Sidebar, { SidebarProvider, useSidebar } from "@/components/Sidebar";
import Header from "@/components/Header";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ConcurrentSessionDialog } from "@/components/ConcurrentSessionDialog";
import { useSessionMonitoring } from "@/hooks/useSessionMonitoring";

function AuthenticatedLayout() {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  const {
    showConcurrentDialog,
    activeSessions,
    handleForceLogin,
    closeConcurrentDialog,
    userEmail,
  } = useSessionMonitoring();
  
  // Session cleanup on browser close/refresh
  React.useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (user) {
        try {
          const token = localStorage.getItem('jwtToken');
          if (token) {
            navigator.sendBeacon('/api/auth/session-cleanup', JSON.stringify({
              action: 'browser_close',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.warn('Failed to send session cleanup beacon:', error);
        }
      }
    };

    // Handle page visibility for long periods of inactivity
    let visibilityTimer: NodeJS.Timeout | null = null;
    const handleVisibilityChange = () => {
      if (document.hidden && user) {
        visibilityTimer = setTimeout(async () => {
          try {
            const token = localStorage.getItem('jwtToken');
            if (token) {
              await fetch('/api/auth/session-cleanup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  action: 'tab_hidden',
                  timestamp: new Date().toISOString()
                })
              });
            }
          } catch (error) {
            console.warn('Failed to cleanup hidden tab session:', error);
          }
        }, 30 * 60 * 1000); // 30 minutes
      } else if (!document.hidden && visibilityTimer) {
        clearTimeout(visibilityTimer);
        visibilityTimer = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
      }
    };
  }, [user]);
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`min-h-screen transition-all duration-300 ${
        isCollapsed 
          ? 'md:ml-[4.5rem]' 
          : 'md:ml-64'
      }`}>
        <Header />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/patients" component={PatientManagement} />
          <Route path="/patients/:id" component={PatientDetails} />
          <Route path="/patients/:id/attach-document" component={({ params }: any) => <AttachDocumentPage patientId={params.id} />} />
          <Route path="/patients/:id/comments" component={({ params }: any) => <CommentsPage patientId={params.id} />} />
          <Route path="/patients/:id/timeline" component={({ params }: any) => <TimelinePage patientId={params.id} />} />
          <Route path="/add-patient" component={AddPatient} />
          <Route path="/users" component={UserManagement} />
          <Route path="/users/:id" component={UserDetails} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/reports" component={Reports} />
          <Route path="/report-templates" component={ReportTemplates} />
          <Route path="/settings" component={Settings} />
          <Route path="/seo-settings" component={SEOSettings} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/change-password" component={() => <ChangePassword userId={user?.id} />} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      {/* Concurrent Session Dialog */}
      <ConcurrentSessionDialog
        isOpen={showConcurrentDialog}
        onClose={closeConcurrentDialog}
        activeSessions={activeSessions}
        onForceLogin={handleForceLogin}
        userEmail={userEmail}
      />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <AuthenticatedLayout />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={500} skipDelayDuration={200}>
          <SidebarProvider>
            <Toaster />
            <Router />
          </SidebarProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
