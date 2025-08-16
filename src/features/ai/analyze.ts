export type AnalysisRequest = {
  symbol: string;
  timeframe: string;           // '1m'|'5m'|'15m'|'1h'|'4h'|'1d'
  market: 'STOCK'|'CRYPTO'|'FOREX';
  candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>;
};

export async function analyzeWithAI(payload: AnalysisRequest) {
  const url = `https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/ai-analyze`;

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`AI analyze failed: ${r.status} ${r.statusText} - ${errorText}`);
  }
  
  return r.json(); // { summary, outlook, levels, trade_idea, confidence, risks, json_version }
}