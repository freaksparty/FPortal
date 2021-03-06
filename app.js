/*global require, __dirname, console*/
/**
  * FPortal main application
  * http://github.com/freaksparty/FPortal
  * Copyrigth (c) 2015 Siro González
  * 
**/

var express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    net = require('net'),
    fs = require("fs"),
    i18n = require('i18n-2');

var app = express();

var config = require('./config.js');

//Object that modules might modify to insert behaviour
var handlers = {
  routes : ['./core/server/routes']
};

if(typeof config.timezone === 'string')
	process.env.TZ = config.timezone;
else {
	process.env.TZ = 'Europe/Madrid';
	console.log('[!!] Please, set timezone in config.js file.');
}

//Include cookie parser middle before i18n bind

i18n.expressBind(app, {
  locales: ['es', 'en'],
  defaultLocale: 'es',
  cookieName: 'locale'
});
app.use(function(req, res, next) {
  req.i18n.setLocaleFromQuery();
  req.i18n.setLocaleFromCookie();
  next();
});

app.locals.moment = require('moment');
app.locals.sprintf = require('sprintf').sprintf;
app.locals.title = config.title;
app.locals.handlers = handlers;
app.locals.core = {
    roles: ['User', 'Admin'],
    adminRole: 'Admin',
    defaultRole: 'User'
}

module.exports = app;

app.set('port', config.port);
app.set('views', __dirname + '/virtual/views');
app.set('view engine', 'jade');
app.locals.pretty = true;
//	app.use(express.favicon());
//	app.use(express.logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(express.cookieParser());
//app.use(express.session({ secret: config.blowfish }));
//app.use(express.methodOverride());
app.use(require('stylus').middleware({ src: __dirname + '/core/public' }));
app.use(express.static(__dirname + '/core/public'));
app.use(session({
  secret: config.blowfish,
  saveUninitialized: false,
  resave: false, //TODO: review this setting with store backend selected (must implement "touch()" or set this to "true"
  //TODO: set appropiate session store backend (default is non liable for production)
}));

//CORS enabler (will be moved)
/*app.use(function (req, res, next) {
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
});*/

//Licode service init
//N.API.init(licode_config.nuve.superserviceID, licode_config.nuve.superserviceKey, 'http://localhost:3000/');

handlers.routes.forEach(function(router){
  require(router)(app);
});
app.get('*', function(req, res) { res.render('core/404', { title: 'Page Not Found'}); });


if(config.ssl.enabled === true){
	var https = require('https');
	var ssloptions = {
		key: fs.readFileSync(config.ssl.keyfile, 'utf8'),
		cert: fs.readFileSync(config.ssl.cerfile, 'utf8')
	};
	https.createServer(ssloptions, app).listen(app.get('port'), function(){
		console.log("Express server listening on port (SSL enabled) " + app.get('port'));
	});
} else {
	app.listen(app.get('port'), function(){
		console.log("Express server listening on port (SSL disabled) " + app.get('port'));
	})
}

//Reverse proxy (will be moved)
/*if(config.ssl.builtInProxy === true){
  var httpProxy = require('http-proxy');
  var ssloptions = {
	key: fs.readFileSync(config.ssl.keyfile, 'utf8'),
	cert: fs.readFileSync(config.ssl.cerfile, 'utf8')
  };

  var proxy = httpProxy.createServer({
	target: {
		host: 'localhost',
		port: 8080,
	},
	ws: true,
	ssl: ssloptions,
	secure: true
  }).listen(8081);
  proxy.on('error', function (e) {
	console.log('Could not enable Erizo proxy: ' + e);
  });
}*/