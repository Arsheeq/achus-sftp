
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User as UserIcon, Settings, Moon, Sun } from 'lucide-react';
import { api } from '@/api/api';

export function Header() {
  const [location, setLocation] = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  
  // Don't show user info on login/landing pages
  const isPublicPage = location === '/' || location === '/login';
  
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false,
    enabled: !!localStorage.getItem('access_token') && !isPublicPage,
  });

  const isAuthenticated = !!user && !isPublicPage;
  const isAdmin = user?.is_admin === true;

  const handleLogout = () => {
    api.logout();
    setLocation('/login');
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <a className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <img 
                src={resolvedTheme === 'dark' ? '/achu-logo-dark.png' : '/achu-logo.png'} 
                alt="Achu's SFTP" 
                className="h-8 sm:h-10" 
              />
              <div className="flex flex-col">
                <span className="text-sm sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Achu's SFTP
                </span>
                <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                  Cloud File Management
                </span>
              </div>
            </a>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {isAuthenticated && user && (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Welcome, <span className="font-medium">{user.username}</span>
                  </span>
                </div>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/admin')}
                    className="h-8 sm:h-9"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Admin</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 sm:h-9"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
