var MongoDB 	= require('mongodb').Db;
var Server 	= require('mongodb').Server;

var config	= require('../../../config').db;

var db = new MongoDB(config.db, 
		     new Server(config.host, config.port, {auto_reconnect: true}),
		     {w: 1});

db.open(function(e, client){
	if (e) {
		console.log(e);
	} else {
		console.log('connected to database :: ' + config.db );
	}
});

//module.export = function(callback){db.on('connect', callback)};
exports.ready = function(callback){db.on('connect', callback)};
exports.instance = db;

exports.collection = function(name, callback) {
  var col;
  db.on('connect', function(){
    db.collection(name, {strict:true}, function(err, collection){
      if(err)
	db.createCollection(name, function(err, result) {
	  db.collection(name, {strict:true}, function(err, collection) {
	    if(err) console.log("[Error] Could not retrieve " + name + " collection");
	    else col = collection;
	  });
	});
      else
	col = collection;
    });
  });
  //return col;
  callback(col);
}