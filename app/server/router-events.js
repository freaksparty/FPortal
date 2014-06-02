/**
 * Plataforma Informática de Asistencia Médica A Distancia
 * 
 * Copyright (c) 2014 Siro González
 * @license MIT
 **/
var AM = require('./modules/account-manager');
var EM = require('./modules/event-manager');
var email = require('./modules/email-dispatcher');
var N = require('./../../nuve');
var moment 		= require('moment');

module.exports = function (app){

	app.get('/events', function(req,res) {
		function listByParticipant(ownList) {
			EM.listEventsByParticipant(req.session.user, function(e, list){
				for(var i=0;i<ownList.length;i++)
					if (ownList[i].start !== undefined)
						ownList[i].start = moment(ownList[i].start).format('DD/MM/YYYY HH:mm'); 
				for(var i=0;i<list.length;i++)
					if (list[i].start !== undefined)
						list[i].start = moment(list[i].start).format('DD/MM/YYYY HH:mm');
				if(e) {
					console.log('[Error] router-events /events: failed to get invited event list:',e);
					list = [];
				}
				AM.listUsersSmall(function(e, users){
					if(e){
						console.log('[Error] router-events /events: failed to get all user list', e);
						res.render('error', {
							title : 'Internal error',
						});
					} else {
						//TODO: convert uids to names
						//for(var i = 0; i<users.ownList; i++)
						res.render('events', {
							title			: 'Your events',
							sessionUser		: req.session.user,
							ownEventList	: ownList,
							guestEventList	: list,
							users			: users
						});
					}
				});
			});
		};
		if ((req.session.user == null)){
			res.redirect('/');
		} else {
			if(req.session.user.room) {
				EM.listEventsCreatedBy(req.session.user, function(e, ownList){
					if(e){
						console.log('[Error] router-events /events: failed to get own event list:',e);
					} //continue with guest events ignoring the error ¿Better options?
					listByParticipant(ownList);						
				});
			} else {
				listByParticipant([]);
			}
		}
	});
	app.get('/event', function(req, res){
		if ((req.session.user == null) || (req.session.user.role !== 'Medic')){
			res.redirect('/');
		} else {
			AM.listUsersSmall(function(e,ul) {
				if(e) {
					console.log('[Error] router-events /event:',e);
					res.render('error',{
						title	: 'Internal Error'
					});
				} else {
					res.render('eventform', {
						title		: 'Create event',
						sessionUser	: req.session.user,
						userList	: ul
					});
				}
			});			
		}
	});
	app.get('/event/:eventId/', function(req, res) {
		if ((req.session.user == null)){
			req.session.redirect = req.protocol + '://' + req.get('host') + req.originalUrl;
			res.redirect('/');
		} else {
			var route = 'router-events /event/'+req.params.eventId+' ';
			EM.findEventById(req.params.eventId, function(e, ev){
				if(e || !ev) {
					console.log('[Error] '+route+'findEventById() says:', e);
					res.render('error', {
						title	: 'Event not found',
						error	: ['The event you tried to open does not exist.','Maybe it was cancelled er edited.'],
						backUrl	: '/events'
					});
				} else {
					/*if(!ev.collaborators) ev.collaborators = [];
					if(!ev.relatives) ev.relatives = [];*/
					if ((ev.owner != req.session.user._id) &&
							(ev.patient != req.session.user._id) &&
							/*(ev.collaborators.indexOf(String(req.session.user._id)) === -1) &&
							(ev.relatives.indexOf(String(req.session.user._id)) === -1)*/
							(ev.participants.indexOf(String(req.session.user._id)) === -1)) {
						console.log('[Error] '+route+' permission denied to '+req.session.user._id+
								' to event '+ev._id, e);
						res.render('error', {
							title	: 'Event not found',
							error	: ['The event you tried to open does not exist.','Maybe it was cancelled er edited.'],
							backUrl	: '/events'
						});
					} else AM.listUsersSmall(function(e,ul) {
						if(e) {
							console.log('[Error] '+route,e);
							res.render('error',{
								title	: 'Internal Error'
							});
						} else {
							if(ev.owner === req.session.user._id){
								ev.date = moment(ev.start).format('DD/MM/YYYY');
								ev.hour = moment(ev.start).format('HH:mm');
								res.render('eventform', {
									title		: 'Edit event',
									sessionUser	: req.session.user,
									userList	: ul,
									event		: ev
								});
							} else {
								ev.start = moment(ev.start).format('dddd, DD MMMM YYYY HH:mm');
								res.render('event', {
									title		: 'Event',
									sessionUser	: req.session.user,
									userList	: ul,
									event		: ev
								});
							}
						}
					});
				}
			});	
		}
	});
	app.post('/event', function(req, res) {
		if ((req.session.user == null) || (req.session.user.room == null)){
			res.send('Permission denied', 403);
		} else validEventForm(req, function(error){
			if(error) {
				res.send(error, 400);
			} else {
				data = {};
				if(req.param('eventId') === undefined) { //Create
					var event = {
							owner : req.session.user._id,
							start : moment(req.param('date')+ ' ' +req.param('hour'), "DD/MM/YYYY H:mm"),
							duration : req.param('duration'),
							patient : req.param('patient'),
							//collaborators : req.param('collaborators'),
							//relatives : req.param('relatives'),
							participants : req.param('participants'),
							meta : {
								medic : req.session.user.name,
							}							
					};
					if(req.param('comments') !== '')
						event.comments = req.param('comments');
					EM.createEvent(event, function(e, ev){
						if(e){
							console.log('[Error] router-events POST/event creating: ',e);
							res.send('Error getting event data', 400);
						} else {
							res.send(ev, 201);
						}
					});				
				//Update
				} else EM.findEventById(req.param('eventId'), function(err, ev){
					if(err || !ev){
						res.send('Error getting event data', 400);
						console.log('[Error] router-events POST/event finding: ',err);
					} else if(ev.owner != req.session.user._id){
						console.log('[Error] router-events POST/event: user ('+req.session.user.user+') does not own event ('+ev._id+')');
						res.send('Permission denied', 403);
					} else {
						ev.patient = req.param('patient');
						/*ev.relatives = req.param('relatives');
						ev.collaborators = req.param('collaborators');*/
						ev.participants = req.param('participants');
						ev.comments = req.param('comments');
						ev.start = moment(req.param('date')+ ' ' +req.param('hour'), "DD/MM/YYYY H:mm"),
						ev.duration = req.param('duration');
						ev.meta = {
								medic : req.session.user.name,
						};
						EM.updateEvent(ev, function(er, upevent){
							if(er) {
								console.log('[Error] router-events POST/event updating: '+er);
								res.send('Error updating: '+er,400);
							} else {
								res.send(upevent,200);
							}
						});
					}
				});
			}
		});
	});
	app.get('/event/:eventId/join', function(req, res) {
		if ((req.session.user == null)){
			req.session.redirect = req.protocol + '://' + req.get('host') + req.originalUrl;
			res.redirect('/');
		} else {
			res.render('room', {
				title		: 'Event room',
				sessionUser	: req.session.user
				//userList	: ul,
				//event		: ev
			});
		}
	});
	app.post('/event/:eventId/cancel', function(req, res) {
		if ((req.session.user == null)){
			res.send('Permission denied', 403);
		} else {
			EM.findEventById(req.params.eventId, function(e, ev){
				if(e || !ev) {
					console.log('[Error] /event/'+req.params.eventId+'/cancel findEventById() says:', e);
					res.send('Not found', 404);
				} else {
					EM.setEventStatus(req.params.eventId, 'Cancelled', function(err){
						if(err) {
							console.log("[Error] /event/"+req.params.eventId+"/cancel setEventStatus() says:", err);
							res.send("Internal error", 500);
						} else 
							res.send("Event cancelled", 200);
					});
				}
			});
		}
	});
	
	
	app.get('/event/:eventId/status', function(req, res) {
		if ((req.session.user == null)){
			res.send("Permission denied", 403);
		} else eventStatus(req.param('eventId'), req.session.user, function(text, status, event, room){
			if(status == 201){
				EM.getToken(req.session.user, room, function(er,token){
					if(er || !token){
						res.send('Internal error', 500);
						console.log('[Error] router-events get/event/'+req.params.eventId+'/status retrieving event token: ',err);
					} else {
						res.send(token, 201);
					}
				});
			} else if((status == 202) && (event) && (event.owner == req.session.user._id)) {
				EM.getTokenForMedic(req.session.user, event, function(er,token){
					if(er || !token){
						res.send('Internal error', 500);
						console.log('[Error] router-events get/event/'+req.params.eventId+'/status retrieving event token: ',err);
					} else {
						EM.setEventStatus(event._id,'MedicIn', function(err){
							if(err) {
								console.log("[Error] router-events GET /events/"+req.param.eventId+"/status setting status to 'MedicIn':", err);
								res.send("Internal error", 500);
							} else
								res.send(token, 201);
						});
						
					}
				});
			} else {
				res.send(text,status);
			}			
		});
	});
};

