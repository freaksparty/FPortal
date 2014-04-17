/*
 * @license: MIT
 * @copyright: 2014 Siro González Rodríguez
 */
var db = require('./database');
var rooms = db.collection('rooms');
var N = require('./../../../nuve');


/* Checks if my app rooms actually exist in nuve DB */
/*setTimeout(function(){
	rooms.find({}).toArray(function(err, roomlist){
		roomlist.forEach(function(room){
			var cb = function() {
				console.log("Removing inexistent (in nuve) room:", room._id);
				rooms.remove({_id: room._id}, function(){});
			};
			N.API.getRoom(room._id, function(){}, cb);
		});
	});
}, 500);*/

exports.addRoom = function(roomData, callback)
{
	N.API.createRoom(
			roomData.name, 
			function(licodeRoom) {
				rooms.insert(
						{
							_id			: licodeRoom._id,			//Keeps _id same as Licode's
							name		: roomData.name,
							owner		: roomData.user
						}, {w:0});  //TODO: delete room if inserting fails
			},
			function(e){
				console.log('Error creating room:', e);
			});
};

exports.getRooms = function( callback )
{
	rooms.find({}).toArray(callback);
};

/*
 * @param callback(newTokenString)
 */
exports.getRoomToken = function (roomId, userName, callback)
{
	N.API.createToken(roomId, userName, 'presenter', callback, function(e){console.log('Error creating token:'+e);});
};