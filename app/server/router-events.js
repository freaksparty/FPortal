/**
 * Plataforma Informática de Asistencia Médica A Distancia
 * 
 * Copyright (c) 2014 Siro González
 **/
var EM = require('./modules/event-manager');
var email = require('./modules/email-dispatcher');
var N = require('./../../nuve');

module.exports = function (app){

	app.get('/events', function(req,res) {
		function listByParticipant(ownList) {
			EM.listEventsByParticipant(req.session.user, function(e, list){
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
};


