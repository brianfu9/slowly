var express = require('express');
var app = express();

app.use(express.static('public'));
app.get('/index.html', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

app.get('/api/v1/orders', function (req, res) {
   // Prepare output in JSON format
   console.log(req.params);
   var response = {hello: 'world'};
   res.end(JSON.stringify(response));
})

app.get('/response', function (req, res) {
    console.log(req.params);
    res.end(JSON.stringify(req.params))
})

app.get('/test', function (req, res) {
    console.log(req.params);
    res.end(JSON.stringify(req.params))
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})