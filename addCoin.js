const fs           = require("fs");

(function Module(){
   "use strict";
   function Login() {
      function readFile(file) {
         let fileData = {};
         if( fs.existsSync( file ) ) {
            fileData = fs.readFileSync(file, 'utf8');
            if( typeof(fileData) === "string" ) fileData = JSON.parse(fileData);
         }
         return fileData;
      }
      this.getData = function(obj) {
         let httpResponse = obj.res;
         let data = obj.data;
         let stocks = null;
         stocks = readFile("./stockLists/"+ obj.param.session +".json");
         if( typeof(data) === "string" ) data = JSON.parse(data);
         let orderedStock = {};
         stocks[data.Token.toUpperCase()] = { "BuyT": data.BuyT, "SellT": data.SellT };
         Object.keys(stocks).sort().forEach(function(key) {
           orderedStock[key] = stocks[key];
         });
         fs.writeFileSync("./stockLists/"+ obj.param.session +".json", JSON.stringify(orderedStock, null , 3));
         httpResponse.writeHead( 200, { "Content-Type": "application/json" } );
         httpResponse.end(JSON.stringify({"Message": "Added Token"}));
      };
   }
   module.exports = new Login();
})();