$(function() {
   $(".submit").click(function() {
      $(".errMsg").html("");
      let uname = $(".uname").val();
      let pwd = $(".pwd").val();
      if(uname && pwd) {    
         $.post( "login" ,
            encodeURIComponent( JSON.stringify( {"UserName": uname, "Password": pwd} ) ),
            function(data) {
               sessionStorage.setItem('session', uname);
               window.location.href = "/stocks";
            }
         ).fail( function( error ) {
            $(".errMsg").html("Unable to Login");
         });
      }
      else {
         $(".errMsg").html("Enter both: UserName and Password");
      }
   });
});