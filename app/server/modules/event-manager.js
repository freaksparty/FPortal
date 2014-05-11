/*
 * @license: MIT
 * @copyright: 2014 Siro González Rodríguez
 */
var db = require('./sql');
//var events = db.collection('events');
var events = db.events;
var N = require('./../../../nuve');
//var ObjectId = require('mongodb').ObjectID;
var ObjectId = parseInt;

exports.listEventsCreatedBy = function(user,callback){
	var query = "SELECT e._id, o.name, p.name, start, duration, comments FROM Events e "+
	"JOIN Users o ON o._id=owner JOIN Users p ON p._id=patient WHERE owner="+user._id;
	db.queryToList(query, {}, {}, function(err, events){
	if(err)
		callback(err, []);
	else {
		callback(null, events);
	}
});
};

exports.listEventsByParticipant = function(user, callback){
	var query = "SELECT e._id, o.name, p.name, start, duration, comments " +
			"FROM Events e JOIN Users o ON o._id=owner JOIN Users p ON p._id=patient " +
			"WHERE e._id IN (SELECT event FROM EventParticipants WHERE user="+ user._id + ") " +
			"OR patient="+user._id;
	db.queryToList(query, {}, {}, function(err, events){
		if(err)
			callback(err, []);
		else {
			callback(null, events);
		}
	});
};

exports.findEventById = function(eventId, callback) {
	events.findOne({_id:ObjectId(eventId)}, function(e, o){
		if(e) callback(e);
		else callback(null, o);
	});
};

exports.updateEvent = function(newData, callback) {
	//newData._id = ObjectId(newData._id);
	events.find({_id : newData._id}, function(e,o){
		if(e) {
			console.log('[Error] event-manager updateEvent: ',e);
			callback('Event not found');
		} else {
			events.save(newData, {safe:true}, function(err){
				if(err){
					console.log('[Error] event-manager saving new data: ',err);
					callback('Error saving data');
				} else 
					callback(null, newData);
			});
		}			
	});
};

exports.createEvent = function(data, callback) {
	if(data._id) {
		console.log('[Error] event-manager createEvent: event._id is set');
		callback('Id is set ¿The event already exists?');
	} else {
		events.insert(data, {safe:true}, function(err, o){
			if(err){
				console.log('[Error] event-manager createEvent: saving new data: ',err);
				callback('Error saving data');
			} else 
				callback(null, o);
		});
	}
};

exports.getToken = function(user, roomId, callback) {
	N.API.createToken(roomId, user.user, 'presenter', function(token) {
		callback(null, token);
	}, function(e){
		console.log('[Error] event-manager getToken unable to create token: '+e);
		callback('Internal error');
	});
};

exports.getTokenForMedic = function(user, event, callback) {
	N.API.createToken(user.room, user.user, 'presenter', function(token) {
		event.mediconline = true;
		events.save(event, {safe:true}, function(err){
		//events.update({_id:event._id}, {mediconline:true})
			if(err){
				console.log('[Error] event-manager getTokenForMedic setting mediconline: ',err);
				callback('Internal error');
			} else 
				callback(null, token);
		});		
	}, function(e){
		console.log('[Error] event-manager getTokenForMedic unable to create token: '+e);
		callback('Internal error');
	});
};