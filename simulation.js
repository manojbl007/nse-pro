// ═══════════════════════════════════════
// NSE PRO V5 — Simulation Engine
// Paper Trading with ₹1 Crore capital
// ═══════════════════════════════════════

var SimEngine = (function(){
  var STORAGE_KEY = 'nsepro_sim_v5';
  var MAX_TRADES = 500;

  var state = {
    startCapital: 10000000,
    capital: 10000000,
    capitalPerTrade: 100000,
    riskPct: 1,
    positions: {},
    trades: [],
    dailyLoss: 0,
    dailyStart: 0,
    lastDate: ''
  };

  function save(){
    try{
      var data = JSON.stringify({
        capital: state.capital,
        capitalPerTrade: state.capitalPerTrade,
        riskPct: state.riskPct,
        positions: state.positions,
        trades: state.trades.slice(-MAX_TRADES),
        dailyLoss: state.dailyLoss,
        dailyStart: state.dailyStart,
        lastDate: state.lastDate
      });
      localStorage.setItem(STORAGE_KEY, data);
    }catch(e){}
  }

  function load(){
    try{
      var data = localStorage.getItem(STORAGE_KEY);
      if(data){
        var d = JSON.parse(data);
        state.capital = d.capital || state.startCapital;
        state.capitalPerTrade = d.capitalPerTrade || 100000;
        state.riskPct = d.riskPct || 1;
        state.positions = d.positions || {};
        state.trades = d.trades || [];
        state.dailyLoss = d.dailyLoss || 0;
        state.dailyStart = d.dailyStart || state.capital;
        state.lastDate = d.lastDate || '';
      }
      // Reset daily loss if new day
      var today = new Date().toDateString();
      if(state.lastDate !== today){
        state.dailyLoss = 0;
        state.dailyStart = state.capital;
        state.lastDate = today;
        save();
      }
    }catch(e){}
  }

  function reset(){
    state.capital = state.startCapital;
    state.positions = {};
    state.trades = [];
    state.dailyLoss = 0;
    state.dailyStart = state.startCapital;
    save();
  }

  function openPosition(sym, price, sig){
    if(state.positions[sym]) return false; // already open
    var riskAmt = state.capitalPerTrade * (state.riskPct / 100);
    var stopLoss = sig === 'BUY' ? price * (1 - state.riskPct/100) : price * (1 + state.riskPct/100);
    var qty = Math.floor(state.capitalPerTrade / price);
    if(qty <= 0) return false;
    var cost = qty * price;
    if(cost > state.capital) return false;

    // Check daily loss limit
    var dailyLossPct = ((state.dailyStart - state.capital) / state.dailyStart) * 100;
    if(dailyLossPct >= 3) return false; // 3% daily loss limit

    state.capital -= cost;
    state.positions[sym] = {
      sym: sym,
      entry: price,
      stopLoss: stopLoss,
      qty: qty,
      cost: cost,
      sig: sig,
      entryTime: new Date().toLocaleTimeString(),
      entryDate: new Date().toDateString(),
      high: price,
      low: price
    };
    save();
    return true;
  }

  function updatePosition(sym, currentPrice){
    var pos = state.positions[sym];
    if(!pos) return;
    pos.high = Math.max(pos.high, currentPrice);
    pos.low = Math.min(pos.low, currentPrice);
    // Trailing stop: if profit > 2%, trail stop to breakeven
    var profitPct = pos.sig === 'BUY'
      ? (currentPrice - pos.entry) / pos.entry * 100
      : (pos.entry - currentPrice) / pos.entry * 100;
    if(profitPct > 2){
      if(pos.sig === 'BUY') pos.stopLoss = Math.max(pos.stopLoss, pos.entry);
      else pos.stopLoss = Math.min(pos.stopLoss, pos.entry);
    }
    // Check stop loss hit
    var slHit = pos.sig === 'BUY' ? currentPrice <= pos.stopLoss : currentPrice >= pos.stopLoss;
    if(slHit){ closePosition(sym, currentPrice, 'STOP_LOSS'); return; }
    save();
  }

  function closePosition(sym, price, reason){
    var pos = state.positions[sym];
    if(!pos) return;
    var proceeds = pos.qty * price;
    var pnl = pos.sig === 'BUY' ? proceeds - pos.cost : pos.cost - proceeds;
    state.capital += pos.cost + pnl;
    var trade = {
      sym: sym,
      entry: pos.entry,
      exit: price,
      qty: pos.qty,
      pnl: pnl,
      pnlPct: (pnl / pos.cost * 100).toFixed(2),
      sig: pos.sig,
      reason: reason,
      entryTime: pos.entryTime,
      exitTime: new Date().toLocaleTimeString(),
      date: new Date().toDateString()
    };
    state.trades.push(trade);
    if(state.trades.length > MAX_TRADES) state.trades = state.trades.slice(-MAX_TRADES);
    delete state.positions[sym];
    save();
    return trade;
  }

  function getStats(){
    var trades = state.trades;
    var wins = trades.filter(function(t){ return t.pnl > 0; });
    var losses = trades.filter(function(t){ return t.pnl <= 0; });
    var totalPnl = trades.reduce(function(a,t){ return a + t.pnl; }, 0);
    var openPnl = 0;
    Object.values(state.positions).forEach(function(p){
      // approximate with entry price
    });
    return {
      capital: state.capital,
      startCapital: state.startCapital,
      totalPnl: totalPnl,
      pnlPct: ((state.capital - state.startCapital) / state.startCapital * 100).toFixed(2),
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: trades.length ? (wins.length / trades.length * 100).toFixed(1) : 0,
      openPositions: Object.keys(state.positions).length,
      positions: state.positions,
      recentTrades: trades.slice(-20).reverse(),
      dailyLossPct: ((state.dailyStart - state.capital) / state.dailyStart * 100).toFixed(2)
    };
  }

  function exportCSV(){
    var rows = [['Date','Symbol','Signal','Entry','Exit','Qty','PnL','PnL%','Reason','Time']];
    state.trades.forEach(function(t){
      rows.push([t.date,t.sym,t.sig,t.entry,t.exit,t.qty,t.pnl.toFixed(0),t.pnlPct,t.reason,t.exitTime]);
    });
    var csv = rows.map(function(r){ return r.join(','); }).join('\n');
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nse_sim_trades.csv';
    a.click();
  }

  function setConfig(capitalPerTrade, riskPct){
    state.capitalPerTrade = capitalPerTrade;
    state.riskPct = riskPct;
    save();
  }

  load();
  return {
    openPosition: openPosition,
    updatePosition: updatePosition,
    closePosition: closePosition,
    getStats: getStats,
    exportCSV: exportCSV,
    reset: reset,
    setConfig: setConfig,
    getPositions: function(){ return state.positions; },
    getTrades: function(){ return state.trades; },
    getCapital: function(){ return state.capital; }
  };
})();
