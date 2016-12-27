var config = {};
config.requestTimeForecast = 15;
config.clientLogFile = 'client.txt';
config.forecastUrl = 'http://api.wunderground.com/api/48b36ded6c518d8d/forecast10day/lang:PL/q/pws:IMAZOWIE6.json';
config.firebaseUrl = "https://homeweatherstation-ef415.firebaseio.com"
module.exports = config;