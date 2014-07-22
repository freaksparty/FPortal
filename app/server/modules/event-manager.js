/*
 * @license: MIT
 * @copyright: 2014 Siro González Rodríguez
 */
var DbClass = require('./sql');
var email = require('./email-dispatcher');
var db = new DbClass();
var sprintf = require('sprintf').sprintf;
var N = require('./../../../nuve');
var ObjectId = parseInt;

function getEntity(sql) {
	return new sql.Entity("Events", function(e){
		e.comments = e.comments?e.comments:null;
		e.owner = e.owner?parseInt(e.owner):null;
		e.patient = e.patient?parseInt(e.patient):null;
		e.duration = e.duration?parseInt(e.duration):null;
	}, ["_id", "owner", "patient", "start", "duration", "comments", "status", "moderated"], ["start", "end"]);
}

var events = getEntity(db);

exports.listEventsCreatedBy = function(user, start, count, status, callback){
	for(var i=0; i<status.length; i++)
		status[i] = "'"+db.sanitize(status[i])+"'";
	var query = "SELECT e._id, o.name medic, p.name patient, start, duration, comments FROM Events e "+
	"JOIN Users o ON o._id=owner JOIN Users p ON p._id=patient WHERE owner="+user._id+
	" AND status IN("+status.join(',')+") ORDER BY start DESC LIMIT "+start+","+count;
	db.queryToList(query, {}, {}, function(err, events){
	if(err)
		callback(err, []);
	else if(events.length === 0)
		callback(null, events);
	else {
		var ids = [];
		var assEvents = {};
		for(var i = 0; i<events.length; i++) {
			ids.push(events[i]._id);
			assEvents[events[i]._id] = events[i];
			events[i].participants = [];
		}
			
		query = "SELECT name user, event FROM EventParticipants p JOIN Users u ON u._id = p.user " +
				"WHERE event IN ("+ids.join(',')+")";
		db.queryToList(query, {}, {}, function(err, participants){
			if(err)
				callback(err, events);
			else {
				for(var i = 0; i<participants.length; i++)
					assEvents[participants[i].event].participants.push(participants[i].user);
				callback(null, events);
			}
		});
		
	}
});
};

exports.listEventsByParticipant = function(user, start, count, status, callback){
	for(var i=0; i<status.length; i++)
		status[i] = "'"+db.sanitize(status[i])+"'";
	var query = "SELECT e._id, o.name medic, p.name patient, start, duration, comments " +
			"FROM Events e JOIN Users o ON o._id=owner JOIN Users p ON p._id=patient " +
			"WHERE e._id IN (SELECT event FROM EventParticipants WHERE user="+ user._id + ") " +
			"AND status IN("+status.join(',')+") ORDER BY start DESC LIMIT "+start+","+count;
	db.queryToList(query, {}, {}, function(err, events){
		if(err)
			callback(err, []);
		else if(events.length === 0)
			callback(null, events);
		else {
			var ids = [];
			var assEvents = {};
			for(var i = 0; i<events.length; i++) {
				ids.push(events[i]._id);
				assEvents[events[i]._id] = events[i];
				events[i].participants = [];
			}
				
			query = "SELECT name user, event FROM EventParticipants p JOIN Users u ON u._id = p.user " +
					"WHERE event IN ("+ids.join(',')+")";
			db.queryToList(query, {}, {}, function(err, participants){
				if(err)
					callback(err, events);
				else {
					for(var i = 0; i<participants.length; i++)
						assEvents[participants[i].event].participants.push(participants[i].user);
					callback(null, events);
				}
			});
			
		}
	});
};

//with 3 args, arg1=userId & arg2=callback the participation status will be included
//with 2 args, arg1=callback so no participation status can be included
function findEventById(eventId, arg1, arg2) {
	var userId = null, callback, query;
	if(arg2 === undefined){
		callback = arg1;
		query = "SELECT _id, owner, patient, start, duration, comments, moderated, status FROM Events WHERE _id=:event";
	} else {
		userId = ObjectId(arg1);
		callback = arg2;
		query = "SELECT _id, owner, patient, start, duration, moderated, comments, e.status, p.status participationstatus " +
				"FROM Events e JOIN EventParticipants p WHERE _id=:event AND user=:user";
	}
	
	eventId = ObjectId(eventId);
	db.queryToObject(query, {event:eventId, user:userId}, function(e, o){
		if(e) callback(e);
		else if(!o) callback("Not found");
		else {
			o.start = db.parseMoment(o.start);
			getEventParticipantsArray(eventId, function(err, arr){
				if(err) callback(err);
				else {
					o.participants = arr;
					callback(null, o);
				}
			});
		}
	});
};
exports.findEventById = findEventById;

