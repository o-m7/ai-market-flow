import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';

export default function PaymentCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gradient-card border-border text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">
              Payment Canceled
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Your payment was canceled and no charges were made.
              </p>
              <p className="text-sm text-muted-foreground">
                You can try again anytime or continue with the free plan.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/pricing')} 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')} 
                className="w-full"
              >
                Continue with Free Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Need help? Contact support at support@flowdesk.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}