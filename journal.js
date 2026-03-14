// ═══════════════════════════════════════
// NSE PRO V5 — Real Trading Journal
// Manual trade log for broker trades
// ═══════════════════════════════════════

var Journal = (function(){
  var KEY = 'nsepro_journal_v5';
  var trades = [];

  function load(){
    try{
      var d = localStorage.getItem(KEY);
      if(d) trades = JSON.parse(d);
    }catch(e){ trades = []; }
  }

  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(trades)); }catch(e){}
  }

  function addTrade(date, sym, buyPrice, sellPrice, qty, notes){
    var pnl = (parseFloat(sellPrice) - parseFloat(buyPrice)) * parseInt(qty);
    var pnlPct = ((parseFloat(sellPrice) - parseFloat(buyPrice)) / parseFloat(buyPrice) * 100).toFixed(2);
    var trade = {
      id: Date.now(),
      date: date,
      sym: sym.toUpperCase(),
      buyPrice: parseFloat(buyPrice),
      sellPrice: parseFloat(sellPrice),
      qty: parseInt(qty),
      pnl: pnl,
      pnlPct: parseFloat(pnlPct),
      notes: notes || ''
    };
    trades.push(trade);
    save();
    return trade;
  }

  function deleteTrade(id){
    trades = trades.filter(function(t){ return t.id !== id; });
    save();
  }

  function getStats(){
    if(!trades.length) return {
      totalTrades: 0, wins: 0, losses: 0, winRate: 0,
      totalPnl: 0, bestTrade: null, worstTrade: null,
      bestSector: null, avgHoldPnl: 0
    };
    var wins = trades.filter(function(t){ return t.pnl > 0; });
    var losses = trades.filter(function(t){ return t.pnl <= 0; });
    var totalPnl = trades.reduce(function(a,t){ return a + t.pnl; }, 0);
    var sorted = trades.slice().sort(function(a,b){ return b.pnl - a.pnl; });
    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: (wins.length / trades.length * 100).toFixed(1),
      totalPnl: totalPnl.toFixed(0),
      bestTrade: sorted[0],
      worstTrade: sorted[sorted.length-1],
      avgPnl: (totalPnl / trades.length).toFixed(0),
      recentTrades: trades.slice(-50).reverse()
    };
  }

  function exportCSV(){
    var rows = [['Date','Symbol','Buy Price','Sell Price','Qty','PnL','PnL%','Notes']];
    trades.forEach(function(t){
      rows.push([t.date,t.sym,t.buyPrice,t.sellPrice,t.qty,t.pnl.toFixed(0),t.pnlPct,t.notes]);
    });
    var csv = rows.map(function(r){ return r.join(','); }).join('\n');
    var blob = new Blob([csv],{type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nse_journal.csv';
    a.click();
  }

  load();
  return { addTrade: addTrade, deleteTrade: deleteTrade, getStats: getStats, exportCSV: exportCSV, getTrades: function(){ return trades; } };
})();