exports.updateEvent = function(newData, callback) {
	function deleteParticipants(sql, ids, eventId, callback){
		if(ids.length > 0) {
			var query = "DELETE FROM EventParticipants WHERE event=:event";
			if(ids.length > 0)
				query += " AND user IN ("+ids.join(',')+")";
			sql.updateQuery(query, {event:eventId}, function(err, affected){
				if(err) {							
					callback(err);
				} else {
					if(affected != ids.length)			
						console.log('[Warning] event-manager updateEvent deleteParticipants deleting: '+ids.length+' but deleted: '+affected);

					for(var i=0; i<ids; i++){
						email.sendCancellation(ids, newData);
					}
					callback();
				}
			});
		} else {
			callback();
		}
	}
	
	function addParticipants(sql, ids, eventId, callback) {
		if(ids.length > 0) {
			var add = [];
			for(var i=0; i<ids.length; i++)
				add.push(sprintf("(%d,%s)", eventId, ids[i]));

			var query = "INSERT INTO EventParticipants (event, user) VALUES "+add.join(',');
			sql.updateQuery(query, {}, function(err, added){
				if(err) {
					console.log('[Error] event-manager adding users to event: ',err);
					callback("Error adding participants");
				} else if (added !== add.length){
					console.log('[Error] event-manager adding users to event, adding: '+add.length+' but only added:'+added);
					callback("Not all participants added");												
				} else {
					for(var i=0; i<ids.length; i++)
						email.sendInvitation(parseInt(ids[i]),newData);
					callback();		
				}											
			});
		} else 
			callback();
	}
	
	
	newData._id = ObjectId(newData._id);
	if(newData.participants == undefined) newData.participants = [];
	events.findOne({_id : newData._id}, function(e,o){
		if(e) {
			console.log('[Error] event-manager updateEvent: ',e);
			callback('Event not found');
		} else {
			getEventParticipantsArray(newData._id, function(e, oldParticipants){
				if(e) {
					console.log('[Error] event-manager updateEvent, getting event particpants:'+e);
					callback('Internal error');
				} else {
					var sql = new DbClass();
					sql.startTransaction();
					tEvents = getEntity(sql);
					tEvents.save(newData, {safe:true}, function(err){
						if(err){
							console.log('[Error] event-manager saving new data: ',err);
							sql.close();
							callback('Error saving data');
						} else {
							var deletedP = [];
							var addedP = [];
							var persistP = [];
							for(var i=0; i<oldParticipants.length; i++){
								if(newData.participants.indexOf(oldParticipants[i]) === -1)
									deletedP.push(oldParticipants[i]);
								else
									persistP.push(oldParticipants[i]);
							}
							for(var i=0; i<newData.participants.length; i++){
								if(oldParticipants.indexOf(newData.participants[i]) === -1)
									addedP.push(newData.participants[i]);
							}
							deleteParticipants(sql, deletedP, newData._id, function(err){
								if(err) {
									sql.close();
									callback(err);									
								}
									
								else addParticipants(sql, addedP, newData._id, function(err){
									if(err) {
										sql.close();
										callback(err);
									} else {
										sql.commit();
										callback(null, newData);
										for(var i=0; i<persistP.length; i++){
											//email.sendModification()
										}
									}
										
								});
							});
						}
					});
				}
				
			});
			
		}			
	});
};

exports.getStatusByIds = function(evId, usId, callback) {
	var query = "SELECT event, user, p.status invitationStatus, e.status eventStatus, start, owner " +
			"FROM EventParticipants p JOIN Events e ON p.event=e._id " +
			"WHERE event=:event AND user=:user";
	db.queryToObject(query, {event:evId, user:usId}, function(err, res) {
		if(err)
			callback(err);
		else if(!res)
			callback('The event does not exists');
		else {
			res.event = parseInt(res.event);
			res.user = parseInt(res.user);
			res.start = db.parseMoment(res.start);
			res.owner = parseInt(res.owner);
			callback(null, res);
		}
	});
};

exports.createEvent = function(data, callback) {
	if(data._id) {
		console.log('[Error] event-manager createEvent: event._id is set');
		callback('Id is set ¿The event already exists?');
	} else {
		var sql = new DbClass();
		sql.startTransaction();
		tEvents = getEntity(sql);
		tEvents.insert(data, {safe:true}, function(err, o){
			if(err){
				console.log('[Error] event-manager createEvent: saving new data: ',err);
				sql.close();
				callback('Error saving data');
				return;
			} else { 
				var participants = data.participants;
				var length = participants.length;
				if(length > 0) {
					var values = [];
					for(var i = 0; i < length; i++)
						values.push(sprintf("(%d,%d)", o._id, ObjectId(participants[i])));

					var query = "INSERT INTO EventParticipants (event,user) VALUES" +
						values.join(',');
					sql.updateQuery(query, {}, function(err, affected){
						if(err)
							callback(err);
						else if(affected != length) {						
							console.log(sprintf("[ERROR] Inserting participants, there are %d but only %d where inserted", length, affected));
							callback("Error inserting participants");
							sql.close();
						} else {
							data._id = o._id;
							console.log(o);
							for(var i = 0; i < length; i++)
								email.sendInvitation(ObjectId(participants[i]), data);
							sql.commit();
							callback(null, o);	
						}
					});
				} else { //This won't be as long patient is one participant, but this can change in the future
					sql.commit();
					callback(null,o);
				}
			}
		});
	}
};

