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
var app = express();
app.locals.moment = require('moment');

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
    res.header('Access-Control-Allow-Headers', 'origin, content-type');
    if (req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

//Licode service init
N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, 'http://localhost:3000/');

/*var myRoom;

N.API.getRooms(function (roomlist) {
    "use strict";
    var rooms = JSON.parse(roomlist);
    console.log(rooms.length);
    if (rooms.length === 0) {
        N.API.createRoom('myRoom', function (roomID) {
            myRoom = roomID._id;
            console.log('Created room ', myRoom);
        });
    } else {
        myRoom = rooms[0]._id;
        console.log('Using room ', myRoom);
    }
});*/

require('./app/server/router-accounts')(app);
require('./app/server/router-rooms')(app);
app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

app.configure('development', function(){
	app.use(express.errorHandler());
});

/*app.post('/createToken/', function (req, res) {
    "use strict";
    var room = myRoom,
        username = req.body.username,
        role = req.body.role;
    N.API.createToken(room, username, role, function (token) {
        console.log(token);
        res.send(token);
    });
});

app.get('/getRooms/', function (req, res) {
    "use strict";
    N.API.getRooms(function (rooms) {
        res.send(rooms);
    });
});

app.get('/getUsers/:room', function (req, res) {
    "use strict";
    var room = req.params.room;
    N.API.getUsers(room, function (users) {
        res.send(users);
    });
});*/

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});