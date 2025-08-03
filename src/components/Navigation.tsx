import { Search, Bell, User, BarChart3, Star, Settings, LogOut, Settings2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-gradient-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              FlowDesk Markets
            </h1>
          </a>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/portfolio" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span>Portfolio</span>
            </a>
            <a href="/ai-analysis" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Brain className="h-4 w-4" />
              <span>AI Analysis</span>
            </a>
            <a href="/watchlist" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Star className="h-4 w-4" />
              <span>Watchlist</span>
            </a>
            <a href="/news" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span>News</span>
            </a>
            <a href="/alerts" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
            </a>
            <a href="/integrations" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="h-4 w-4" />
              <span>Integrations</span>
            </a>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search symbols (e.g., AAPL, BTC, EUR/USD)"
              className="pl-10 bg-secondary border-border focus:border-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
            <a href="/alerts">
              <Bell className="h-5 w-5" />
            </a>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem asChild>
                  <a href="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginDialog>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <User className="h-5 w-5" />
              </Button>
            </LoginDialog>
          )}
        </div>
      </div>
    </nav>
  );
};