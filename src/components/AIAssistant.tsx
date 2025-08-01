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
      content: `Hi! I'm your AI trading assistant. Current Fear & Greed Index: ${fearGreedIndex.value} (${fearGreedIndex.label}). Ask me about market sentiment, technical analysis, or any symbols you're interested in.`,
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

    // Simulate AI response with market analysis
    setTimeout(() => {
      let response = "I'm analyzing the market data for you. ";
      
      if (inputValue.toLowerCase().includes("fear") || inputValue.toLowerCase().includes("greed")) {
        response = `Current Fear & Greed Index is ${fearGreedIndex.value} (${fearGreedIndex.label}), indicating ${fearGreedIndex.value > 50 ? 'market greed' : 'market fear'}. This suggests ${fearGreedIndex.value > 70 ? 'potential overvaluation' : fearGreedIndex.value < 30 ? 'potential buying opportunity' : 'balanced market sentiment'}.`;
      } else if (inputValue.toLowerCase().includes("sentiment")) {
        response = `Market sentiment analysis: Fear & Greed Index at ${fearGreedIndex.value} shows ${fearGreedIndex.label.toLowerCase()}. Combined with technical indicators, this suggests ${fearGreedIndex.value > 60 ? 'cautious optimism with potential correction risk' : 'opportunity for value investors'}.`;
      } else {
        response += `Based on current indicators and Fear & Greed Index (${fearGreedIndex.value}), here's what I found...`;
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
                AI Trading Assistant
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
                placeholder="Ask about markets, signals, or analysis..."
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