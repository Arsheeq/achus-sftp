
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import Landing from "./pages/landing";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { AdminPanel } from "./pages/AdminPanel";

function ProtectedRoute({ component: Component, requireAdmin = false }: { component: React.ComponentType; requireAdmin?: boolean }) {
  const isAuthenticated = !!localStorage.getItem('access_token');

  if (!isAuthenticated) {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    return <Redirect to="/login" />;
  }

  if (requireAdmin) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (!user.is_admin) {
          return <Redirect to="/dashboard" />;
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        return <Redirect to="/login" />;
      }
    }
  }

  return <Component />;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard">
            {() => <ProtectedRoute component={Dashboard} />}
          </Route>
          <Route path="/admin">
            {() => <ProtectedRoute component={AdminPanel} requireAdmin={true} />}
          </Route>
          <Route>
            {() => {
              const isAuthenticated = !!localStorage.getItem('access_token');
              return <Redirect to={isAuthenticated ? "/dashboard" : "/login"} />;
            }}
          </Route>
        </Switch>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
