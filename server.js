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
   res.redirect()
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
