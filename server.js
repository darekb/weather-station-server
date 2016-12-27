//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var app     = express();
var eps     = require('ejs');
var Q = require("q");
var firebase = require("firebase");
var admin = require("firebase-admin");
var config = require('./config');
var getForecast = require('./getForecast');

app.engine('html', require('ejs').renderFile);

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  res.render('index.html', { test : process.env.private_key.replace(/\\\\n/,"\n")});
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

var cred  = {
  "type": "service_account",
  "project_id": process.env.project_id,
  "private_key_id": process.env.private_key_id,
  "private_key": process.env.private_key,
  "client_email": process.env.client_email,
  "client_id": process.env.client_id,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.client_x509_cert_url
};

var defaultApp = admin.initializeApp({
    credential: admin.credential.cert(cred),
    databaseURL: config.firebaseUrl
});


var addToFirebase = function(dataRef, data) {
    var d = Q.defer();
    var newRef = dataRef.push(data);
    if (newRef) {
        d.resolve(newRef.key);
    } else {
        d.reject("The write operation failed");
    }
    return d.promise;
}


if(defaultApp){
    if(defaultApp.database()){
        console.log(cred);
        console.log(defaultApp.name + ' ALL OK');
        console.log('defaultApp.options.credential', defaultApp.options.credential);
        console.log('defaultApp.options.databaseURL', defaultApp.options.databaseURL); 
        addToFirebase(defaultApp.database().ref('test/'), new Date().toString());
    } else {
       console.log('Error create defaultApp.database()'); 
    }
} else {
    console.log('Error create defaultApp');
}

var updateForecast = function(dataRef, data) {
    return dataRef.set(data);
}

var getForecastFromNet = function() {
    getForecast.getData().then(function(out) {
    //getForecast.emulateData().then(function(out) {
        return Q.all([
            getForecast.translateToWeekForecast(JSON.parse(out)),
            getForecast.translateToTodayForecast(JSON.parse(out))
        ]);
    }).then(function(out) {
        defaultApp.database().ref('weekForecast/').once('value').then(function(snap) {
            var val = snap.val();
            var keys = [];
            var i = 0;
            for (var k in val) {
                keys.push(k);
            }
            return Q.all([
                updateForecast(defaultApp.database().ref('weekForecast/' + keys[0]), out[0]),
                addToFirebase(defaultApp.database().ref('todayForecast/'), out[1])
            ]);
        });
    }).then(function(out) {
        console.log(out);
        console.log(getForecast.returnDate(), ' - Last downloaded forecast OK');
        return true;
    }).catch(function(error) {
        console.error(error);
    });
};
getForecastFromNet();
setInterval(function() {
  getForecastFromNet();
}, (config.requestTimeForecast * 60 * 1000));

module.exports = app ;
