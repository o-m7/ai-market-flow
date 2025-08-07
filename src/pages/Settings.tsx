import { useState } from "react";
import { User, Bell, Smartphone, Mail, MessageSquare, Lock, Eye, CreditCard, HelpCircle, Settings2, Key, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Navigation } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";

export const Settings = () => {
  const [profile, setProfile] = useState({
    name: "John Trader",
    email: "john.trader@email.com",
    phone: "+1 (555) 123-4567",
    timezone: "America/New_York",
    avatar: ""
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <a href="#profile" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </a>
                  <a href="#notifications" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </a>
                  <a href="#preferences" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <Eye className="h-4 w-4" />
                    <span>Preferences</span>
                  </a>
                  <a href="#security" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <Lock className="h-4 w-4" />
                    <span>Security</span>
                  </a>
                  <a href="#apis" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <Settings2 className="h-4 w-4" />
                    <span>API Keys</span>
                  </a>
                  <a href="#billing" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <CreditCard className="h-4 w-4" />
                    <span>Billing</span>
                  </a>
                  <a href="#help" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8 bg-secondary">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="apis">API Keys</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* Profile Settings */}
              <TabsContent value="profile">
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
                      <Button variant="trading">Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications">
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
              </TabsContent>

              {/* Preferences */}
              <TabsContent value="preferences">
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
              </TabsContent>

              {/* API Keys */}
              <TabsContent value="apis">
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
                        {/* TradingView API */}
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Key className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">TradingView API</div>
                              <div className="text-sm text-muted-foreground">Real-time charting and market data</div>
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

                        {/* Stripe API */}
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">Stripe API</div>
                              <div className="text-sm text-muted-foreground">Payment processing and subscriptions</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Enter secret key"
                              type="password"
                              className="w-40"
                            />
                            <Button size="sm" variant="outline">Save</Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Alpha Vantage API */}
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Key className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">Alpha Vantage API</div>
                              <div className="text-sm text-muted-foreground">Stock market data and indicators</div>
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

                        {/* Polygon.io API */}
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Key className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">Polygon.io API</div>
                              <div className="text-sm text-muted-foreground">Real-time and historical market data</div>
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
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle>Popular APIs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Market Data</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>• TradingView - Advanced charting</div>
                            <div>• Alpha Vantage - Real-time quotes</div>
                            <div>• Polygon.io - Market data API</div>
                            <div>• Finnhub - Stock fundamentals</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Payment & Trading</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>• Stripe - Payment processing</div>
                            <div>• Alpaca - Commission-free trading</div>
                            <div>• Interactive Brokers - Professional trading</div>
                            <div>• TD Ameritrade - Trading API</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security */}
              <TabsContent value="security">
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
                        <Button variant="outline" className="w-full">Change Password</Button>
                        <Button variant="outline" className="w-full">Download Account Data</Button>
                        <Button variant="destructive" className="w-full">Delete Account</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
};