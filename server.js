var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/api/v1/orders', function (req, res) {
   // Prepare output in JSON format
   console.log(req.params);
   var response = { hello: 'world' };
   res.end(JSON.stringify(response));
})

app.get('/register', function (req, res) {
   const smartcar = new Smartcar({
      clientId: '44507a27-e650-40f5-a7a3-9ae57051e821',
      redirectUri: 'https://javascript-sdk.smartcar.com/redirect-2.1.0?app_origin=http://localhost:3000',
      scope: ['read_vehicle_info', 'read_location', 'read_vin', 'read_odometer'],
      onComplete: function (err, code) {
         if (err) {
            // handle errors from the authorization flow (i.e. user denies access)
         }
         // handle the returned code by sending it to your back-end server
         sendToBackend(code);
      },
   });
   res.redirect()
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
