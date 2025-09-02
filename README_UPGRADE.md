# MVP to Real-World TA Upgrade

This document describes the major upgrades implemented to transform the MVP into a production-ready technical analysis system.

## Overview

The system has been upgraded from basic market data fetching to a comprehensive real-world trading analysis platform with:

- **Enriched market features** (live quotes, order flow, volatility regimes, sessions)
- **News risk gates** (converting headlines to numeric risk flags)
- **Deterministic AI signals** (consistent, rule-based analysis via OpenAI function calling)
- **Real-time streaming** (1-2s cadence with enriched features)
- **Trading overlays** (entry/stop/target lines and risk badges)

## New Payload Shapes

### 1. polygon-market-data (Enriched Mode)

**Input:**
```json
{
  "symbol": "USDCAD",
  "market": "forex", 
  "tf": "1h"
}
```

**Output:**
```json
{
  "symbol": "USDCAD",
  "market": "forex",
  "tf": "1h",
  "current": 1.37410,
  "price_age_ms": 412,
  "spread": 0.00018,
  "spread_percentile_30d": 0.82,
  "stale": false,
  "order_flow": {
    "quote_imbalance": 0.41,
    "trade_imbalance": null
  },
  "volatility": {
    "atr14_1h": 0.001631,
    "atr_percentile_60d": 0.73,
    "session": "London"
  },
  "higher_timeframe": {
    "h4": { "ema20": 1.3735, "ema50": 1.3728, "ema200": 1.3701, "rsi14": 58.2, "vwap": 1.3742 },
    "daily": { "ema20": 1.3739, "ema50": 1.3721, "ema200": 1.3695, "rsi14": 61.5, "vwap": 1.3738 }
  },
  "levels": {
    "support": [1.3735, 1.3728, 1.3715],
    "resistance": [1.3748, 1.3756, 1.3764],
    "vwap": 1.37467
  },
  "technical": {
    "ema20": 1.37401, "ema50": 1.37389, "ema200": 1.37298,
    "rsi14": 56.8,
    "macd": { "line": 0.00023, "signal": 0.00018, "hist": 0.00005 },
    "atr14": 0.00163,
    "bb": { "mid": 1.37405, "upper": 1.37568, "lower": 1.37242 }
  }
}
```

### 2. news-gate

**Input:**
```json
{
  "base": "USD",
  "quote": "CAD", 
  "lookback_minutes": 30
}
```

**Output:**
```json
{
  "event_risk": true,
  "headline_hits_30m": 3,
  "analyzed_at": "2025-09-02T21:30:00.000Z",
  "lookback_minutes": 30,
  "base": "USD",
  "quote": "CAD"
}
```

### 3. ai-analyze (Deterministic)

**Input:**
```json
{
  "symbol": "USDCAD",
  "timeframe": "1h",
  "market": "forex", 
  "features": { /* enriched features from polygon-market-data */ },
  "news": { /* risk flags from news-gate */ }
}
```

**Output:**
```json
{
  "summary": "USDCAD: Bullish trend (EMA20>50>200), RSI neutral at 56.8, MACD positive momentum",
  "action": "buy",
  "action_text": "BUY — Pullback to EMA50 support with bullish MACD cross",
  "outlook": "bullish",
  "levels": {
    "support": [1.37350, 1.37280, 1.37150],
    "resistance": [1.37480, 1.37560, 1.37640]
  },
  "fibonacci": {
    "pivot_high": 1.37640,
    "pivot_low": 1.37150,
    "retracements": {
      "23.6": 1.37524, "38.2": 1.37453, "50.0": 1.37395,
      "61.8": 1.37337, "78.6": 1.37259
    },
    "extensions": {
      "127.2": 1.37772, "161.8": 1.37924
    },
    "direction": "up"
  },
  "trade_idea": {
    "direction": "long",
    "entry": 1.37410,
    "stop": 1.37310,
    "targets": [1.37573, 1.37736],
    "rationale": "• EMA trend alignment • MACD bullish cross • Support bounce • RR 1:2.3",
    "time_horizon": "intraday", 
    "setup_type": "pullback",
    "rr_estimate": 2.3
  },
  "technical": {
    "ema20": 1.37401, "ema50": 1.37389, "ema200": 1.37298,
    "rsi14": 56.8,
    "macd": { "line": 0.00023, "signal": 0.00018, "hist": 0.00005 },
    "atr14": 0.00163,
    "bb": { "mid": 1.37405, "upper": 1.37568, "lower": 1.37242 }
  },
  "confidence_model": 78,
  "confidence_calibrated": 72,
  "evidence": ["EMA trend alignment", "MACD bullish momentum", "Support level bounce"],
  "risks": "News event risk present (3 headlines), monitor for volatility",
  "timeframe_profile": {
    "scalp": { "entry": 1.37410, "stop": 1.37328, "targets": [1.37492] },
    "intraday": { "entry": 1.37410, "stop": 1.37310, "targets": [1.37573, 1.37736] },
    "swing": { "entry": 1.37410, "stop": 1.37247, "targets": [1.37736, 1.38062] }
  },
  "json_version": "1.0.0"
}
```

