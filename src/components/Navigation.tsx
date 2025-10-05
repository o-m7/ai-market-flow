import { Bell, User, BarChart3, Settings, Brain, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/SearchBar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-terminal border-b border-terminal-border shadow-terminal">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Bloomberg-style Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="bg-terminal-accent text-terminal p-2 rounded-none">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-mono-tabular font-bold text-terminal-accent">
                CAPVIA
              </h1>
              <div className="text-xs text-terminal-secondary font-mono-tabular">TERMINAL</div>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-2">
            <Link 
              to="/portfolio" 
              className="flex items-center space-x-2 px-3 py-1.5 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border text-sm"
            >
              <BarChart3 className="h-3 w-3" />
              <span>PORTFOLIO</span>
            </Link>
            <Link 
              to="/ai-analysis" 
              className="flex items-center space-x-2 px-3 py-1.5 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border text-sm"
            >
              <Brain className="h-3 w-3" />
              <span>AI ANALYSIS</span>
            </Link>
            <Link 
              to="/news" 
              className="flex items-center space-x-2 px-3 py-1.5 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border text-sm"
            >
              <Bell className="h-3 w-3" />
              <span>NEWS</span>
            </Link>
            <Link 
              to="/alerts" 
              className="flex items-center space-x-2 px-3 py-1.5 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border text-sm"
            >
              <Bell className="h-3 w-3" />
              <span>ALERTS</span>
            </Link>
          </nav>
        </div>

        {/* Terminal Search */}
        <div className="flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <div className="flex items-center space-x-3">
          <Link 
            to="/settings" 
            className="flex items-center space-x-2 px-3 py-1.5 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border text-sm"
          >
            <Settings className="h-3 w-3" />
            <span>SETTINGS</span>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center space-x-2 px-3 py-1.5 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker font-mono-tabular border border-terminal-border text-sm"
                >
                  <User className="h-3 w-3" />
                  <span>ACCOUNT</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-terminal border-terminal-border">
                <DropdownMenuItem 
                  className="text-terminal-secondary hover:text-terminal-accent focus:text-terminal-accent font-mono-tabular"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  SIGN OUT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2 px-3 py-1.5 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker font-mono-tabular border border-terminal-border text-sm"
              >
                <LogIn className="h-3 w-3" />
                <span>SIGN IN</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};