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
    'UNI/USD',   // Uniswap
    'ATOM/USD',  // Cosmos
    'ALGO/USD',  // Algorand
    'VET/USD',   // VeChain
    'ICP/USD',   // Internet Computer
    'FIL/USD',   // Filecoin
    'THETA/USD', // Theta Network
    'TRX/USD',   // TRON
    'ETC/USD',   // Ethereum Classic
    'XMR/USD',   // Monero
    'BCH/USD',   // Bitcoin Cash
    'LTC/USD',   // Litecoin
    'DOGE/USD',  // Dogecoin
    'SHIB/USD',  // Shiba Inu
    'NEAR/USD',  // NEAR Protocol
    'FTM/USD',   // Fantom
    'SAND/USD',  // The Sandbox
    'MANA/USD',  // Decentraland
    'CRV/USD',   // Curve DAO
    'AAVE/USD',  // Aave
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
    'AUD/JPY',  // Australian Dollar to Japanese Yen
    'EUR/CHF',  // Euro to Swiss Franc
    'GBP/CHF',  // British Pound to Swiss Franc
    'CHF/JPY',  // Swiss Franc to Japanese Yen
    'CAD/JPY',  // Canadian Dollar to Japanese Yen
    'EUR/AUD',  // Euro to Australian Dollar
    'GBP/AUD',  // British Pound to Australian Dollar
    'AUD/CHF',  // Australian Dollar to Swiss Franc
    'NZD/JPY',  // New Zealand Dollar to Japanese Yen
    'EUR/CAD',  // Euro to Canadian Dollar
    'GBP/CAD',  // British Pound to Canadian Dollar
    'AUD/CAD',  // Australian Dollar to Canadian Dollar
    'EUR/NZD',  // Euro to New Zealand Dollar
    'GBP/NZD',  // British Pound to New Zealand Dollar
    'USD/SEK',  // US Dollar to Swedish Krona
    'USD/NOK',  // US Dollar to Norwegian Krone
    'USD/DKK',  // US Dollar to Danish Krone
    'EUR/SEK',  // Euro to Swedish Krona
    'EUR/NOK',  // Euro to Norwegian Krone
    'GBP/SEK',  // British Pound to Swedish Krona
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
  console.log('getSymbolsByMarketType called with:', marketType);
  
  let result: string[];
  switch (marketType) {
    case 'crypto':
      result = MARKET_SYMBOLS.crypto;
      break;
    case 'forex':
      result = MARKET_SYMBOLS.forex;
      break;
    case 'stocks':
      result = MARKET_SYMBOLS.stocks;
      break;
    case 'indices':
      result = MARKET_SYMBOLS.indices;
      break;
    case 'all':
    default:
      // Focus on crypto + forex only - show top symbols
      result = [
        ...MARKET_SYMBOLS.crypto.slice(0, 15),
        ...MARKET_SYMBOLS.forex.slice(0, 7)
      ];
      break;
  }
  
  console.log('Returning symbols for', marketType, ':', result);
  return result;
}