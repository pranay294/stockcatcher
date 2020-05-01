const request      = require("request");
const fs           = require("fs");

(function Module(){
   "use strict";
   function Stocks() {
      function readFile(file) {
         let fileData = {};
         if( fs.existsSync( file ) ) {
            fileData = fs.readFileSync(file, 'utf8');
            if( typeof(fileData) === "string" ) fileData = JSON.parse(fileData);            
         }
         return fileData;    
      }
      this.getData = function(obj) {
         let DEBUG = false;
         let httpResponse = obj.res;
         let stocks = null;
         if(DEBUG) console.log("Started getData for", obj.param.session);
         stocks = readFile("./stockLists/"+ obj.param.session +".json");
         let allStocksObj = readFile("stocks/allStockHistoryData.json");
         let requestCount = Object.keys(stocks).length;
         let response = {stocks: stocks, alertData: {}};
         response.pennyStockData = readFile("stocks/allPennyStockData.json");
         response.alertData = readFile("stocks/allAlertStockHistoryData.json");
                 
         if(DEBUG) console.log("Done reading stocks file");        
         if(DEBUG) console.log(JSON.stringify(response.stocks));
         
         if(requestCount) {
            for(let key in response.stocks) {
               getData(key);
            }
         }
         else {
            if(DEBUG) console.log(JSON.stringify(response));
            httpResponse.writeHead( 200, { "Content-Type": "application/json" } );
            httpResponse.end( JSON.stringify(response));            
         }

         function getData(name) {
            if(DEBUG) console.log("Fetching for", name);
            let uri = "https://query1.finance.yahoo.com/v8/finance/chart/" + name;
            let requestInfo = {
               method: "GET",
               uri: uri,
               json: true
            };
            request( requestInfo, (error,resp,body) => {
               try {
                  response.stocks[name].Current = "NA";
                  if( typeof(body) === "string" ) body = JSON.parse(body);
                  if(body.chart && body.chart.result && body.chart.result.length && body.chart.result[0].meta && body.chart.result[0].meta.regularMarketPrice) {
                     response.stocks[name].Current = body.chart.result[0].meta.regularMarketPrice;
                     response.stocks[name].previousClose = body.chart.result[0].meta.previousClose;
                     if(allStocksObj[name]) {
                        response.stocks[name].sixMonthHigh = allStocksObj[name].high || response.stocks[name].sixMonthHigh;
                        response.stocks[name].sixMonthLow = allStocksObj[name].low || response.stocks[name].sixMonthLow;
                        response.stocks[name].Name = allStocksObj[name].Name || response.stocks[name].Name;
                     }
                     else {
                        console.log("No history for", name);
                     }
                  }
               }
               catch(e) {
                  response.stocks[name].Current = "NA";
               }

               if( --requestCount === 0 ) {
                  if( typeof(response.alertData) === "string" ) response.alertData = JSON.parse(response.alertData);
                  httpResponse.writeHead( 200, { "Content-Type": "application/json" } );
                  httpResponse.end( JSON.stringify(response));
               }       
            });
         }         
      };
   }
   module.exports = new Stocks();
})();