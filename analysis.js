// ═══════════════════════════════════════
// NSE PRO V5 — Analysis Engine
// Market Regime + Time-of-Day + Risk
// ═══════════════════════════════════════

var AnalysisEngine = (function(){

  // ── MARKET REGIME ──
  function getRegime(stocks){
    if(!stocks || !stocks.length) return 'UNKNOWN';
    var adv = stocks.filter(function(s){ return s.chg > 0; }).length;
    var dec = stocks.filter(function(s){ return s.chg < 0; }).length;
    var total = stocks.length;
    var ratio = adv / total;
    var avgAbsChg = stocks.reduce(function(a,s){ return a + Math.abs(s.chg); }, 0) / total;
    if(avgAbsChg > 2.0) return 'VOLATILE';
    if(ratio > 0.6) return 'TRENDING_UP';
    if(ratio < 0.4) return 'TRENDING_DOWN';
    return 'SIDEWAYS';
  }

  // ── TIME OF DAY ──
  function getPhase(){
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    var mins = h * 60 + m;
    if(mins >= 555 && mins <= 585) return 'OPENING';   // 9:15 - 9:45
    if(mins >= 690 && mins <= 810) return 'MIDDAY';    // 11:30 - 13:30
    if(mins >= 870 && mins <= 930) return 'POWER_HOUR'; // 14:30 - 15:30
    if(mins >= 585 && mins < 690)  return 'MORNING';
    if(mins >= 810 && mins < 870)  return 'AFTERNOON';
    return 'CLOSED';
  }

  function getPhaseLabel(){
    var p = getPhase();
    switch(p){
      case 'OPENING':    return { label:'⚡ OPENING PHASE', desc:'ORB signals active', color:'#f0b429' };
      case 'MORNING':    return { label:'📈 MORNING SESSION', desc:'Standard signals', color:'#00e676' };
      case 'MIDDAY':     return { label:'😴 MIDDAY PHASE', desc:'Reduced sensitivity', color:'#8a9bb0' };
      case 'AFTERNOON':  return { label:'📊 AFTERNOON', desc:'Standard signals', color:'#00e676' };
      case 'POWER_HOUR': return { label:'🔥 POWER HOUR', desc:'Momentum signals priority', color:'#ff3d57' };
      default:           return { label:'🔒 MARKET CLOSED', desc:'Pre-market analysis mode', color:'#4a5568' };
    }
  }

  // ── SIGNAL SENSITIVITY based on phase ──
  function getSignalThreshold(){
    var p = getPhase();
    switch(p){
      case 'OPENING':    return { buy: 1.5, sell: -1.5, volMin: 1.5 }; // more sensitive
      case 'MIDDAY':     return { buy: 3.0, sell: -3.0, volMin: 2.5 }; // less sensitive
      case 'POWER_HOUR': return { buy: 2.0, sell: -2.0, volMin: 1.8 }; // momentum priority
      default:           return { buy: 2.5, sell: -2.5, volMin: 2.0 }; // standard
    }
  }

  // ── RISK CALCULATOR ──
  function calcRisk(capitalPerTrade, riskPct, entryPrice){
    var riskAmt = capitalPerTrade * (riskPct / 100);
    var stopLoss = entryPrice - riskAmt;
    var qty = Math.floor(capitalPerTrade / entryPrice);
    return {
      riskAmount: riskAmt,
      stopLoss: stopLoss.toFixed(2),
      quantity: qty,
      maxLoss: (riskAmt).toFixed(0)
    };
  }

  // ── DAILY LOSS CHECK ──
  function isDailyLossExceeded(startCapital, currentCapital, maxLossPct){
    var loss = ((startCapital - currentCapital) / startCapital) * 100;
    return loss >= maxLossPct;
  }

  // ── CONFIDENCE SCORE ──
  function calcConfidence(chg, volX, highPct, regime, phase){
    var score = 0;
    // Price momentum
    if(Math.abs(chg) >= 3) score += 3;
    else if(Math.abs(chg) >= 2) score += 2;
    else if(Math.abs(chg) >= 1) score += 1;
    // Volume
    if(volX >= 3) score += 3;
    else if(volX >= 2) score += 2;
    else if(volX >= 1.5) score += 1;
    // Near high (for buys)
    if(chg > 0 && highPct >= 90) score += 2;
    else if(chg > 0 && highPct >= 75) score += 1;
    // Regime bonus
    if(regime === 'TRENDING_UP' && chg > 0) score += 2;
    if(regime === 'TRENDING_DOWN' && chg < 0) score += 2;
    // Phase bonus
    if(phase === 'POWER_HOUR') score += 1;
    if(phase === 'OPENING' && Math.abs(chg) >= 1.5) score += 1;
    return Math.min(score, 10);
  }

  // ── MORNING PLAN GENERATOR ──
  function generateMorningPlan(sectors, prevStocks){
    var bestSectors = sectors
      .filter(function(s){ return s.chg > 0; })
      .sort(function(a,b){ return b.chg - a.chg; })
      .slice(0,3)
      .map(function(s){ return s.name; });

    var topStocks = prevStocks
      ? prevStocks
          .filter(function(s){ return s.chg > 1 && s.volX >= 1.5; })
          .sort(function(a,b){ return b.chg - a.chg; })
          .slice(0,5)
          .map(function(s){ return s.sym; })
      : [];

    var avgChg = prevStocks
      ? prevStocks.reduce(function(a,s){ return a+s.chg; },0) / prevStocks.length
      : 0;

    var bias = avgChg > 0.5 ? 'BULLISH' : avgChg < -0.5 ? 'BEARISH' : 'NEUTRAL';
    var risk = Math.abs(avgChg) > 2 ? 'HIGH' : Math.abs(avgChg) > 1 ? 'MEDIUM' : 'LOW';

    return {
      bias: bias,
      bestSectors: bestSectors.length ? bestSectors : ['BANKING','IT','AUTO'],
      topStocks: topStocks.length ? topStocks : ['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY'],
      riskLevel: risk,
      generated: new Date().toLocaleTimeString()
    };
  }

  return {
    getRegime: getRegime,
    getPhase: getPhase,
    getPhaseLabel: getPhaseLabel,
    getSignalThreshold: getSignalThreshold,
    calcRisk: calcRisk,
    isDailyLossExceeded: isDailyLossExceeded,
    calcConfidence: calcConfidence,
    generateMorningPlan: generateMorningPlan
  };
})();
