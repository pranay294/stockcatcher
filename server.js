var mime       = require("mime");
var http       = require("http");
var fs         = require("fs");
var fetchSData = require("./stocks/getAllStocksData");

(function Module() {
	"use strict";
   let DEBUG = false;
   let PORT = process.env.PORT || 8080;
   
	process.on('uncaughtException', function (err) {
		console.log(err);
	});
   
   function formulatePathAndParam(urlWithParam) {
      let arrPath = urlWithParam.split("?");
      let res = {PATH: arrPath[0], PARAM: {}};
      if(arrPath[1]) {
         let splitParams = arrPath[1].split("&");
         splitParams.map(function(sP) {
            let lo = sP.split("=");
            if(lo.length > 1 ) {
               res.PARAM[lo[0]] = lo[1];
            }
         });
      }
      return res;
   }
   
	http.createServer( function ( httpRequest, httpResponse ) {
		try {
			var path = unescape( __dirname );
			var view = "";
			var data = "";
         let pathParamObj = formulatePathAndParam(httpRequest.url);
         if(DEBUG) console.log(JSON.stringify(pathParamObj));
         path += pathParamObj.PATH;
			if( fs.existsSync( path ) ) {
				if( fs.lstatSync(path).isDirectory() ) {
					if( fs.existsSync( path + "/index.html" ) ) {
						path += "/index.html";
					}
					else {
						httpResponse.writeHead( 404, { "Content-Type": "application/json" } );
						httpResponse.end( JSON.stringify({ "Error...": path + " not found" }) );
					}
				}
            
				httpResponse.writeHead( 200, { "Content-Type": mime.lookup(path) } );
				fs.readFile( path, function ( error, response ) {
					httpResponse.end( response );
				});
			} 
         else {
            path = pathParamObj.PATH;
            httpRequest.on( "data", function( chunk ) {
               data = chunk.toString();
            });

            httpRequest.on( "end", function( ) {
               data = decodeURIComponent ( data );
               if (DEBUG) console.log( data ) ;
               try {
                  let stock = require( "." + path );
                  stock.getData( { res: httpResponse, data: data, param: pathParamObj.PARAM } );
               }
               catch ( ex ) {
                  console.log( "Error loading: " + path, ex );
                  httpResponse.writeHead( 404, { "Content-Type": "application/json" } );
                  httpResponse.end( JSON.stringify({ "Error": path + " not found" }) );
               }
            });
         }
		}
		catch( exception ) {
			httpResponse.writeHead( 500, { "Content-Type": "application/json" } );
			httpResponse.end( JSON.stringify({ "Error": "Exception caught on the server: " + exception }) );         
		}
	}).listen(PORT);
   
	console.log("HTTP server started at port ", PORT);
})();