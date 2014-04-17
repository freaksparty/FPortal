/**
 * Plataforma Informática de Asistencia Médica A Distancia
 * 
 * Copyright (c) 2014 Siro González
 **/
var RM = require('./modules/room-manager');
var EM = require('./modules/email-dispatcher');
var N = require('./../../nuve');

module.exports = function (app){

	/*app.post('/roomlist', function(req, res){
		if(req.session.user === null)
			res.redirect('/');
		else {

		}
	});*/
	app.get('/roomList', function(req, res) {

		if(req.session.user === null)
			res.redirect('/');
		else {
			RM.getRooms(function(err, rooms) {
				res.render('roomList', {
					rooms : rooms,
					sessionUser : req.session.user
				});
			});
		}
	});

	app.get('/newRoom', function(req, res) {

		if(req.session.user === null)
			res.redirect('/');
		else {
			res.render('newRoom');
		}
	});

	app.post('/newRoom', function(req, res){
		if(req.session.user === null)
			res.redirect('/');
		else{
			RM.addRoom({
				name	: req.param('name'),
				owner	: req.session.user.user
			});
			res.redirect('/roomList');
		}
	});
	
	app.get('/room', function(req, res) {
		if(req.session.user === null)
			res.redirect('/');
		else {
			RM.getRoomToken(req.query.roomId, req.session.user.name, 
					function(token)
					{
						res.render('room',
							{
								token	: token
							});
					});
	
		}
	});
};


