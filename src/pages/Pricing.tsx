import { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Zap } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': any;
    }
  }
}

export default function Pricing() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    document.body.appendChild(script);

    return () => {
      // Cleanup script if needed
      const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Trading Edge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Unlock professional-grade AI market analysis and take your trading to the next level
          </p>
        </div>

        {/* Free vs Premium Comparison */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="border-border">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Free Plan</CardTitle>
              <div className="text-4xl font-bold">
                $0
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <CardDescription className="text-base mt-2">
                Perfect for getting started
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">5 AI analyses per day</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Up to 5 symbols of your choice</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Basic technical indicators</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Email support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative border-primary shadow-lg scale-105 bg-primary/5">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              Most Popular
            </Badge>
            
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <Crown className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Premium Plan</CardTitle>
              <div className="text-4xl font-bold">
                $19
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <CardDescription className="text-base mt-2">
                For serious traders and analysts
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited AI analyses</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited symbols</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Advanced technical indicators</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Real-time alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Portfolio tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Custom strategies</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Pricing Table */}
        <div className="max-w-4xl mx-auto">
          <stripe-pricing-table 
            pricing-table-id="prctbl_1RzLbPRfOhymzkuWk6kxKyiF"
            publishable-key="pk_live_51Rv2uTRfOhymzkuW6M8Kf6QXuaI8P17SGTbPGEmFj2mf0nRmjq3KA9tmi4s0a6hR5HZpYNJIGfsd0OACEwSUbjwe00046jhAXr"
          />
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
          <p className="text-sm text-muted-foreground">
            Need help choosing? Contact us at support@example.com
          </p>
        </div>
      </div>
    </div>
  );
}