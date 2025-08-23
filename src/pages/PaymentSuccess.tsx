import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';

export default function PaymentSuccess() {
  const { refreshSubscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh subscription status after successful payment
    refreshSubscription();
  }, [refreshSubscription]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gradient-card border-border text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Welcome to Premium!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Your payment was successful and your Premium subscription is now active.
              </p>
              <p className="text-sm text-muted-foreground">
                You now have unlimited access to AI analysis, real-time data, and all premium features.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full"
              >
                Start Trading
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/pricing')} 
                className="w-full"
              >
                Manage Subscription
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Questions? Contact support at support@flowdesk.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}