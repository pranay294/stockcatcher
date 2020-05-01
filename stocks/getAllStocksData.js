const request    = require("request");
const fs         = require("fs");
const allStocks  = require("./allStocksList");

(function Module(){
   "use strict";
   let DEBUG = false;
   function getAllStocksData() {
      let requestCount = allStocks.length;
      console.log("STARTED CRAWLING FOR", requestCount, "STOCKS");
      let percentageBlock = Math.round(requestCount / 10);
      let response = {};
      let alertResponse = {ALLTIMELOW:{}, ALLTIMEHIGH:{}};
      let pennyStocks = [];
      let successCases = 0;
      allStocks.map(function(stock) {
         let name = stock.Symbol;
         let stockName = stock.Name;
         response[name] = { Name: stockName };
         let uri = "https://query1.finance.yahoo.com/v8/finance/chart/" + name + "?interval=1mo&range=6mo";
         let requestInfo = {
            method: "GET",
            uri: uri,
            timeout: 60*1000,
            json: true
         };
         request( requestInfo, (error,resp,body) => {
            response[name].high = "";
            response[name].low = "";
            try {
               if( typeof(body) === "string" ) body = JSON.parse(body);
               if( body.chart &&
                   body.chart.result &&
                   body.chart.result.length &&
                   body.chart.result[0].indicators &&
                   body.chart.result[0].indicators.quote &&
                   body.chart.result[0].indicators.quote.length &&
                   body.chart.result[0].indicators.quote[0].high &&
                   body.chart.result[0].indicators.quote[0].low &&
                   body.chart.result[0].meta &&
                   body.chart.result[0].meta.regularMarketPrice
                   ) {
                  body.chart.result[0].indicators.quote[0].high = body.chart.result[0].indicators.quote[0].high.filter(function(e){return e});
                  body.chart.result[0].indicators.quote[0].low = body.chart.result[0].indicators.quote[0].low.filter(function(e){return e});
                  
                  if((body.chart.result[0].indicators.quote[0].high.length > 2) &&
                     (body.chart.result[0].indicators.quote[0].low.length > 2)) {
                     response[name].high = Math.max(...body.chart.result[0].indicators.quote[0].high);
                     response[name].low = Math.min(...body.chart.result[0].indicators.quote[0].low);
                     response[name].current = body.chart.result[0].meta.regularMarketPrice;
                     if(response[name].current >= 0.01) {
                        if( response[name].current <= response[name].low) {
                           alertResponse.ALLTIMELOW[name] = { Name: stockName, price: response[name].current };
                        }
                        if( response[name].current >= response[name].high) {
                           alertResponse.ALLTIMEHIGH[name] = { Name: stockName, price: response[name].current };
                        }
                     }
                     
                     if((response[name].current < 1) && (response[name].current >= 0.01)) {
                        pennyStocks.push({
                           Symbol: name, 
                           Name: stockName,
                           price: response[name].current.toFixed(2),
                           high: response[name].high.toFixed(2),
                           low: response[name].low.toFixed(2),
                           score: getScore( response[name].high, response[name].low , response[name].current )
                        });
                     }
                     response[name].current = response[name].current.toFixed(2);
                     response[name].high = response[name].high.toFixed(2);
                     response[name].low = response[name].low.toFixed(2); 
                  }
                  successCases++;
               }
            }
            catch(e) {
               // Do Nothing
            }
            --requestCount;

            if(requestCount % percentageBlock == 0) {
               if(DEBUG) console.log( Math.round(requestCount*10/percentageBlock) , "% remaining" );
            }

            if( requestCount === 0 ) {
               let dt = new Date();
               fs.writeFileSync("stocks/allStockHistoryData.json", JSON.stringify(response));
               fs.writeFileSync("stocks/allAlertStockHistoryData.json", JSON.stringify(alertResponse));
               pennyStocks = pennyStocks.sort(function(a,b) { return b.score - a.score; });
               fs.writeFileSync("stocks/allPennyStockData.json", JSON.stringify(pennyStocks));
               console.log(dt.toString(), ": SUCCESSFULLY MONITORED STOCK DATA FOR", allStocks.length, "STOCKS.");
               if(DEBUG)console.log("Fetched Range for", successCases);
               setTimeout(getAllStocksData, 5 * 60 * 1000);
            }
         });
      });
   }
   setTimeout(getAllStocksData, 10 * 1000);
})();


function getScore( high, low , current, range ) {
   range = range || ((high - low)/20);
   let score = ((current - low) * 5) / range;
   score *= (current/high);
   score = Math.round(100 - score);
   score = Math.min(99, score);
   score = Math.max(1, score);
   return score;
}