### 4. realtime-market-stream (Enhanced)

**Broadcast Payload:**
```json
{
  "type": "market_update",
  "data": [{
    "symbol": "USDCAD",
    "price": 1.37410,
    "change": 0.00023,
    "changePercent": 0.017,
    "features": {
      "spread": 0.00018,
      "stale": false,
      "session": "London",
      "rsi": 56.8,
      "atr": 0.00163,
      "trend": "bullish",
      "levels": { "support": [1.3735], "resistance": [1.3748] }
    },
    "news_risk": { "event_risk": true, "headline_hits_30m": 3 }
  }],
  "timestamp": "2025-09-02T21:30:00.000Z"
}
```

### 5. ai-chart-analysis (With Overlays)

**Enhanced Output:**
```json
{
  "symbol": "USDCAD",
  "analysis": "Technical analysis...",
  "recommendation": "buy",
  "confidence": 72,
  "tradingOverlays": {
    "entry": 1.37410,
    "stop": 1.37310, 
    "targets": [1.37573, 1.37736],
    "horizontalLines": [
      { "price": 1.37410, "label": "Entry: 1.37410", "color": "#2563eb", "style": "solid" },
      { "price": 1.37310, "label": "Stop: 1.37310", "color": "#dc2626", "style": "solid" },
      { "price": 1.37573, "label": "T1: 1.37573", "color": "#16a34a", "style": "solid" },
      { "price": 1.37736, "label": "T2: 1.37736", "color": "#16a34a", "style": "dashed" }
    ]
  },
  "riskBadges": [
    { "type": "EVENT_RISK", "active": true, "reason": "3 risk headlines" },
    { "type": "HIGH_VOL", "active": false },
    { "type": "SPREAD_WIDE", "active": false },
    { "type": "STALE_DATA", "active": false }
  ]
}
```

## Risk Flags System

The system now includes automatic risk detection that can suppress signals:

- **event_risk**: News events detected (Fed, ECB, CPI, rate decisions)
- **stale**: Price data >1.5s old
- **spread_wide**: Spread in 80th+ percentile
- **high_vol**: ATR in 80th+ percentile  
- **order_flow_against**: Strong imbalance against signal direction

When any risk flag is active, the AI defaults to `"action": "hold"` with the reason provided.

## Deterministic Rules

The ai-analyze function now applies rules in strict order:

1. **Trend**: EMA20 > EMA50 > EMA200 = bullish
2. **Momentum**: RSI levels + MACD histogram thresholds
3. **Level Proximity**: Current price within 0.15×ATR of support/resistance
4. **Session/Volatility Gates**: Asia+low ATR = suppress breakouts
5. **Risk Gates**: Event risk, stale data, wide spreads → HOLD
6. **Signal Decision**: Rule-based BUY/SELL/HOLD logic
7. **Stops/Targets**: ATR-based with minimum 1.5:1 risk-reward

## Testing & Debug

- **polygon-debug?route=inputs-for-ai&symbol=USDCAD** - Shows exact AI input payload
- **metrics-log** - Logs all AI inputs/outputs for walk-forward analysis
- All functions include comprehensive error handling and fallbacks

## Backward Compatibility

- Legacy batch symbols requests to polygon-market-data still work
- All existing endpoints remain functional
- New features are additive and optional

## Performance

- Real-time updates every 2 seconds (down from 30s)
- Enriched features cached where possible
- Deterministic AI reduces hallucination and improves consistency
- Function calling ensures valid JSON output structure