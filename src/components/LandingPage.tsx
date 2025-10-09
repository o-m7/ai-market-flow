import { ArrowRight, BarChart3, Brain, TrendingUp, Shield, Zap, Users, User, LogIn, Activity, Globe, Lock, CheckCircle, Github, Twitter, Linkedin, Monitor, Database, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Link } from "react-router-dom";

export const LandingPage = () => {
  const { user, subscription } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 terminal-grid animate-terminal-grid pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-px bg-primary/30 pointer-events-none opacity-0" />

      {/* Navigation */}
      <nav className="relative border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">FlowDesk Terminal</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm">Features</a>
            <a href="#security" className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm">Security</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm">Pricing</a>
            {user ? (
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" asChild>
                <Link to="/dashboard">
                  <Monitor className="h-4 w-4 mr-2" />
                  Terminal
                </Link>
              </Button>
            ) : (
              <LoginDialog>
                <Button className="animate-glow-cyan">
                  <LogIn className="h-4 w-4 mr-2" />
                  Access Terminal
                </Button>
              </LoginDialog>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-24 text-center">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-8 bg-primary/20 text-primary border-primary/30">
              Institutional-grade • Real-time • Multi-asset
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
              Institutional-grade
              <span className="block text-primary font-mono">market intelligence,</span>
              <span className="block text-muted-foreground text-4xl md:text-5xl mt-4">in one terminal.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto font-mono">
              Multi-timeframe TA, orderbook awareness, risk, and execution context—without leaving your stack.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {user ? (
                <Button size="lg" className="text-lg px-12 py-6 animate-glow-cyan terminal-hover" asChild>
                  <Link to="/dashboard" className="flex items-center font-mono">
                    Launch Terminal <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <LoginDialog>
                  <Button size="lg" className="text-lg px-12 py-6 animate-glow-cyan terminal-hover flex items-center font-mono">
                    Start Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </LoginDialog>
              )}
              <Button variant="outline" size="lg" className="text-lg px-12 py-6 border-primary/50 text-primary hover:bg-primary/10 terminal-hover font-mono">
                See Live Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee KPIs / Trust */}
      <section className="border-y border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-bull font-mono-tabular">99.9%</div>
              <div className="text-xs text-muted-foreground font-mono">Uptime SLA</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary font-mono-tabular">2,847+</div>
              <div className="text-xs text-muted-foreground font-mono">Assets Covered</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-warning font-mono-tabular">&lt;50ms</div>
              <div className="text-xs text-muted-foreground font-mono">Avg Latency</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-accent font-mono-tabular">Live</div>
              <div className="text-xs text-muted-foreground font-mono">Last Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-12 border-b border-border/30">
        <div className="container mx-auto px-6">
          <p className="text-center text-muted-foreground mb-8 font-mono text-sm">Trusted by institutions and professionals</p>
          <div className="flex justify-center items-center space-x-12 opacity-50 grayscale">
            <div className="text-2xl font-bold font-mono">POLYGON</div>
            <div className="text-2xl font-bold font-mono">BINANCE</div>
            <div className="text-2xl font-bold font-mono">KRAKEN</div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-6 font-mono tracking-tight">Terminal Interface</h2>
            <p className="text-xl text-muted-foreground font-mono">Professional-grade workspace designed for speed and precision</p>
          </div>
          
          <div className="relative">
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6 border-b border-border/30 pb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-bear"></div>
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <div className="w-3 h-3 rounded-full bg-bull"></div>
                  </div>
                  <div className="flex space-x-6 font-mono text-sm text-muted-foreground">
                    <span className="text-primary">Overview</span>
                    <span>Orderbook</span>
                    <span>Signals</span>
                    <span>Risk</span>
                  </div>
                </div>
                
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">• MTF signals across 15m-4h timeframes</span>
                    <Badge variant="outline" className="border-bull/50 text-bull">ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">• LOB pressure monitoring (L2 depth)</span>
                    <Badge variant="outline" className="border-primary/50 text-primary">LIVE</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">• Quant sizing with Kelly criterion</span>
                    <Badge variant="outline" className="border-warning/50 text-warning">CALC</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">• One-click JSON/CSV export</span>
                    <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">READY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-muted/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6 font-mono tracking-tight">Core Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
              Bloomberg-grade functionality without the Bloomberg price tag
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-4" />
                <CardTitle className="font-mono text-lg">Multi-Asset Intelligence</CardTitle>
                <CardDescription className="font-mono text-sm">
                  Cross-asset correlation analysis with real-time sentiment scoring across equities, FX, crypto, and commodities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader>
                <Activity className="h-8 w-8 text-bull mb-4" />
                <CardTitle className="font-mono text-lg">Order Flow Analytics</CardTitle>
                <CardDescription className="font-mono text-sm">
                  Level-2 orderbook pressure, trade size distribution, and institutional flow detection with sub-second updates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-4" />
                <CardTitle className="font-mono text-lg">Multi-Timeframe TA</CardTitle>
                <CardDescription className="font-mono text-sm">
                  Synchronized analysis across 1m-1D timeframes with proprietary momentum and volatility indicators.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader>
                <Shield className="h-8 w-8 text-warning mb-4" />
                <CardTitle className="font-mono text-lg">Risk Engine</CardTitle>
                <CardDescription className="font-mono text-sm">
                  Portfolio VaR, sector exposure limits, and correlation-adjusted position sizing with real-time P&L tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader>
                <Database className="h-8 w-8 text-accent mb-4" />
                <CardTitle className="font-mono text-lg">Market Microstructure</CardTitle>
                <CardDescription className="font-mono text-sm">
                  Tick-by-tick analysis, spread dynamics, and market impact modeling for optimal execution timing.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader>
                <Cpu className="h-8 w-8 text-primary mb-4" />
                <CardTitle className="font-mono text-lg">API Integration</CardTitle>
                <CardDescription className="font-mono text-sm">
                  RESTful and WebSocket APIs for algorithmic trading, backtesting, and portfolio management systems.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section id="security" className="py-20 border-t border-border/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-foreground mb-6 font-mono tracking-tight">Security & Compliance</h2>
            <p className="text-xl text-muted-foreground font-mono">
              Enterprise-grade security with read-only API keys and least-privilege access controls
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold font-mono">SOC 2 Ready</h3>
              <p className="text-muted-foreground font-mono text-sm">
                Comprehensive audit trail and access controls designed for institutional compliance requirements.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-bull/20 flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-bull" />
              </div>
              <h3 className="text-xl font-semibold font-mono">Read-Only APIs</h3>
              <p className="text-muted-foreground font-mono text-sm">
                Zero execution risk with read-only market data access and encrypted key management.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold font-mono">Global Infrastructure</h3>
              <p className="text-muted-foreground font-mono text-sm">
                Multi-region deployment with 99.9% uptime SLA and disaster recovery protocols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-20 bg-muted/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6 font-mono tracking-tight">Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground font-mono">No hidden fees, no per-trade costs, no lock-in contracts</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader className="text-center">
                <CardTitle className="font-mono text-xl">Starter</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-foreground font-mono-tabular">$0</div>
                  <CardDescription className="font-mono">Free tier</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Real-time data (15min delay)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Basic TA indicators</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>5 watchlist symbols</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary border-primary/50 terminal-hover relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary/20 text-primary border-primary/30">Popular</Badge>
              </div>
              <CardHeader className="text-center text-white">
                <CardTitle className="font-mono text-xl">Professional</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold font-mono-tabular">$49</div>
                  <CardDescription className="text-primary-foreground/80 font-mono">/month</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm text-white">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Real-time streaming data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Advanced orderbook analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Unlimited watchlists</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>API access</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 terminal-hover">
              <CardHeader className="text-center">
                <CardTitle className="font-mono text-xl">Institutional</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-foreground font-mono-tabular">Custom</div>
                  <CardDescription className="font-mono">Contact sales</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Custom integrations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Dedicated infrastructure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>SLA guarantees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-bull" />
                  <span>Priority support</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-terminal border-border/50 shadow-card max-w-4xl mx-auto">
            <CardContent className="p-16 text-center">
              <h2 className="text-4xl font-bold text-foreground mb-6 font-mono tracking-tight">Ready to upgrade your stack?</h2>
              <p className="text-xl text-muted-foreground mb-12 font-mono max-w-2xl mx-auto">
                Join institutional traders using terminal-grade market intelligence for systematic alpha generation.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                {user ? (
                  <Button size="lg" className="text-lg px-12 py-6 animate-glow-cyan terminal-hover" asChild>
                    <Link to="/dashboard" className="flex items-center font-mono">
                      Launch Terminal <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <LoginDialog>
                    <Button size="lg" className="text-lg px-12 py-6 animate-glow-cyan terminal-hover flex items-center font-mono">
                      Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </LoginDialog>
                )}
                <Button size="lg" variant="outline" className="text-lg px-12 py-6 border-primary/50 text-primary hover:bg-primary/10 terminal-hover font-mono">
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold font-mono">FlowDesk Terminal</span>
              </div>
              <p className="text-muted-foreground font-mono text-sm">
                Institutional-grade market intelligence platform for professional traders and quantitative researchers.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="hover:text-primary">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:text-primary">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:text-primary">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 font-mono">Platform</h4>
              <ul className="space-y-3 text-muted-foreground font-mono text-sm">
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link to="/quant-demo" className="hover:text-primary transition-colors">Analytics</Link></li>
                <li><Link to="/portfolio" className="hover:text-primary transition-colors">Portfolio</Link></li>
                <li><Link to="/ai-analysis" className="hover:text-primary transition-colors">AI Signals</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 font-mono">Resources</h4>
              <ul className="space-y-3 text-muted-foreground font-mono text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status Page</a></li>
                <li><Link to="/news" className="hover:text-primary transition-colors">Market News</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 font-mono">Company</h4>
              <ul className="space-y-3 text-muted-foreground font-mono text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground font-mono text-sm">
            <p>&copy; 2025 FlowDesk Terminal. All rights reserved.</p>
            <p>Market data provided by Polygon and Binance</p>
          </div>
        </div>
      </footer>
    </div>
  );
};