/* Returns number of conflicting events if any
 * medic: medic _id
 * eventId: null or an _id to ignore that event (your are testing an update for an already existing event)
 */
exports.checkEventCollision = function(medic, eventId, start, duration, callback) {
	var startString = db.momentToString(start);
	var endString = db.momentToString(start.add('minutes', duration));
	var query = "SELECT COUNT(*) FROM Events " +
			"WHERE ( (start BETWEEN '"+startString+"' AND '"+endString+"') " +
			"OR (end BETWEEN '"+startString+"' AND '"+endString+"') " +
			"OR ('"+startString+"' BETWEEN start AND end) " +
			"OR ('"+endString+"' BETWEEN start AND end) ) " +
			"AND owner = "+medic+" AND status IN ('Created', 'MedicIn')";
	if(eventId !== null) 
		query += " AND _id !="+eventId;
	
	db.queryToArray(query, {}, function(err, result){
		if(err || !result){
			console.log("[SQL] ", query);
			console.log("[Error] event-manager checkEventCollision, queryToArray says", err);
			callback(err);
		} else {
			callback(null, result[0]);
		}
	});
	
};

exports.getToken = function(user, roomId, callback) {
	N.API.createToken(roomId, user.user, 'presenter', function(token) {
		callback(null, token);
	}, function(e){
		console.log('[Error] event-manager getToken unable to create token: '+e);
		callback('Internal error');
	});
};

exports.setEventStatus = function(eventId, status, callback) {
	eventId = ObjectId(eventId);
	var query = "UPDATE Events SET status = :status WHERE _id=:event";
	db.updateQuery(query, {status:status, event:parseInt(eventId)}, function(err, affected) {
		if(err) {
			console.log("[Error] event-manager: setEventStatus, updateQuery says:", err);
			callback(err);
		} if (affected !== 1) {
			console.log("[Error] event-manager: setEventStatus, updateQuery updated "+affected+" rows!");
			callback(affected+' events changed');
		} else {
			//Send cancellation email
			if(status === 'Cancelled') {
				findEventById(eventId, function(err, event){
					if(err) console.log("[Error] event-manager setEventStatus(id="+eventId+") findEventById() says", err);
					else for(var i = 0; i < event.participants.length; i++)
						email.sendCancellation(ObjectId(event.participants[i]), event);
				});
			}
			callback();
		}		
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

exports.setParticipationStatus = function(eventId, userId, newStatus, callback) {
	console.log(userId);
	eventId = ObjectId(eventId);
	userId = ObjectId(userId);
	if((newStatus != 'WontCome') && (newStatus != 'Confirmed'))
		callback('Invalid state');
	else {
		var query = "SELECT COUNT(*) FROM EventParticipants WHERE event=:event AND user=:user";
		db.queryToArray(query, {event:eventId, user:userId}, function(e, arr){
			if(e) {
				console.log("[Error] event-manager setParticipationStatus error in DB", e);
				callback("Internal error");
			} else if(arr[0] == 0) {
				console.log("[Error] event-manager setParticipationStatus, no participation found for event "+eventId+" & user "+userId);
				callback(null,null);
			} else if(arr[0] != 1) {
				console.log("[Error] event-manager setParticipationStatus, "+arr[0]+" rows match the participation");
				callback("Internal error");
			} else db.updateQuery("UPDATE EventParticipants SET status=:newStatus WHERE event=:event AND user=:user",
					{newStatus:newStatus, user:userId, event:eventId}, function(err, affected){
						if(e){
							console.log("[Error] event-manager setParticipantStatus(): updateQuery() says:", e);
							callback("Internal error");
						} else
							callback(null, newStatus);							
					});
		});
	}		
};

function getEventParticipantsArray(eventId, callback) {
	db.queryToArray("SELECT user FROM EventParticipants WHERE event=:event", {event:eventId}, function(e,arr){
		if(e) callback(e);
		else {
			callback(null, arr);
		}
	});	
}

function getEventParticipants(eventId, callback) {
	db.queryToList("SELECT _id, name, status FROM Users JOIN EventParticipants ", callback);
}