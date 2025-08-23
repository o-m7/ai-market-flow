import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlanDetails {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  originalPrice?: string;
  discount?: string;
}

const planDetails: Record<string, PlanDetails> = {
  'price_monthly_2999': {
    name: 'Premium Monthly',
    price: '$29.99',
    period: 'month',
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
  },
  'price_yearly_28790': {
    name: 'Premium Yearly',
    price: '$287.90',
    originalPrice: '$359.88',
    period: 'year',
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
    discount: '20% OFF',
  },
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const priceId = searchParams.get('price');
  const plan = priceId ? planDetails[priceId as keyof typeof planDetails] : null;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!priceId || !plan) {
      navigate('/pricing');
    }
  }, [priceId, plan, navigate]);

  const handleCheckout = async () => {
    if (!user || !priceId) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, tier: plan?.name },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: 'Checkout Failed',
        description: error.message || 'Unable to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pricing')}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-muted-foreground">
              You're about to upgrade to {plan.name}
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Crown className="h-12 w-12 text-primary" />
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
              {plan.discount && (
                <Badge className="mt-2 bg-green-500 text-white">
                  {plan.discount}
                </Badge>
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
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment is processed securely by Stripe. You can cancel anytime.
                </p>
              </div>
              
              <Button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                By proceeding, you agree to our terms of service and privacy policy.
                You'll be redirected to Stripe for secure payment processing.
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              🔒 Secure 256-bit SSL encryption
            </p>
            <p className="text-sm text-muted-foreground">
              Need help? Contact us at support@alphaedge.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}