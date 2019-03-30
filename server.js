var express = require('express');
var smartcar = require('smartcar');
var session = require('express-session');
const request = require('request');
var osmread = require('osm-read-boolive');
var app = express();

app.use(session({ secret: 'one_time_like_first_grade_i_just_randomly_spit_on_someones_car' }));

app.use(function (req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});

const client = new smartcar.AuthClient({
   clientId: '44507a27-e650-40f5-a7a3-9ae57051e821',
   clientSecret: '1a10dfd4-0382-4c3b-b836-c712bf6fc89e',
   redirectUri: 'http://localhost:3000/register_vehicle',
   scope: ['read_vehicle_info', 'read_location', 'read_vin', 'read_odometer'],
   testMode: true,
});

app.use(express.static('public'));

app.get('/location', function (req, res) {
   new smartcar.Vehicle(req.session.vehicle, req.session.token).location().then(function (response) {
      console.log(JSON.stringify(response));
      res.json(response);
   });
})

app.get('/odometer', function (req, res) {
   new smartcar.Vehicle(req.session.vehicle, req.session.token).odometer().then(function (response) {
      console.log(JSON.stringify(response));
      res.json(response);
   });
})

app.get('/speed_limit', function (req, res) {
   var lon = parseFloat(req.param('lon'));
   var lat = parseFloat(req.param('lat'));
   console.log(lon + " " + lat);
   
   //each degree lon/lat ~ 111 km (69 mi)
   //bounding box:
   var w = 10;
   var offset = 0.0001;
   var minLon = lon - offset;
   var minLat = lat - offset;
   var maxLon = lon + offset;
   var maxLat = lat + offset;

   var requri = `http://www.overpass-api.de/api/xapi?*[maxspeed=*][bbox=${minLon},${minLat},${maxLon},${maxLat}]`;
   console.log(requri);
   
   osmread.parse({
      //37.753183, -121.908984
      url: `http://www.overpass-api.de/api/xapi?*[maxspeed=*][bbox=${minLon},${minLat},${maxLon},${maxLat}]`,
      format: 'xml',
      way: function(way){
         console.log('maxspeed: ' + way['tags']['maxspeed']);
         //res.end(way['tags']['maxspeed']);
      },
   });
   
})

app.get('/login', function (req, res) {
   res.end(client.getAuthUrl());
});

app.get('/register_vehicle', function (req, res) {
   let access;

   if (req.query.error) {
      // the user denied your requested permissions
      return next(new Error(req.query.error));
   }

   // exchange auth code for access token
   return client.exchangeCode(req.query.code)
      .then(function (_access) {
         // in a production app you'll want to store this in some kind of persistent storage
         access = _access;
         // get the user's vehicles
         return smartcar.getVehicleIds(access.accessToken);
      })
      .then(function (res) {
         // instantiate first vehicle in vehicle list
         const vehicle = new smartcar.Vehicle(res.vehicles[0], access.accessToken);
         req.session.vehicle = res.vehicles[0];
         req.session.token = access.accessToken;
         // get identifying information about a vehicle
         return vehicle.info();
      })
      .then(function (data) {
         console.log(data);
         // {
         //   "id": "36ab27d0-fd9d-4455-823a-ce30af709ffc",
         //   "make": "TESLA",
         //   "model": "Model S",
         //   "year": 2014
         // }

         // json response will be sent to the user
         res.redirect('/index.html');
      });
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
