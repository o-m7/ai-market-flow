// Trading overlays and risk badges for enhanced chart analysis

export function generateTradingOverlays(analysis: any, aiResult: any, currentPrice: number) {
  const overlays: any = {
    horizontalLines: []
  };

  // Add entry, stop, and target lines from AI analysis
  if (aiResult?.trade_idea) {
    const { entry, stop, targets } = aiResult.trade_idea;
    
    if (entry) {
      overlays.entry = entry;
      overlays.horizontalLines.push({
        price: entry,
        label: `Entry: ${entry.toFixed(5)}`,
        color: '#2563eb', // Blue
        style: 'solid'
      });
    }

    if (stop) {
      overlays.stop = stop;
      overlays.horizontalLines.push({
        price: stop,
        label: `Stop: ${stop.toFixed(5)}`,
        color: '#dc2626', // Red
        style: 'solid'
      });
    }

    if (targets && targets.length > 0) {
      overlays.targets = targets;
      targets.forEach((target: number, index: number) => {
        overlays.horizontalLines.push({
          price: target,
          label: `T${index + 1}: ${target.toFixed(5)}`,
          color: '#16a34a', // Green
          style: index === 0 ? 'solid' : 'dashed'
        });
      });
    }
  }

  // Add support and resistance levels
  if (analysis.keyLevels) {
    analysis.keyLevels.support?.forEach((level: number, index: number) => {
      overlays.horizontalLines.push({
        price: level,
        label: `S${index + 1}: ${level.toFixed(5)}`,
        color: '#059669', // Green (support)
        style: 'dotted'
      });
    });

    analysis.keyLevels.resistance?.forEach((level: number, index: number) => {
      overlays.horizontalLines.push({
        price: level,
        label: `R${index + 1}: ${level.toFixed(5)}`,
        color: '#dc2626', // Red (resistance)
        style: 'dotted'
      });
    });
  }

  // Add VWAP if available
  if (aiResult?.levels?.vwap) {
    overlays.horizontalLines.push({
      price: aiResult.levels.vwap,
      label: `VWAP: ${aiResult.levels.vwap.toFixed(5)}`,
      color: '#7c3aed', // Purple
      style: 'dashed'
    });
  }

  return overlays;
}

export function generateRiskBadges(symbol: string, features: any) {
  const badges: Array<{
    type: 'EVENT_RISK' | 'HIGH_VOL' | 'SPREAD_WIDE' | 'STALE_DATA';
    active: boolean;
    reason?: string;
  }> = [];

  if (!features) {
    return badges;
  }

  // Event risk badge
  badges.push({
    type: 'EVENT_RISK',
    active: features.news?.event_risk || false,
    reason: features.news?.event_risk ? 
      `${features.news.headline_hits_30m} risk headlines detected` : undefined
  });

  // High volatility badge
  badges.push({
    type: 'HIGH_VOL',
    active: features.volatility?.atr_percentile_60d >= 0.8,
    reason: features.volatility?.atr_percentile_60d >= 0.8 ? 
      `ATR in ${Math.round(features.volatility.atr_percentile_60d * 100)}th percentile` : undefined
  });

  // Wide spread badge
  badges.push({
    type: 'SPREAD_WIDE',
    active: features.spread_percentile_30d >= 0.8,
    reason: features.spread_percentile_30d >= 0.8 ? 
      `Spread in ${Math.round(features.spread_percentile_30d * 100)}th percentile` : undefined
  });

  // Stale data badge
  badges.push({
    type: 'STALE_DATA',
    active: features.stale || features.price_age_ms > 2000,
    reason: features.stale ? 
      `Price data ${Math.round(features.price_age_ms / 1000)}s old` : undefined
  });

  return badges;
}

export function getHoldReason(badges: any[], aiResult: any): string {
  const activeReasons: string[] = [];

  badges.forEach(badge => {
    if (badge.active) {
      switch (badge.type) {
        case 'EVENT_RISK':
          activeReasons.push('News event risk');
          break;
        case 'HIGH_VOL':
          activeReasons.push('High volatility');
          break;
        case 'SPREAD_WIDE':
          activeReasons.push('Wide spreads');
          break;
        case 'STALE_DATA':
          activeReasons.push('Stale price data');
          break;
      }
    }
  });

  if (activeReasons.length > 0) {
    return `Hold due to: ${activeReasons.join(', ')}`;
  }

  // Check for technical reasons from AI
  if (aiResult?.action === 'hold') {
    return aiResult.risks || 'Mixed technical signals';
  }

  return 'No clear directional bias';
}