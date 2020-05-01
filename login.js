const fs           = require("fs");

(function Module(){
   "use strict";
   function Login() {
      function readFile(file) {
         let fileData = fs.readFileSync(file, 'utf8');
         if( typeof(fileData) === "string" ) fileData = JSON.parse(fileData);
         return fileData;
         
      }
      this.getData = function(obj) {
         let httpResponse = obj.res;
         let data = obj.data;
         let creds = readFile("./credentials/cred.json");
         if( typeof(data) === "string" ) data = JSON.parse(data);
         let loginPassed = false;
         
         creds.credentials.map(function(cred) {
            if((data.UserName == cred.UserName) && (data.Password == cred.Password)) {
               loginPassed = true;
            }
         });
         
         if(loginPassed) {
            httpResponse.writeHead( 200, { "Content-Type": "application/json" } );
            httpResponse.end(JSON.stringify({"Message": "Logged In"}));            
         }
         else {
            httpResponse.writeHead( 401, { "Content-Type": "application/json" } );
            httpResponse.end(JSON.stringify({"Message": "Incorrect Credentials"}));
         }       
      };
   }
   module.exports = new Login();
})();