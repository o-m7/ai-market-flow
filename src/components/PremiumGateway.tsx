import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, TrendingUp, BarChart3, Brain, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface PremiumGatewayProps {
  children: React.ReactNode;
  feature: string;
  symbol?: string; // For symbol-specific analysis
}

export function PremiumGateway({ children, feature, symbol }: PremiumGatewayProps) {
  const { user, subscription, loading } = useAuth();
  const { usage, isSubscribed } = useUsageTracking();
  const navigate = useNavigate();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64 px-4">
        <Card className="w-full max-w-md bg-gradient-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to access {feature}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In to Continue
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/auth')}>
                Sign up for free
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has active subscription or trial
  const now = new Date();
  const hasActiveSubscription = subscription?.subscribed;
  const trialEnd = subscription && subscription.subscription_end ? new Date(subscription.subscription_end) : null;
  const isInTrial = trialEnd && now < trialEnd && !hasActiveSubscription;
  const trialExpired = trialEnd && now > trialEnd && !hasActiveSubscription;

  // If user is subscribed or in trial, show the content
  if (hasActiveSubscription || isInTrial) {
    return <>{children}</>;
  }

  // For free users, check usage limits for AI analysis features
  if (feature.includes('AI') || feature.includes('analysis')) {
    const canUse = symbol ? usage.canAnalyzeSymbol(symbol) : usage.remainingAnalyses > 0;
    
    if (canUse) {
      return <>{children}</>;
    }

    // Show usage limit reached message
    return (
      <div className="flex items-center justify-center min-h-64 px-4">
        <Card className="w-full max-w-2xl bg-gradient-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">Daily Limit Reached</CardTitle>
            <CardDescription className="text-base">
              {symbol && !usage.symbolsAnalyzed.includes(symbol) && usage.symbolsAnalyzed.length >= 5
                ? `You've reached the limit of 5 different symbols per day. You can still analyze: ${usage.symbolsAnalyzed.join(', ')}`
                : `You've used all ${usage.remainingAnalyses + usage.dailyAnalysisCount} AI analyses for today. Upgrade to Premium for unlimited access.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">{usage.dailyAnalysisCount}/5</div>
                  <div className="text-muted-foreground">Analyses Used</div>
                </div>
                <div>
                  <div className="font-semibold">{usage.symbolsAnalyzed.length}/5</div>
                  <div className="text-muted-foreground">Symbols Analyzed</div>
                </div>
              </div>
              {usage.symbolsAnalyzed.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Today's symbols:</div>
                  <div className="text-xs font-medium">{usage.symbolsAnalyzed.join(', ')}</div>
                </div>
              )}
            </div>

            <Button 
              onClick={() => navigate('/pricing')} 
              className="w-full h-12 text-base font-semibold"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Your limits reset daily at midnight UTC
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show trial expired or premium required
  return (
    <div className="flex items-center justify-center min-h-64 px-4">
      <Card className="w-full max-w-2xl bg-gradient-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className="bg-gradient-primary text-background font-medium">
              Premium Feature
            </Badge>
            {trialExpired && (
              <Badge variant="destructive">
                Trial Expired
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl">
            {trialExpired ? 'Trial Period Ended' : 'Upgrade to Premium'}
          </CardTitle>
          <CardDescription className="text-base">
            {trialExpired 
              ? `Your free trial has expired. Upgrade to continue using ${feature}`
              : `Get unlimited access to ${feature} and unlock advanced trading tools`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Real-Time Data</h4>
              <p className="text-xs text-muted-foreground">Live market updates</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <Brain className="h-6 w-6 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-sm">AI Analysis</h4>
              <p className="text-xs text-muted-foreground">Advanced insights</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Advanced Charts</h4>
              <p className="text-xs text-muted-foreground">Professional tools</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/pricing')} 
              className="w-full h-12 text-base font-semibold"
            >
              <Crown className="h-5 w-5 mr-2" />
              {trialExpired ? 'Reactivate Premium' : 'Start Free Trial'}
            </Button>
            
            {!trialExpired && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">7-day free trial</span>
                  <span>• No credit card required</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Questions? Contact us at{' '}
              <span className="text-primary font-medium">support@flowdesk.com</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}