/*
 * @license: MIT
 * @copyright: 2014 Siro González Rodríguez
 */
var db = require('./database');
var events = db.collection('events');
var N = require('./../../../nuve');
var ObjectId = require('mongodb').ObjectID;

exports.listEventsCreatedBy = function(user,callback){
	events.find({owner:user._id}).toArray(callback);
};

exports.listEventsByParticipant = function(user, callback){
	events.find({$or: 
		[{participants: user._id},
		 {patient: user._id}, 
		 {collaborators: user._id}]}
	).toArray(callback);
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
		callback('_id is set');
	} else {
		events.save(data, {safe:true}, function(err, o){
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
		//events.save(event, {safe:true}, function(err){
		events.update({_id:event._id}, {mediconline:true})
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