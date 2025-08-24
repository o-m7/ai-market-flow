import { AlertTriangle } from "lucide-react";

export const DisclaimerFooter = () => {
  return (
    <footer className="border-t border-border bg-muted/50 mt-8">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <p className="text-center">
            This is a trading analysis tool only. Not financial advice or trading signals. 
            Each person bears all risk when entering trades. Trade at your own risk.
          </p>
        </div>
      </div>
    </footer>
  );
};