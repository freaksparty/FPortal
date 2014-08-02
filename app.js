/*global require, __dirname, console*/
/**
	* 
	* More Info : http://bit.ly/LsODY8
	* Copyright (c) 2013 Stephen Braitsch
**/

var express = require('express'),
    net = require('net'),
    N = require('./nuve'),
    fs = require("fs"),
    https = require("https"),
    config = require('./../licode/licode_config');
var http = require('http');
var https = require('https');
var app = express();
process.env.TZ = 'Europe/Madrid'; //TODO config file
app.locals.moment = require('moment');
app.locals.sprintf = require('sprintf').sprintf;

module.exports = app;

app.configure(function(){
	app.set('port', 8888);
	app.set('views', __dirname + '/app/server/views');
	app.set('view engine', 'jade');
	app.locals.pretty = true;
//	app.use(express.favicon());
//	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'super-duper-secret-secret' }));
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
N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, 'http://localhost:3000/');

require('./app/server/router-accounts')(app);
require('./app/server/router-events')(app);
app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

app.configure('development', function(){
	app.use(express.errorHandler());
});

/*http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});/**/

var ssloptions = {
		  key: fs.readFileSync('/home/siro/piamad.cert.key', 'utf8'),
		  cert: fs.readFileSync('/home/siro/piamad.cert.cert', 'utf8')
		  //ca: fs.readFileSync('/home/ec2-user/ca.pem')
		};
https.createServer(ssloptions, app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});/**/