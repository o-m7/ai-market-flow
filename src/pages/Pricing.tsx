import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Settings, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'month',
    priceId: null,
    description: 'Perfect for getting started',
    features: [
      '5 AI analyses per day',
      'Up to 5 symbols of your choice',
      'Basic technical indicators',
      'Email support',
    ],
    icon: Zap,
    popular: false,
  },
  {
    name: 'Premium Monthly',
    price: '$29.99',
    period: 'month',
    priceId: 'price_monthly_2999', // Replace with your actual Stripe price ID
    description: 'For serious traders and analysts',
    features: [
      'Unlimited AI analyses',
      'Unlimited symbols',
      'Advanced technical indicators',
      'Real-time alerts',
      'Priority support',
      'Portfolio tracking',
      'Custom strategies',
      'Advanced backtesting',
    ],
    icon: Crown,
    popular: true,
  },
  {
    name: 'Premium Yearly',
    price: '$287.90',
    originalPrice: '$359.88',
    period: 'year',
    priceId: 'price_yearly_28790', // Replace with your actual Stripe price ID
    description: 'Best value - Save 20%!',
    features: [
      'Everything in Premium Monthly',
      'Unlimited AI analyses',
      'Unlimited symbols',
      'Advanced technical indicators',
      'Real-time alerts',
      'Priority support',
      'Portfolio tracking',
      'Custom strategies',
      'Advanced backtesting',
      '2 months free',
    ],
    icon: Crown,
    popular: false,
    discount: '20% OFF',
  },
];

export default function Pricing() {
  const { user, session, subscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!plan.priceId) {
      toast({
        title: 'Already Free',
        description: 'You are already on the free plan.',
      });
      return;
    }

    setLoading(plan.name);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.priceId, tier: plan.name },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast({
        title: 'Checkout Failed',
        description: error.message || 'Unable to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading('manage');
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      
      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Unable to open customer portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Trading Edge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock professional-grade AI market analysis and take your trading to the next level
          </p>
        </div>

        {/* Current Subscription Status */}
        {user && subscription && (
          <div className="mb-12">
            <Card className="max-w-md mx-auto bg-primary/5 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  {subscription.subscribed ? (
                    <>
                      <Badge variant="default" className="mb-2">
                        {subscription.subscription_tier}
                      </Badge>
                      <br />
                      {subscription.subscription_end && (
                        <span className="text-sm">
                          Renews on {new Date(subscription.subscription_end).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary">Free Plan</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {subscription.subscribed ? (
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={loading === 'manage'}
                    variant="outline"
                    className="w-full"
                  >
                    {loading === 'manage' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Upgrade to unlock unlimited AI analysis
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular
                  ? 'border-primary shadow-lg scale-105 bg-primary/5'
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {plan.discount && (
                <Badge variant="secondary" className="absolute -top-3 right-4 bg-green-500 text-white">
                  {plan.discount}
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <plan.icon 
                    className={`h-12 w-12 ${
                      plan.popular ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-4xl font-bold">
                  {plan.price}
                  <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-sm text-muted-foreground line-through">
                    Was {plan.originalPrice}/{plan.period}
                  </div>
                )}
                <CardDescription className="text-base mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={
                    loading === plan.name || 
                    !user || 
                    (subscription?.subscription_tier === plan.name) ||
                    (plan.name === 'Free' && !subscription?.subscribed)
                  }
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                  variant={plan.popular ? 'default' : 'secondary'}
                >
                  {loading === plan.name ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : subscription?.subscription_tier === plan.name ? (
                    'Current Plan'
                  ) : plan.name === 'Free' && !subscription?.subscribed ? (
                    'Current Plan'
                  ) : !user ? (
                    'Sign In to Subscribe'
                  ) : (
                    <>
                      {plan.priceId ? 'Subscribe Now' : 'Current Plan'}
                      {plan.priceId && <ArrowRight className="h-4 w-4 ml-2" />}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
          <p className="text-sm text-muted-foreground">
            Need help choosing? Contact us at support@alphaedge.com
          </p>
        </div>
      </div>
    </div>
  );
}