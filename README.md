# Slowly

https://devpost.com/software/lowly

### Inspiration
Every year, thousands of car accidents happen due to speeding teenagers.

### What it does
$lowly gamifies safe driving to encourage positive driving behavior. Teens can score points for safe driving which can be transferred into monetary awards by their parents.

### How we built it
We used node.js as the framework for the web app. We used a combination of OpenStreetMaps' and Smartcar's APIs to track users, speed limits, vehicle speed, and location.

### Challenges we ran into
Since we did not have an API that tracked actual vehicle speed, we figure out how to most accurately calculate speed based on distance traveled and time elapsed.

### Accomplishments that we're proud of
-Developing our own method to measure vehicle speed -Making a good-looking frontend

### What we learned
Many of us were new to node.js. It was exciting to learn. More generally, it was a great learning experience on teamwork and how to think outside of the box when you don't have all the resources you need.

### What's next for $lowly
We hope to incorporate features that can transfer money from parents to teens based on our point system

Function that polls /location and /odometer

store this info in json object

array of json objects 
{car_id: [ 
	{time: Date, lat: double, lon: double, speed: double, speeding: bool, },
]}
Key is time stamp
value is location

keep track of points in dict: 
{car_id : points, ...}
