$(function() {
   if(sessionStorage.getItem('session')) {
      start();
      $(".cover").click(closePopup);
      $(".pennyCoins").click(showPopup);
      $(".addCoin").click(showAddCoinPopup);
      $(".addCoinBtn").click(addCoinToList);
   }
   else {
      window.location.href = "/";
   }
});

var giveSuggestion = false;
var prevData = {};
let SECONDS_TO_REFRESH = 15;

function closePopup() {
   $(".cover").hide();
   $(".pennyStockData").hide();
   $(".addCoinScreen").hide();
   $(".errMsg").html("");
};

function showPopup() {
   $(".cover").show();
   $(".pennyStockData").show();
}

function showAddCoinPopup() {
   $(".cover").show();
   $(".addCoinScreen").show();
}

function addCoinToList() {
   let sym = $("#stockSymbol").val();
   let bAt = $("#stockBuyAt").val();
   let sAt = $("#stockSellAt").val();
   if(sym && bAt && sAt) {
      $.post( "addCoin?session=" + sessionStorage.getItem('session'),
         encodeURIComponent( JSON.stringify( {"Token": sym, "BuyT": bAt, "SellT": sAt} ) ),
         function(data) {
            location.reload();
         }
      ).fail( function( error ) {
         $(".errMsg").html(error.Message);
      });
   }
   else {
      $(".errMsg").html("Add Symbol with Prices to Buy and Sell At");
   }
}

function start() {
   try {
      $.getJSON( "stockData", {session: sessionStorage.getItem('session')})
      .done((data) => {
         {
            let dt = new Date();
            setTimeout(start, SECONDS_TO_REFRESH * 1000);
         }
         data && plot(data);
      })
      .fail(() => {
         setTimeout(start, SECONDS_TO_REFRESH * 1000);
      });
   }
   catch(e) {
      setTimeout(start, SECONDS_TO_REFRESH * 1000);
   }
}

