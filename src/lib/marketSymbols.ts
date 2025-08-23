// Market symbols organized by type for different asset classes
export const MARKET_SYMBOLS = {
  stocks: [
    'AAPL',  // Apple
    'MSFT',  // Microsoft
    'GOOGL', // Alphabet
    'AMZN',  // Amazon
    'TSLA',  // Tesla
    'NVDA',  // NVIDIA
    'META',  // Meta
    'NFLX',  // Netflix
    'DIS',   // Disney
    'BABA',  // Alibaba
  ],
  crypto: [
    'BTC/USD',   // Bitcoin
    'ETH/USD',   // Ethereum
    'BNB/USD',   // Binance Coin
    'XRP/USD',   // Ripple
    'ADA/USD',   // Cardano
    'SOL/USD',   // Solana
    'DOT/USD',   // Polkadot
    'MATIC/USD', // Polygon
    'AVAX/USD',  // Avalanche
    'LINK/USD',  // Chainlink
  ],
  forex: [
    'EUR/USD',  // Euro to US Dollar
    'GBP/USD',  // British Pound to US Dollar
    'USD/JPY',  // US Dollar to Japanese Yen
    'USD/CHF',  // US Dollar to Swiss Franc
    'AUD/USD',  // Australian Dollar to US Dollar
    'USD/CAD',  // US Dollar to Canadian Dollar
    'NZD/USD',  // New Zealand Dollar to US Dollar
    'EUR/GBP',  // Euro to British Pound
    'EUR/JPY',  // Euro to Japanese Yen
    'GBP/JPY',  // British Pound to Japanese Yen
  ],
  indices: [
    'SPY',   // S&P 500 ETF
    'QQQ',   // NASDAQ ETF
    'DIA',   // Dow Jones ETF
    'IWM',   // Russell 2000 ETF
    'VTI',   // Total Stock Market ETF
    'EFA',   // EAFE ETF
    'EEM',   // Emerging Markets ETF
    'GLD',   // Gold ETF
    'SLV',   // Silver ETF
    'USO',   // Oil ETF
  ]
};

export function getSymbolsByMarketType(marketType: string): string[] {
  switch (marketType) {
    case 'crypto':
      return MARKET_SYMBOLS.crypto.slice(0, 5);
    case 'forex':
      return MARKET_SYMBOLS.forex.slice(0, 5);
    case 'stocks':
    case 'indices':
      // Temporarily disabled
      return [];
    case 'all':
    default:
      // Focus on crypto + forex only
      return [
        ...MARKET_SYMBOLS.crypto.slice(0, 3),
        ...MARKET_SYMBOLS.forex.slice(0, 2)
      ];
  }
}