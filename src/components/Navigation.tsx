import { Bell, User, BarChart3, Star, Settings, LogOut, Settings2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/SearchBar";
import { Link } from "react-router-dom";

export const Navigation = () => {

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
          
          {/* Terminal-style Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              to="/portfolio" 
              className="flex items-center space-x-2 px-4 py-2 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border"
            >
              <BarChart3 className="h-3 w-3" />
              <span className="text-sm">PORTFOLIO</span>
            </Link>
            <Link 
              to="/ai-analysis" 
              className="flex items-center space-x-2 px-4 py-2 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border"
            >
              <Brain className="h-3 w-3" />
              <span className="text-sm">AI ANALYSIS</span>
            </Link>
            <Link 
              to="/news" 
              className="flex items-center space-x-2 px-4 py-2 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border"
            >
              <Bell className="h-3 w-3" />
              <span className="text-sm">NEWS</span>
            </Link>
            <Link 
              to="/alerts" 
              className="flex items-center space-x-2 px-4 py-2 text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker transition-all font-mono-tabular border border-transparent hover:border-terminal-border"
            >
              <Bell className="h-3 w-3" />
              <span className="text-sm">ALERTS</span>
            </Link>
          </nav>
        </div>

        {/* Terminal Search */}
        <div className="flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        {/* Terminal Actions */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker border border-transparent hover:border-terminal-border font-mono-tabular" 
            asChild
          >
            <Link to="/alerts">
              <Bell className="h-4 w-4 mr-1" />
              <span className="text-xs">ALERTS</span>
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-terminal-secondary hover:text-terminal-accent hover:bg-terminal-darker border border-transparent hover:border-terminal-border font-mono-tabular"
              >
                <User className="h-4 w-4 mr-1" />
                <span className="text-xs">USER</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-terminal border-terminal-border rounded-none">
              <DropdownMenuItem asChild className="font-mono-tabular">
                <Link to="/settings" className="flex items-center text-terminal-foreground hover:text-terminal-accent">
                  <Settings className="h-3 w-3 mr-2" />
                  SETTINGS
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};