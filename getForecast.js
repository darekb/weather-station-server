var Q = require("q");
var fs = require('fs');
var config = require('./config');
var rp = require('request-promise');
//var fd = require('./fdata');
var getForecast = (function() {
    var _forecastUrl = '';
    var _sockedLog = null;
    var _serialPortSocket = null;
    var _onDataCallback = function() {};

    function getData() {
        _sockedLog = fs.createWriteStream(config.clientLogFile, {
            'flags': 'a'
        });
        _sockedLog.write(new Date() + ' getForecast:  getting forecast' + '\n');
        //rp('https://weather-station-server.herokuapp.com/');
        return rp(config.forecastUrl);
    }

    function emulateData() {
        var d = Q.defer();
        d.resolve(JSON.stringify(fd));
        return d.promise;
    }
    function returnDate(){
        var Today = new Date();
        var hour  = (Today.getHours()<10?'0'+Today.getHours():Today.getHours());
        var minutes  = (Today.getMinutes()<10?'0'+Today.getMinutes():Today.getMinutes());
        var seconds = (Today.getSeconds()<10?'0'+Today.getSeconds():Today.getSeconds());
        var day = (Today.getDate()<10?'0'+Today.getDate():Today.getDate());
        var month = ((Today.getMonth()+1)<10?'0'+(Today.getMonth()+1):(Today.getMonth()+1));
        var year = Today.getFullYear();
        return day + '-' + month + '-' + year + ' ' + hour  + ':' +  minutes  + ':' + seconds;
    }

    function translateToTodayForecast(data) {
        var out = {};

        out.dayName = data.forecast.simpleforecast.forecastday[0].date.weekday;
        out.tempMax = data.forecast.simpleforecast.forecastday[0].high.celsius;
        out.tempMin = data.forecast.simpleforecast.forecastday[0].low.celsius;
        out.aveHumidity = data.forecast.simpleforecast.forecastday[0].avehumidity;
        out.forecastData = returnDate();
        out.data = data.forecast.txt_forecast.forecastday.slice(0, 2).map(function(elem) {
            return {
                title: elem.title,
                icon: elem.icon,
                content: elem.fcttext_metric,
            }
        });
        return out;
    }

    function translateToWeekForecast(data) {
        var out = [];
        data.forecast.simpleforecast.forecastday.forEach(function(elem) {
            out.push({
                weekday: elem.date.weekday,
                icon: elem.icon,
                condition: elem.conditions,
                low: elem.low.celsius,
                high: elem.high.celsius
            });
        });
        return out.slice(1,7);
    }

    var objOut = {
        getData: getData,
        translateToWeekForecast: translateToWeekForecast,
        translateToTodayForecast: translateToTodayForecast,
        emulateData: emulateData,
        returnDate: returnDate
    };
    return objOut;

}());
module.exports = getForecast;