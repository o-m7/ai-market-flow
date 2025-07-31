import { Search, Bell, User, BarChart3, Star, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Navigation = () => {
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
            <a href="/watchlist" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Star className="h-4 w-4" />
              <span>Watchlist</span>
            </a>
            <a href="/alerts" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
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
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
            <a href="/settings">
              <User className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </nav>
  );
};