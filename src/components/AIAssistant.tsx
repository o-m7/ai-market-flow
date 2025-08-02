import { useState } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Mock Fear & Greed Index data
  const fearGreedIndex = {
    value: 68,
    label: "Greed",
    lastUpdated: "2 hours ago"
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: `Hi! I'm your AI day trading assistant. Current Fear & Greed Index: ${fearGreedIndex.value} (${fearGreedIndex.label}). Ask me about scalp setups, momentum plays, breakout patterns, or intraday analysis for quick trades.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate AI response with day trading analysis
    setTimeout(() => {
      let response = "I'm analyzing intraday patterns for you. ";
      
      if (inputValue.toLowerCase().includes("fear") || inputValue.toLowerCase().includes("greed")) {
        response = `Current Fear & Greed Index is ${fearGreedIndex.value} (${fearGreedIndex.label}), indicating ${fearGreedIndex.value > 50 ? 'market greed' : 'market fear'}. For day trading: ${fearGreedIndex.value > 70 ? 'watch for reversal patterns and momentum fades' : fearGreedIndex.value < 30 ? 'look for oversold bounces and dip-buying opportunities' : 'balanced conditions favor range trading'}.`;
      } else if (inputValue.toLowerCase().includes("sentiment")) {
        response = `Market sentiment analysis: Fear & Greed Index at ${fearGreedIndex.value} shows ${fearGreedIndex.label.toLowerCase()}. For intraday trades: ${fearGreedIndex.value > 60 ? 'consider fade strategies on extended moves' : 'momentum strategies may work well with supportive sentiment'}.`;
      } else if (inputValue.toLowerCase().includes("scalp") || inputValue.toLowerCase().includes("quick")) {
        response = `Scalping conditions: Fear & Greed at ${fearGreedIndex.value} suggests ${fearGreedIndex.value > 50 ? 'high volatility - perfect for quick scalps on momentum' : 'lower volatility - focus on range-bound scalping strategies'}.`;
      } else if (inputValue.toLowerCase().includes("momentum") || inputValue.toLowerCase().includes("breakout")) {
        response = `Momentum analysis: Current sentiment (F&G: ${fearGreedIndex.value}) indicates ${fearGreedIndex.value > 60 ? 'strong momentum potential - look for continuation patterns' : 'weak momentum - wait for clear breakout confirmations'}.`;
      } else {
        response += `Based on current intraday indicators and Fear & Greed Index (${fearGreedIndex.value}), here's what I found for today's trading...`;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 w-96 h-96 bg-gradient-card border-border shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Bot className="h-5 w-5 mr-2 text-primary" />
                AI Day Trading Assistant
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Fear & Greed Index */}
            <div className="flex items-center justify-between text-xs bg-secondary/50 rounded p-2 mt-2">
              <span className="text-muted-foreground">Fear & Greed Index:</span>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${fearGreedIndex.value > 50 ? 'text-bull' : 'text-bear'}`}>
                  {fearGreedIndex.value}
                </span>
                <span className="text-muted-foreground">({fearGreedIndex.label})</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col h-full pb-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === "ai" && (
                        <Bot className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      )}
                      {message.type === "user" && (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about scalps, momentum, breakouts, or intraday setups..."
                className="flex-1 bg-secondary border-border"
              />
              <Button onClick={handleSendMessage} size="icon" className="bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 animate-glow-bull z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  );
};