function plot(pData) {
   let stockData = pData.stocks;
   let alertData = pData.alertData;
   let pennyData = pData.pennyStockData;
   let pennyRes = "<table><tr><th>PENNY STOCKS (0.01$ <= PRICE <= 1$)</th>"
   let alertPrint = [];
   let res = `<tr>
               <th>Stock</th>
               <th>6 Month Range</th>
               <th>Current Price</th>
               <th>Today's change</th>
               <th>My Buy / Sell Range</th>
               <th>Comment</th>
               </tr>`;
   let summary = "";
   let msg = {};

   for(let key in stockData) {
      let netCurrent = "";
      let comment = "";
      let prevPrice = "";
      let change = "";
      let changeClass = "";
      let dailyChange = 0;
      let highLowRange = 1;
      let buySellRange = 1;
      let performanceScore = 0;
      let performanceClass = "#000000";

      if(prevData && prevData[key] && prevData[key].Current ) {
         prevPrice = prevData[key].Current;
         change = (stockData[key].Current - prevPrice);
         change = ((change < 0.005) && (change > -0.005)) ? "" : change;
         change = change ? change.toFixed(2) : "";
         changeClass = (change>0) ? "profit" : ((change<0) ? "loss" : "");
      }
      
      netCurrent && (netCurrent = isNaN(netCurrent) ? "" : netCurrent.toFixed(2));

      
      if(stockData[key].Current <= stockData[key].BuyT) {
         comment = "Buy"; 
         msg[key] = "Buy " + stockData[key].Name + " at " + stockData[key].Current.toFixed(2);
      }
      if(stockData[key].Current >= stockData[key].SellT) {
         comment = "Sell"; 
         msg[key] = "Sell " + stockData[key].Name + " at " + stockData[key].Current.toFixed(2);
      }
      if(stockData[key].Current <= stockData[key].sixMonthLow) {
         comment = "Buy"; 
         msg[key] = "Buy " + stockData[key].Name + " at 6 Month Low of " + stockData[key].Current.toFixed(2);
      }
      if(stockData[key].Current >= stockData[key].sixMonthHigh) {
         comment = "Sell"; 
         msg[key] = "Sell " + stockData[key].Name + " at 6 Month High of " + stockData[key].Current.toFixed(2);
      }

      stockData[key].sixMonthHigh = Math.max(stockData[key].sixMonthHigh, stockData[key].Current);
      stockData[key].sixMonthLow = Math.min(stockData[key].sixMonthLow, stockData[key].Current);
      
      dailyChange = (stockData[key].Current - stockData[key].previousClose) * 100 / stockData[key].previousClose;
      
      highLowRange = (stockData[key].sixMonthHigh - stockData[key].sixMonthLow)/20;
      buySellRange = (stockData[key].SellT - stockData[key].BuyT)/20;
      
      performanceScore = getScore(stockData[key].sixMonthHigh, stockData[key].sixMonthLow, stockData[key].Current, highLowRange);
      performanceClass = "#"+ getDoubleDigit(100-performanceScore) + getDoubleDigit(performanceScore) +"00";

      res += `<tr class="${stockData[key].own ? 'own' : ''}">
               <td>${stockData[key].Name} (${key})</td>
               <td><span class="score" style="background:${performanceClass}">${performanceScore}</span><input type="range" disabled step=${highLowRange} min="0" title="${stockData[key].sixMonthLow} To ${stockData[key].sixMonthHigh}" max="100" value="${100-performanceScore}"></td>
               <td class="neutral">${stockData[key].Current} <span style="float:right; margin-left: 5px;" class="${changeClass}">${change}</span></td>
               <td style="font-size: 10px;" class="${(dailyChange>0) ? "profit" : ((dailyChange < 0) ? "loss" : "" )}">${stockData[key].previousClose}<span style="float:right; margin-left: 5px;">(${dailyChange.toFixed(2)})%</span></td>
               <td><input type="range" disabled step=${buySellRange} min="${stockData[key].BuyT}" title="${stockData[key].BuyT} - ${stockData[key].SellT}" max="${stockData[key].SellT}" value="${stockData[key].Current}"></td>
               <td><b>${comment}</b></td>
            </tr>`;
   }

   for(let key in alertData) {
      let arr = [];
      for(let k in alertData[key]) {
         arr.push(k+ " (" + alertData[key][k].price + ")");
      }
      summary += `<tr class='net'><td>${key}</td><td>${arr.join(", ")}</td></tr>`;
   }
   
   pennyData.map(function(penny) {
      let pClass = "#"+ getDoubleDigit(100-penny.score) + getDoubleDigit(penny.score) +"00";
      let range = (penny.high - penny.low)/20;
      pennyRes += `<tr><td>${penny.Name} (${penny.Symbol}) [${penny.price}]</td><td><span class="score" style="background:${pClass}">${penny.score}</span><input type="range" disabled step=${range} min="0" title="${penny.low} To ${penny.high}" max="100" value="${100-penny.score}"></td></tr>`;
   });
   pennyRes += "</table>";
   
   prevData = stockData;
   $("#stockTable").html(res);
   $("#summary").html(summary);
   $(".pennyStockData").html(pennyRes);
   msg = Object.values(msg);
   msg.length && msg.unshift(sessionStorage.getItem('session'));
   giveSuggestion && textToSpeech(msg.join(". "));
}

function getScore( high, low , current, range ) {
   range = range || ((high - low)/20);
   let score = ((current - low) * 5) / range;
   score *= (current/high);
   score = Math.round(100 - score);
   score = Math.min(99, score);
   score = Math.max(1, score);
   return score;
}

function toggleVoiceSuggestion() {
   giveSuggestion = !giveSuggestion;
}

function textToSpeech(msg) {
   let summary = new SpeechSynthesisUtterance(msg);
   window.speechSynthesis.speak(summary);
}

function getDoubleDigit(num) {
   if(num < 10) num = "0" + num;
   return num;
}