import { useState, useEffect } from "react";
import { User, Bell, Smartphone, Mail, MessageSquare, Lock, Eye, CreditCard, HelpCircle, Settings2, Key, Plus, Trash2, Crown, Calendar, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const Settings = () => {
  const { user, subscription, refreshSubscription, signOut } = useAuth();
  const { toast } = useToast();
  
  // Get active tab from URL hash
  const getActiveTab = () => {
    const hash = window.location.hash.slice(1);
    const validTabs = ['profile', 'notifications', 'preferences', 'apis', 'security', 'billing'];
    return validTabs.includes(hash) ? hash : 'profile';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [loading, setLoading] = useState(false);
  
  // Profile state with real user data
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
    email: user?.email || "",
    phone: user?.user_metadata?.phone || "",
    timezone: "America/New_York",
    avatar: user?.user_metadata?.avatar_url || ""
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    telegram: false,
    priceAlerts: true,
    newsUpdates: true,
    marketSummary: true,
    aiInsights: true
  });

  const [preferences, setPreferences] = useState({
    theme: "dark",
    currency: "USD",
    language: "en",
    defaultMarket: "stocks",
    refreshRate: "5",
    chartType: "candlestick"
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: "30",
    loginNotifications: true,
    deviceTracking: true
  });

  // Handle hash change for navigation
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getActiveTab());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
        avatar: user.user_metadata?.avatar_url || ""
      }));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: profile.email,
        data: {
          full_name: profile.name,
          phone: profile.phone,
          avatar_url: profile.avatar
        }
      });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/auth?mode=recovery'
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setLoading(true);
      try {
        await signOut();
        toast({
          title: "Account Deletion",
          description: "Please contact support to complete account deletion.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to initiate account deletion.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and security settings</p>
            </div>
            {subscription?.subscribed && (
              <Badge className="bg-gradient-primary text-white border-0">
                <Crown className="h-3 w-3 mr-1" />
                {subscription.subscription_tier || 'Premium'} Plan
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'billing', label: 'Billing', icon: CreditCard },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'preferences', label: 'Preferences', icon: Eye },
                    { id: 'security', label: 'Security', icon: Lock },
                    { id: 'apis', label: 'API Keys', icon: Settings2 },
                    { id: 'help', label: 'Help & Support', icon: HelpCircle }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          window.location.hash = item.id;
                        }}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors w-full text-left ${
                          activeTab === item.id ? 'bg-accent text-primary' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                      <p className="text-sm text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={profile.timezone} onValueChange={(value) => setProfile({...profile, timezone: value})}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="trading" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing & Subscription */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Subscription & Billing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {subscription?.subscribed ? (
                          <>
                            <Crown className="h-8 w-8 text-yellow-500" />
                            <div>
                              <div className="font-semibold text-lg">
                                {subscription.subscription_tier || 'Premium'} Plan
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {subscription.subscription_end ? 
                                  `Renews ${new Date(subscription.subscription_end).toLocaleDateString()}` :
                                  'Active subscription'
                                }
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <User className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <div className="font-semibold text-lg">Free Plan</div>
                              <div className="text-sm text-muted-foreground">
                                Limited features available
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        {subscription?.subscribed ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                            Free Tier
                          </Badge>
                        )}
                      </div>
                    </div>

                    {subscription?.subscribed ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="flex items-center space-x-2"
                          onClick={handleManageSubscription}
                          disabled={loading}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Manage Subscription</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center space-x-2"
                          onClick={refreshSubscription}
                        >
                          <Download className="h-4 w-4" />
                          <span>Refresh Status</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4 p-6">
                        <h3 className="text-lg font-semibold">Upgrade to Premium</h3>
                        <p className="text-muted-foreground">
                          Get unlimited AI analyses, advanced features, and priority support.
                        </p>
                        <Button 
                          variant="trading" 
                          className="w-full"
                          onClick={() => window.location.href = '/pricing'}
                        >
                          View Plans & Pricing
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Billing History */}
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscription?.subscribed ? (
                      <div className="text-center p-6 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>View detailed billing history in the Stripe Customer Portal</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={handleManageSubscription}
                        >
                          Open Billing Portal
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-6 text-muted-foreground">
                        <p>No billing history available on free plan</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Notification Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-muted-foreground">Receive alerts via email</div>
                          </div>
                        </div>
                        <Switch
                          checked={notifications.email}
                          onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Push Notifications</div>
                            <div className="text-sm text-muted-foreground">Browser push notifications</div>
                          </div>
                        </div>
                        <Switch
                          checked={notifications.push}
                          onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">SMS Notifications</div>
                            <div className="text-sm text-muted-foreground">Text message alerts</div>
                          </div>
                        </div>
                        <Switch
                          checked={notifications.sms}
                          onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Telegram Bot</div>
                            <div className="text-sm text-muted-foreground">Connect Telegram for instant alerts</div>
                          </div>
                        </div>
                        <Switch
                          checked={notifications.telegram}
                          onCheckedChange={(checked) => setNotifications({...notifications, telegram: checked})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Alert Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { key: 'priceAlerts', label: 'Price Alerts', desc: 'When symbols hit your target prices' },
                        { key: 'newsUpdates', label: 'News Updates', desc: 'Breaking financial news and events' },
                        { key: 'marketSummary', label: 'Market Summary', desc: 'Daily market open/close summaries' },
                        { key: 'aiInsights', label: 'AI Insights', desc: 'AI-generated market analysis and signals' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.label}</div>
                            <div className="text-sm text-muted-foreground">{item.desc}</div>
                          </div>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications] as boolean}
                            onCheckedChange={(checked) => setNotifications({...notifications, [item.key]: checked})}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle>App Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="currency">Default Currency</Label>
                      <Select value={preferences.currency} onValueChange={(value) => setPreferences({...preferences, currency: value})}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={preferences.language} onValueChange={(value) => setPreferences({...preferences, language: value})}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="defaultMarket">Default Market</Label>
                      <Select value={preferences.defaultMarket} onValueChange={(value) => setPreferences({...preferences, defaultMarket: value})}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="stocks">Stocks</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="forex">Forex</SelectItem>
                          <SelectItem value="indices">Indices</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="refreshRate">Data Refresh Rate</Label>
                      <Select value={preferences.refreshRate} onValueChange={(value) => setPreferences({...preferences, refreshRate: value})}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="1">1 second</SelectItem>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="chartType">Default Chart Type</Label>
                      <Select value={preferences.chartType} onValueChange={(value) => setPreferences({...preferences, chartType: value})}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="candlestick">Candlestick</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button variant="trading">Save Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* API Keys */}
            {activeTab === 'apis' && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>API Keys & Integrations</span>
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add API Key
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* API Key rows - keep existing implementation */}
                      {[
                        { name: 'TradingView API', desc: 'Real-time charting and market data', icon: Key },
                        { name: 'Stripe API', desc: 'Payment processing and subscriptions', icon: CreditCard },
                        { name: 'Alpha Vantage API', desc: 'Stock market data and indicators', icon: Key },
                        { name: 'Polygon.io API', desc: 'Real-time and historical market data', icon: Key }
                      ].map((api) => (
                        <div key={api.name} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <api.icon className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{api.name}</div>
                              <div className="text-sm text-muted-foreground">{api.desc}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Enter API key"
                              type="password"
                              className="w-40"
                            />
                            <Button size="sm" variant="outline">Save</Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Two-Factor Authentication</div>
                        <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                      </div>
                      <Switch
                        checked={security.twoFactor}
                        onCheckedChange={(checked) => setSecurity({...security, twoFactor: checked})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout</Label>
                      <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity({...security, sessionTimeout: value})}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Login Notifications</div>
                        <div className="text-sm text-muted-foreground">Get notified of new login attempts</div>
                      </div>
                      <Switch
                        checked={security.loginNotifications}
                        onCheckedChange={(checked) => setSecurity({...security, loginNotifications: checked})}
                      />
                    </div>

                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleChangePassword}
                        disabled={loading}
                      >
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full">Download Account Data</Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Help & Support */}
            {activeTab === 'help' && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Help & Support</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto p-6 flex-col space-y-2">
                        <HelpCircle className="h-8 w-8 text-primary" />
                        <span className="font-medium">Documentation</span>
                        <span className="text-sm text-muted-foreground">Learn how to use Capvia</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-6 flex-col space-y-2">
                        <Mail className="h-8 w-8 text-primary" />
                        <span className="font-medium">Contact Support</span>
                        <span className="text-sm text-muted-foreground">Get help from our team</span>
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium mb-2">Quick Tips</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Use keyboard shortcuts for faster navigation</li>
                        <li>• Set up price alerts to never miss opportunities</li>
                        <li>• Customize your dashboard for optimal workflow</li>
                        <li>• Connect multiple data sources for better analysis</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
};