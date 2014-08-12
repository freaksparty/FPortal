/*global require, __dirname, console*/
/**
  * PIAMAD main application
  * http://github.com/xiromoreira/PIAMAD
  * Copyrigth (c) 2014 Siro González
  * 
  * Some parts:
  * Copyright (c) 2013 Stephen Braitsch
**/

var express = require('express'),
    net = require('net'),
    N = require('./nuve'),
    fs = require("fs"),
    https = require("https"),
    licode_config = require('./../licode/licode_config');
	config = require('./config.js');
	http = require('http');
	https = require('https');
	app = express();

if(typeof config.timezone === 'string')
	process.env.TZ = config.timezone;
else {
	process.env.TZ = 'Europe/Madrid';
	console.log('[!!] Please, set timezone in config.js file.');
}

app.locals.moment = require('moment');
app.locals.sprintf = require('sprintf').sprintf;

module.exports = app;

app.configure(function(){
	app.set('port', config.port);
	app.set('views', __dirname + '/app/server/views');
	app.set('view engine', 'jade');
	app.locals.pretty = true;
//	app.use(express.favicon());
//	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: config.blowfish }));
	app.use(express.methodOverride());
	app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
	app.use(express.static(__dirname + '/app/public'));
});

app.use(function (req, res, next) {
    "use strict";
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-type');
    if (req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

//Licode service init
N.API.init(licode_config.nuve.superserviceID, licode_config.nuve.superserviceKey, 'http://localhost:3000/');

require('./app/server/router-accounts')(app);
require('./app/server/router-events')(app);
app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

app.configure('development', function(){
	app.use(express.errorHandler());
});

if(config.ssl.enabled === true){
	var ssloptions = {
			key: fs.readFileSync(config.ssl.keyfile, 'utf8'),
			cert: fs.readFileSync(config.ssl.cerfile, 'utf8')
			//ca: fs.readFileSync('/home/ec2-user/ca.pem')
	};
	https.createServer(ssloptions, app).listen(app.get('port'), function(){
		console.log("Express server listening on port (SSL enabled) " + app.get('port'));
	});
} else {
	http.createServer(app).listen(app.get('port'), function(){
		console.log("Express server listening on port (SSL disabled)" + app.get('port'));
	});
}