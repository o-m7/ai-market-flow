import { ArrowRight, BarChart3, Brain, TrendingUp, Shield, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export const LandingPage = () => {
  const { user, subscription } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">FlowDesk Markets</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
          <Button variant="outline" asChild>
            <a href="/dashboard">Launch Platform</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            AI-Powered
            <span className="text-primary block">Trading Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Make smarter trading decisions with real-time AI analysis, advanced charting, and comprehensive market insights across stocks, crypto, forex, and indices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <a href="/dashboard" className="flex items-center">
                Start Trading Now <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-gradient-card border border-border rounded-xl p-8">
            <h3 className="text-4xl font-bold text-primary mb-2">2,847+</h3>
            <p className="text-muted-foreground">Symbols Tracked</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-xl p-8">
            <h3 className="text-4xl font-bold text-bull mb-2">94.3%</h3>
            <p className="text-muted-foreground">AI Accuracy Rate</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-xl p-8">
            <h3 className="text-4xl font-bold text-neutral mb-2">50K+</h3>
            <p className="text-muted-foreground">Active Traders</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need to Trade Smarter</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced tools and AI-powered insights designed for both novice and professional traders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-border bg-gradient-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Brain className="h-12 w-12 text-primary mb-4" />
              <CardTitle>AI Market Analysis</CardTitle>
              <CardDescription>
                Real-time sentiment analysis and predictive insights powered by advanced machine learning algorithms.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-gradient-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-bull mb-4" />
              <CardTitle>Advanced Charting</CardTitle>
              <CardDescription>
                Professional-grade charts with technical indicators, multiple timeframes, and real-time data feeds.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-gradient-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-neutral mb-4" />
              <CardTitle>Multi-Asset Trading</CardTitle>
              <CardDescription>
                Access stocks, crypto, forex, and indices all in one platform with unified portfolio management.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-gradient-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                Advanced risk assessment tools and automated alerts to protect your investments and optimize returns.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-gradient-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Zap className="h-12 w-12 text-bull mb-4" />
              <CardTitle>Real-Time Data</CardTitle>
              <CardDescription>
                Lightning-fast market data updates with sub-second latency from premium data providers.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-gradient-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Users className="h-12 w-12 text-neutral mb-4" />
              <CardTitle>Social Trading</CardTitle>
              <CardDescription>
                Follow top traders, share strategies, and learn from a community of successful investors.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-primary rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Trading?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who are already using AI-powered insights to maximize their returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <a href="/dashboard" className="flex items-center">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">FlowDesk Markets</span>
              </div>
              <p className="text-muted-foreground">
                AI-powered trading platform for the modern investor.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a></li>
                <li><a href="/markets" className="hover:text-foreground transition-colors">Markets</a></li>
                <li><a href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</a></li>
                <li><a href="/ai-analysis" className="hover:text-foreground transition-colors">AI Analysis</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="/news" className="hover:text-foreground transition-colors">Market News</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 FlowDesk Markets. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};