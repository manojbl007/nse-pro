// ═══════════════════════════════════════
// NSE PRO V5 — Scanner Engine
// NIFTY 100 stocks, 15-20s refresh
// ═══════════════════════════════════════

var Scanner = (function(){
  var AK = '8b3clv6hwxt6s0r2';
  var WK = 'https://raspy-cherry-dfee.manojbl6789.workers.dev';
  var tok = null;
  var scanning = false;
  var scanCount = 0;
  var autoTimer = null;
  var countdownTimer = null;
  var countdownVal = 0;
  var INTERVAL = 20000; // 20 seconds
  var onScanComplete = null;
  var volHistory = {}; // track volume history for spikes

  // NIFTY 100 stocks
  var SYMS = [
    // NIFTY 50
    ['NSE:RELIANCE','RELIANCE','ENERGY'],['NSE:TCS','TCS','IT'],
    ['NSE:HDFCBANK','HDFCBANK','BANKING'],['NSE:BHARTIARTL','BHARTIARTL','TELECOM'],
    ['NSE:ICICIBANK','ICICIBANK','BANKING'],['NSE:INFOSYS','INFOSYS','IT'],
    ['NSE:SBIN','SBIN','BANKING'],['NSE:HINDUNILVR','HINDUNILVR','FMCG'],
    ['NSE:ITC','ITC','FMCG'],['NSE:LT','LT','INFRA'],
    ['NSE:KOTAKBANK','KOTAKBANK','BANKING'],['NSE:HCLTECH','HCLTECH','IT'],
    ['NSE:AXISBANK','AXISBANK','BANKING'],['NSE:WIPRO','WIPRO','IT'],
    ['NSE:MARUTI','MARUTI','AUTO'],['NSE:ASIANPAINT','ASIANPAINT','PAINTS'],
    ['NSE:TATAMOTORS','TATAMOTORS','AUTO'],['NSE:NESTLEIND','NESTLEIND','FMCG'],
    ['NSE:ULTRACEMCO','ULTRACEMCO','CEMENT'],['NSE:SUNPHARMA','SUNPHARMA','PHARMA'],
    ['NSE:BAJFINANCE','BAJFINANCE','FINANCE'],['NSE:ONGC','ONGC','ENERGY'],
    ['NSE:TATASTEEL','TATASTEEL','METALS'],['NSE:NTPC','NTPC','ENERGY'],
    ['NSE:POWERGRID','POWERGRID','ENERGY'],['NSE:M&M','M&M','AUTO'],
    ['NSE:ADANIENT','ADANIENT','INFRA'],['NSE:JSWSTEEL','JSWSTEEL','METALS'],
    ['NSE:TITAN','TITAN','CONSUMER'],['NSE:BAJAJFINSV','BAJAJFINSV','FINANCE'],
    ['NSE:DRREDDY','DRREDDY','PHARMA'],['NSE:CIPLA','CIPLA','PHARMA'],
    ['NSE:TECHM','TECHM','IT'],['NSE:HDFCLIFE','HDFCLIFE','FINANCE'],
    ['NSE:SBILIFE','SBILIFE','FINANCE'],['NSE:BRITANNIA','BRITANNIA','FMCG'],
    ['NSE:DIVISLAB','DIVISLAB','PHARMA'],['NSE:EICHERMOT','EICHERMOT','AUTO'],
    ['NSE:HEROMOTOCO','HEROMOTOCO','AUTO'],['NSE:BPCL','BPCL','ENERGY'],
    ['NSE:HINDALCO','HINDALCO','METALS'],['NSE:GRASIM','GRASIM','CEMENT'],
    ['NSE:TATACONSUM','TATACONSUM','FMCG'],['NSE:COALINDIA','COALINDIA','ENERGY'],
    ['NSE:APOLLOHOSP','APOLLOHOSP','PHARMA'],['NSE:ADANIPORTS','ADANIPORTS','INFRA'],
    ['NSE:INDUSINDBK','INDUSINDBK','BANKING'],['NSE:SHRIRAMFIN','SHRIRAMFIN','FINANCE'],
    ['NSE:BEL','BEL','DEFENCE'],['NSE:BAJAJ-AUTO','BAJAJ-AUTO','AUTO'],
    // NIFTY NEXT 50
    ['NSE:DMART','DMART','RETAIL'],['NSE:PIDILITIND','PIDILITIND','CHEMICALS'],
    ['NSE:SIEMENS','SIEMENS','INFRA'],['NSE:HAVELLS','HAVELLS','CONSUMER'],
    ['NSE:DABUR','DABUR','FMCG'],['NSE:MARICO','MARICO','FMCG'],
    ['NSE:BERGEPAINT','BERGEPAINT','PAINTS'],['NSE:TORNTPHARM','TORNTPHARM','PHARMA'],
    ['NSE:MUTHOOTFIN','MUTHOOTFIN','FINANCE'],['NSE:LUPIN','LUPIN','PHARMA'],
    ['NSE:AMBUJACEM','AMBUJACEM','CEMENT'],['NSE:ACC','ACC','CEMENT'],
    ['NSE:BANKBARODA','BANKBARODA','BANKING'],['NSE:PNB','PNB','BANKING'],
    ['NSE:CANBK','CANBK','BANKING'],['NSE:SAIL','SAIL','METALS'],
    ['NSE:VEDL','VEDL','METALS'],['NSE:NMDC','NMDC','METALS'],
    ['NSE:RECLTD','RECLTD','FINANCE'],['NSE:PFC','PFC','FINANCE'],
    ['NSE:IRCTC','IRCTC','CONSUMER'],['NSE:TRENT','TRENT','RETAIL'],
    ['NSE:ZOMATO','ZOMATO','CONSUMER'],['NSE:NYKAA','NYKAA','RETAIL'],
    ['NSE:PAYTM','PAYTM','FINTECH'],['NSE:POLICYBZR','POLICYBZR','FINTECH'],
    ['NSE:CHOLAFIN','CHOLAFIN','FINANCE'],['NSE:MFSL','MFSL','FINANCE'],
    ['NSE:PERSISTENT','PERSISTENT','IT'],['NSE:COFORGE','COFORGE','IT'],
    ['NSE:LTIM','LTIM','IT'],['NSE:MPHASIS','MPHASIS','IT'],
    ['NSE:OFSS','OFSS','IT'],['NSE:KPITTECH','KPITTECH','IT'],
    ['NSE:TATAPOWER','TATAPOWER','ENERGY'],['NSE:ADANIGREEN','ADANIGREEN','ENERGY'],
    ['NSE:ADANIPORTS','ADANIPORTS','INFRA'],['NSE:GMRINFRA','GMRINFRA','INFRA'],
    ['NSE:OBEROIRLTY','OBEROIRLTY','REALTY'],['NSE:DLF','DLF','REALTY'],
    ['NSE:GODREJPROP','GODREJPROP','REALTY'],['NSE:PHOENIXLTD','PHOENIXLTD','REALTY'],
    ['NSE:ULTRACEMCO','ULTRACEMCO','CEMENT'],['NSE:SHREECEM','SHREECEM','CEMENT'],
    ['NSE:SUNDRMFAST','SUNDRMFAST','AUTO'],['NSE:MOTHERSON','MOTHERSON','AUTO'],
    ['NSE:BALKRISIND','BALKRISIND','AUTO'],['NSE:MRF','MRF','AUTO'],
    ['NSE:APOLLOTYRE','APOLLOTYRE','AUTO'],['NSE:EXIDEIND','EXIDEIND','AUTO']
  ];

  // Remove duplicates
  var seen = {};
  SYMS = SYMS.filter(function(s){
    if(seen[s[0]]) return false;
    seen[s[0]] = true;
    return true;
  });

  var IX = ['NSE:NIFTY 50','NSE:NIFTY BANK','NSE:NIFTY IT','NSE:NIFTY AUTO'];

  function setToken(t){ tok = t; }
  function setCallback(fn){ onScanComplete = fn; }

  function fetchBatch(syms){
    var q = syms.map(function(s){ return s[0] || s; }).join(',');
    return fetch(WK+'?action=quote&api_key='+AK+'&access_token='+encodeURIComponent(tok)+'&symbols='+encodeURIComponent(q))
      .then(function(r){ return r.json(); })
      .then(function(d){ return d.data || {}; });
  }

  function calcSignal(chg, volX, highPct, thresh){
    if(chg >= thresh.buy && volX >= thresh.volMin) return 'BUY';
    if(chg <= thresh.sell && volX >= thresh.volMin) return 'SELL';
    if(chg > 0 && chg < thresh.buy && volX >= 1.5 && highPct >= 85) return 'PRE';
    if(volX >= 3 && Math.abs(chg) >= 0.5) return 'VOLUME_SPIKE';
    if(volX >= thresh.volMin) return 'WATCH';
    if(chg > 0.3) return 'BUY';
    if(chg < -0.3) return 'SELL';
    return 'WATCH';
  }

  function processQuotes(quotes, thresh){
    var result = [];
    SYMS.forEach(function(s){
      var q = quotes[s[0]];
      if(!q) return;
      var price = q.last_price, prev = q.ohlc.close;
      var high = q.ohlc.high || price, low = q.ohlc.low || price;
      var chg = (price - prev) / prev * 100;
      var vol = q.volume_traded || 0;
      // Track volume history for better spike detection
      if(!volHistory[s[1]]) volHistory[s[1]] = [];
      volHistory[s[1]].push(vol);
      if(volHistory[s[1]].length > 10) volHistory[s[1]].shift();
      var avgVol = volHistory[s[1]].length > 2
        ? volHistory[s[1]].slice(0,-1).reduce(function(a,v){ return a+v; },0) / (volHistory[s[1]].length-1)
        : 250000;
      var volX = avgVol > 0 ? vol / avgVol : 1;
      var range = high - low;
      var highPct = range > 0 ? (price - low) / range * 100 : 50;
      var sig = calcSignal(chg, volX, highPct, thresh);
      var conf = AnalysisEngine.calcConfidence(chg, volX, highPct,
        AnalysisEngine.getRegime([]), AnalysisEngine.getPhase());
      var sms = Math.min(5, Math.floor(conf / 2));
      result.push({
        sym: s[1], sec: s[2], price: price, chg: chg,
        vol: vol, volX: volX, vs: volX >= 3,
        sig: sig, conf: conf, sms: sms,
        high: high, low: low, highPct: highPct
      });
    });
    result.sort(function(a,b){ return Math.abs(b.chg) - Math.abs(a.chg); });
    return result;
  }

  function run(){
    if(!tok || scanning) return;
    scanning = true;
    var thresh = AnalysisEngine.getSignalThreshold();
    // Split into 3 batches
    var b1 = SYMS.slice(0,34), b2 = SYMS.slice(34,67), b3 = SYMS.slice(67);
    Promise.all([fetchBatch(b1), fetchBatch(b2), fetchBatch(b3)])
      .then(function(results){
        var quotes = Object.assign({}, results[0], results[1], results[2]);
        var stocks = processQuotes(quotes, thresh);
        scanCount++;
        if(onScanComplete) onScanComplete(stocks, scanCount);
      })
      .catch(function(e){ console.log('Scan error:', e); })
      .finally(function(){ scanning = false; });
  }

  function fetchIndices(){
    if(!tok) return Promise.resolve({});
    return fetchBatch(IX.map(function(s){ return [s]; }))
      .catch(function(){ return {}; });
  }

  function start(){
    if(autoTimer) stop();
    run();
    countdownVal = INTERVAL/1000;
    autoTimer = setInterval(function(){ run(); countdownVal = INTERVAL/1000; }, INTERVAL);
    countdownTimer = setInterval(function(){
      countdownVal--;
      if(countdownVal <= 0) countdownVal = INTERVAL/1000;
      var el = document.getElementById('scanCountdown');
      if(el) el.textContent = countdownVal + 's';
    }, 1000);
  }

  function stop(){
    if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
    if(countdownTimer){ clearInterval(countdownTimer); countdownTimer = null; }
  }

  function manualScan(){ run(); countdownVal = INTERVAL/1000; }

  return {
    setToken: setToken, setCallback: setCallback,
    start: start, stop: stop, manualScan: manualScan,
    fetchIndices: fetchIndices, getScanCount: function(){ return scanCount; },
    getSyms: function(){ return SYMS; }
  };
})();