function eventStatus(eventId, user, callback){
	EM.findEventById(eventId, function(err, ev) {
		if(err || ! ev) {
			callback('The event does not exists', 404, ev);
			console.log('[Error] eventStatus(): eventStatus('+eventId+') getStatusByIds() says: ',err);
		} else {
			var end = moment(ev.start).add('m',ev.duration);
			if( ( (ev.patient != user._id) && (ev.owner != user._id) && 
				(ev.participants.indexOf(user._id) == -1) ) ) { 
					callback('The event does not exists or is cancelled', 404);
					console.log("[Error] eventStatus(): user("+user.user+") is not invited to event: "+eventId);
					
			} else if( (ev.status === 'Cancelled')) {
				if(ev.owner == user._id)
					callback('The event is cancelled', 403);
				else
					callback('The event does not exists or is cancelled', 404);
					
			} else if(moment().isAfter(end)) {
				EM.setEventStatus(eventId, 'Closed', function(err){
					if(err)
						console.log("[Error] router-events eventStatus() unable to change status to 'Closed' for event "+eventId, err);
					else
						console.log("[!!] router-events eventStatus() closing event "+eventId+" past end time");
				});				
				callback('The event is closed', 410, ev);
				
			} else if(ev.status === 'Closed') {
				callback('The event is closed', 410, ev);
				
			} else if(moment().isBefore(ev.start)) {
				callback('The event will open in '+ev.start.from(moment(),true), 200, ev);
				
			} else if(ev.status !== 'MedicIn') {
				callback('Waiting for medic to enter', 202, ev);
				
			} else
				AM.findById(ev.owner, function(e, medic){
					if(e || !medic){
						callback('Internal error', 500);
						console.log('[Error] router-events eventStatus('+eventId+') retrieving event owner: ',err);
					} else {
						callback('Open', 201, ev, medic.room);
					}			
				});
				
				/*EM.getStatusByIds(eventId, user._id, function(err, ev){
					if(err || !ev){
						callback('The invitation does not exists', 404, ev);
						console.log('[Error] eventStatus('+eventId+') getStatusByIds() says: ',err);
						
					
				});
			}*/
		}
	});
}

/*Validation*/
function validEventForm(req, callback){
	var patient = req.param('patient');
	var date = moment(req.param('date'), "DD/MM/YYYY");
	var hour = moment(req.param('hour'), "H:mm");
	//TODO: check patient and medic ids
	if(!patient || patient.length === 0)
		callback('Patient is mandatory');
	else if(!date.isValid())
		callback('Incorrect date format');
	else if(!hour.isValid())
		callback('Incorrect hour format');
	else if(date.add(hour).isBefore(moment()))
		callback('The event start is in the past');
	else if(!req.param('duration') || req.param('duration').length === 0)
		callback('Duration is mandatory');
	else callback(null);
}

