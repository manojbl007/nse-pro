// ═══════════════════════════════════════
// NSE PRO V5 — Alert System
// Rate control: no duplicate alerts within 5 min
// ═══════════════════════════════════════

var AlertSystem = (function(){
  var lastAlerts = {}; // sym_sig -> timestamp
  var COOLDOWN = 5 * 60 * 1000; // 5 minutes
  var WK = 'https://raspy-cherry-dfee.manojbl6789.workers.dev';

  function canAlert(sym, sig){
    var key = sym + '_' + sig;
    var last = lastAlerts[key];
    if(!last) return true;
    return (Date.now() - last) > COOLDOWN;
  }

  function markAlerted(sym, sig){
    lastAlerts[sym + '_' + sig] = Date.now();
  }

  function pad(x){ return x < 10 ? '0'+x : ''+x; }

  function sendTelegram(sym, price, chg, volx, sig){
    if(!canAlert(sym, sig)) return;
    markAlerted(sym, sig);
    var now = new Date();
    var time = pad(now.getHours())+':'+pad(now.getMinutes());
    fetch(WK+'?action=alert'+
      '&sym='+encodeURIComponent(sym)+
      '&price='+encodeURIComponent(price.toLocaleString('en-IN'))+
      '&chg='+encodeURIComponent((chg>=0?'+':'')+chg.toFixed(2))+
      '&volx='+encodeURIComponent(volx.toFixed(1))+
      '&sig='+encodeURIComponent(sig)+
      '&time='+encodeURIComponent(time)
    ).catch(function(){});
  }

  function sendBrowser(title, body, tag){
    if(!('Notification' in window)) return;
    if(Notification.permission !== 'granted') return;
    try { new Notification(title, {body: body, tag: tag}); } catch(e){}
  }

  function signal(sym, price, chg, volx, sig){
    if(!canAlert(sym, sig)) return;
    var emoji = sig==='BUY'?'🟢':sig==='SELL'?'🔴':sig==='PRE'?'⚡':'🔥';
    var body = '₹'+price.toLocaleString('en-IN')+' | '+(chg>=0?'+':'')+chg.toFixed(2)+'% | Vol:'+volx.toFixed(1)+'x';
    sendBrowser(emoji+' '+sig+' — '+sym, body, sig+'_'+sym);
    sendTelegram(sym, price, chg, volx, sig);
  }

  function marketSummary(direction, nifty, nchg, adv, dec, buys, sells){
    fetch(WK+'?action=market_summary'+
      '&direction='+encodeURIComponent(direction)+
      '&nifty='+encodeURIComponent(nifty)+
      '&nchg='+encodeURIComponent(nchg)+
      '&adv='+adv+'&dec='+dec+'&buys='+buys+'&sells='+sells
    ).catch(function(){});
  }

  function requestPermission(){
    if('Notification' in window && Notification.permission === 'default'){
      Notification.requestPermission();
    }
  }

  return { signal: signal, marketSummary: marketSummary, requestPermission: requestPermission };
})();
