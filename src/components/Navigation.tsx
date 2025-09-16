import { Bell, User, BarChart3, Star, Settings, LogOut, Settings2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/SearchBar";
import { Link } from "react-router-dom";

export const Navigation = () => {

  return (
    <nav className="bg-gradient-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Capvia
            </h1>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/portfolio" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span>Portfolio</span>
            </Link>
            <Link to="/ai-analysis" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Brain className="h-4 w-4" />
              <span>AI Analysis</span>
            </Link>
            <Link to="/news" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span>News</span>
            </Link>
            <Link to="/alerts" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
            <Link to="/alerts">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};