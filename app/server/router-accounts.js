/*
 * File derived from Node.js login (http://bit.ly/LsODY8)
 * Under MIT License
 * @Copyright: 2013 Stephen Braitsch
 * @Copyright: 2014 Siro González Rodríguez
 */
/*jshint eqnull:true */
var AM = require('./modules/account-manager');
var email = require('./modules/email-dispatcher');
var N = require('./../../nuve');

module.exports = function(app) {

// main login page //

	app.get('/', function(req, res){
		// check if the user's credentials are saved in a cookie //
		if (req.cookies.user === undefined || req.cookies.pass === undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
			// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o !== null){
					req.session.user = o;
					if(req.session.redirect){
						var url = req.session.redirect;
						delete req.session.redirect;
						res.redirect(url);
					} else if(AM.isAdmin(o))
						res.redirect('/admin');
					else
						res.redirect('/events');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
			if (!o){
				res.send(e, 400);
			}	else{
				req.session.user = o;
				if (req.param('remember-me') == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.send(o, 200);
			}
		});
	});
	
	app.get('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){
			//res.send('ok', 200);
			res.redirect('/');
		});
	});
	
	app.get('/admin', function(req, res){
		if ((req.session.user == null) || (req.session.user.role != 'Admin')){
			res.redirect('/');
		} else {
			AM.listUsers(function(e, l){
				if(e)
					console.log('[Error] router-accounts /admin:', e);
				res.render('admin',{
					sessionUser : req.session.user,
					title : 'Admin Panel',
					userList : l
				});
			});
		}
	});
	
	app.post('/admin', function(req,res) {
		if ((req.session.user == null) || (req.session.user.role != 'Admin')){
			res.send('Permission denied', 403);
		} else {
			if(req.param('add-room-to')){
				AM.addRoom(req.param('add-room-to'),
					function() {
						res.send('ok', 200);						
					}, function(e) {
						res.send(e, 400);
					});
			} else if(req.param('remove-room-to')) {
				AM.removeRoom(req.param('remove-room-to'),
					function() {
						res.send('ok', 200);						
					}, function(e) {
						res.send(e, 400);
					});
			} else {
				res.send('Incorrect client query', 400);
			}
		}
	});

	app.get('/user', function(req, res) {
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else if(AM.isAdmin(req.session.user)){
			if ((req.query.userId != undefined)){
				AM.findById(req.query.userId, function(e, o){
					//TODO user not found if e
					res.render('user',{
						title : 'Edit User '+ o.user,
						roles : AM.roleList,
						sessionUser : req.session.user,
						udata : o
					});
				});
			} else { //New user
				res.render('user',{
					title: 'New User',
					roles : AM.roleList,
					sessionUser : req.session.user,
					udata : AM.defaultUser()
				});
			}
		} else {
			res.render('user', {
				title : 'Your Profile',
				roles : AM.roleList,
				sessionUser : req.session.user,
				udata : req.session.user
			});
		}
	});
	
	app.post('/user', function(req, res){
		if (!req.session.user){
			// if user is not logged-in redirect back to login page //
			res.send('Permission denied', 403);
			return;
		}
		
		var data = {
			name		: req.param('name'),
			email		: req.param('email'),
			pass		: req.param('pass')
		};
		if(AM.isAdmin(req.session.user)){
			data.user	= req.param('user');
			data.role	= req.param('role');
		}
		
		if(req.query.userId !== undefined) {
			data._id	= parseInt(req.query.userId);
			if (AM.isAdmin(req.session.user) ||
				(req.session.user._id == data._id)) {
				AM.updateUser(data, function(e, o){
					if (e){
						res.send(e, 400);
					} else {
						if(req.session.user._id == data._id){
							req.session.user = o;
							// update the user's login cookies if they exists //
							if (req.cookies.user != undefined && req.cookies.pass != undefined){
								res.cookie('user', o.user, { maxAge: 900000 });
								res.cookie('pass', o.pass, { maxAge: 900000 });	
							}
						}
						res.send('ok', 200);
					}
				});
			} else {
				res.send('Permission denied', 403);
			}
		} else {
			if(AM.isAdmin(req.session.user)){
				AM.addNewUser(data, function(e){
					if (e){
						if(typeof e === 'string')
							res.send(e, 400);
						else
							res.send(e.toString(), 400);
					} else {
						res.send('created', 201);
					}
				});
			} else {
				res.send('Permission denied', 403);
			}
		}
	});
	
	app.delete('/user', function(req,res) {
		if(req.session.user.role == 'Admin'){
			AM.deleteUser(req.query.userId, function(e, obj){
				if (!e){
					res.send('ok', 200);
				} else {
					res.send('record not found', 400);
				}
			});
		} else {
			res.send('permission denied', 400);
		}
	});
	

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getUserByEmail(req.param('email'), function(o){
			if (o){
				res.send('ok', 200);
				email.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
					//	res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});
	

};