var express = require('express');
var smartcar = require('smartcar');
var session = require('express-session');
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

var carDB = {}

app.use(express.static('public'));

app.get('/continue', function (req, res) {
   if (req.session.vehicle) {
      res.end('/dashboard.html');
   } else {
      res.end('/register.html');
   }
})

app.get('/car_info', function (req, res) {
   // {"id":"048603ff-1775-4fba-9e44-ed905f89c54a","make":"TESLA","model":"Model 3","year":2018}
   new smartcar.Vehicle(req.session.vehicle, req.session.token).info().then(function (response) {
      console.log(JSON.stringify(response));
      res.json(response);
   });
})

//assumes carDB has correct car_id for all cars
//for each key in carDB, 
app.get('/getDB', function (req, res) {
   res.end(JSON.stringify(carDB));
})

app.get('/location', function (req, res) {
   // {"data":{"latitude":37.35966873168945,"longitude":-107.14901733398438},"age":"2019-03-30T22:31:39.025Z"}
   new smartcar.Vehicle(req.session.vehicle, req.session.token).location().then(function (response) {
      console.log(JSON.stringify(response));
      res.json(response);
   });
})

//38.635830, -121.496319
//38.639945, -121.483167
//console.log(getDistance(-121.496319,38.635830,-121.483167,38.639945));
//
function getDistance(lon1, lat1, lon2, lat2) {
   //lat => phi, lon => lambda
   var phi1 = lon1 * Math.PI / 180;
   var lambda1 = lat1 * Math.PI / 180;
   var phi2 = lon2 * Math.PI / 180;
   var lambda2 = lat2 * Math.PI / 180;
   var dlambda = Math.abs(lambda2 - lambda1)

   var rad = 6371; //km
   var num = Math.sqrt(Math.cos(phi2) * Math.sin(dlambda) * Math.sin(dlambda) + Math.pow(Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dlambda) * Math.cos(dlambda), 2));
   var denom = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(dlambda);
   var dsigma = Math.atan2(num, denom);
   return rad * dsigma;
}

function getSpeeds(car_id) {
   if (carDB.length < 2) return;
   for (var i = 1; i < carDB[car_id].length; i++) {
      var dist = getDistance(carDB[car_id][i]['lon'], carDB[car_id][i]['lat'], carDB[car_id][i - 1]['lon'], carDB[car_id][i - 1]['lat']);
      var time = (carDB[car_id][i]['time'] - carDB[car_id][i - 1]['time']) / 3600000;
      carDB[car_id][i]['speed'] = (dist / time);
   }
}

app.get('/odometer', function (req, res) {
   // {"data":{"distance":17666.08984375},"age":"2019-03-30T22:31:57.195Z","unitSystem":"metric"}
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
   var offset = 0.00002;
   var minLon = lon - offset;
   var minLat = lat - offset;
   var maxLon = lon + offset;
   var maxLat = lat + offset;

   var requri = `http://www.overpass-api.de/api/xapi?*[maxspeed=*][bbox=${minLon},${minLat},${maxLon},${maxLat}]`;
   console.log(requri);

   osmread.parse({
      url: requri,
      format: 'xml',
      way: function (way) {
         console.log('maxspeed: ' + way['tags']['maxspeed']);
         res.end(way['tags']['maxspeed']);
      },
   });
})

app.get('/login', function (req, res) {
   res.end(client.getAuthUrl());
})

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
         carDB[data['id']] = [];
         // {
         //   "id": "36ab27d0-fd9d-4455-823a-ce30af709ffc",
         //   "make": "TESLA",
         //   "model": "Model S",
         //   "year": 2014
         // }

         // json response will be sent to the user
         setInterval(() => {
            Object.keys(carDB).forEach((car_id) => {
               // {"data":{"latitude":37.35966873168945,"longitude":-107.14901733398438},"age":"2019-03-30T22:31:39.025Z"}
               new smartcar.Vehicle(car_id, req.session.token).location().then((car) => {
                  carDB[car_id].push({ time: new Date(car["age"]), lat: car["data"]["latitude"], lon: car["data"]["longitude"] });
               })
            })
         }, 10000);
         res.redirect('/dashboard.html');
      });
})

var server = app.listen(3000, function () {
   var host = server.address().address;
   var port = server.address().port;

   console.log("pastapasta is listening at http://%s:%s", host, port);
})
