/*
 * @license: MIT
 * @copyright: 2014 Siro González Rodríguez
 */
var db = require('./database');
var events = db.collection('events');
var N = require('./../../../nuve');

exports.listEventsCreatedBy = function(user,callback){
	events.find({room:user.room}).toArray(callback);
};

exports.listEventsByParticipant = function(user, callback){
	events.find({participants: user._id}).toArray(callback);
};

/*exports.addRoom = function(roomData, callback)
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
/*exports.getRoomToken = function (roomId, userName, callback)
{
	N.API.createToken(roomId, userName, 'presenter', callback, function(e){console.log('Error creating token:'+e);});
};*/