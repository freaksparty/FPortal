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
				res.render('events', {
					title			: 'Your events',
					sessionUser		: req.session.user,
					ownEventList	: ownList,
					guestEventList	: list
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
					res.render('event', {
						title		: 'Create event',
						sessionUser	: req.session.user,
						userList	: ul
					});
				}
			});			
		}
	});
	app.get('/event/:eventId', function(req, res) {
		if ((req.session.user == null)){
			res.redirect('/');
		} else {
			
		}
	});
	app.post('/event', function(req, res) {
		if ((req.session.user == null) || (req.session.user.room == null)){
			res.send('Permission denied', 403);
		} else {
			data = {};
			if(req.param['eventId'] !== '') { //Create
				var event = {
						room : req.session.user.room,
						start : moment(req.param('date')+ ' ' +req.param('hour'), "DD/MM/YYYY H:mm").toDate(),
						duration : req.param('duration'),
						participants : req.param('participants')
				};
				if(req.param.comments !== '')
					event.comments = req.param.comments;
				EM.createEvent(event, function(e, ev){
					if(e){
						res.send('Error getting event data', 400);
						console.log('[Error] router-events POST/event creating: ',e);
					} else {
						res.send(ev, 201);
					}
				});				
			//Update
			} else EM.findEventById(req.param['eventId'], function(err, ev){
				if(e){
					res.send('Error getting event data', 400);
					console.log('[Error] router-events POST/event finding: ',e);
				} else if(ev.owner != req.session.user._id){
					res.send('Permission denied', 403);
					console.log('[Error] router-events POST/event: user ('+req.session.user.user+') does not own event ('+ev._id+')');
				} else {
					ev.participants = req.param.participants;
					ev.comments = req.param['comments'];
					ev.start = moment(req.param('date')+ ' ' +req.param('hour'), "DD/MM/YYYY H:mm");
					ev.duration = req.param.duration;
					EM.update(ev, function(er, upevent){
						if(e) {
							console.log('[Error] router-events POST/event updating: '+e);
							res.send('Error updating: '+e,400);
						} else {
							res.send(upevent,200);
						}
					});
				}
			});
		}
	});
};


