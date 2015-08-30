/*
 * Under MIT License
 * @Copyright: 2015 Siro González Rodríguez
 */
/*jshint eqnull:true */

module.exports = function(app) {
	var AM = require('./modules/account-manager');
        AM.setLocals(app.locals);

	app.route('/')
	.get(function(req, res) {
		if(req.session.user == null){
			res.render('core/login', {pageTitle: 'Login' });
		} else {
			if(req.session.redirect){
				var url = req.session.redirect;
				delete req.session.redirect;
				res.redirect(url);
			} else if(app.locals.core.isAdmin(req.session.user))
				res.redirect('/admin');
			else
				res.redirect('/events');
		}
	})
	.post(function(req, res) {
		AM.manualLogin(req.body.user, req.body.pass, function(e, o){
			if (!o){
				res.status(400).send(e);
			} else{
				req.session.user = o;
				res.status(200).send('Logged in');
			}
		});
	});

	function logout(req, res, callback){
		req.session.destroy(callback);
	}

	app.route('/logout')
	.get(function(req, res) {
		logout(req,res, function(e) {
			res.redirect('/');
		});
	})
	.post(function(req, res) {
		logout(req, res, function(e) {
			res.send('Logout', 200);
		});
	});
	
	app.route('/admin')
	.get(function(req, res){
		if ((req.session.user == null) || !app.locals.core.isAdmin(req.session.user)){
			res.redirect('/');
		} else {
			AM.listUsers(function(e, l){
				if(e)
					console.log('[Error] router-accounts /admin:', e);
				res.render('core/admin',{
					sessionUser : req.session.user,
					pageTitle : 'Admin Panel',
					userList : l
				});
			});
		}
	});
        
        app.route('/user(/:userId)?')
        .get(function(req, res) {
            if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
			req.session.redirect = req.protocol + '://' + req.get('host') + req.originalUrl;
			res.redirect('/');
		} else if(app.locals.core.isAdmin(req.session.user)){
			if ((req.params.userId != undefined)){
				AM.findById(req.params.userId, function(e, o){
                                    if(e || !o) {
                                        res.status(404).render('core/404', {
                                            pageTitle: 'User not found',
                                            backButton: {url:'/admin', text:'Back to admin page'}
                                        });
                                    } else {
					res.render('core/user',{
						pageTitle : 'Edit User '+ o.user,
						roles : AM.roleList,
						sessionUser : req.session.user,
						udata : o
					});
                                    }
				});
			} else { //New user
				res.render('core/user',{
					title: 'New User',
					roles : AM.roleList,
					sessionUser : req.session.user,
					udata : AM.defaultUser()
				});
			}
		} else {
			res.render('core/user', {
				title : 'Your Profile',
				roles : AM.roleList,
				sessionUser : req.session.user,
				udata : req.session.user
			});
		}
        })
        .post(function(req, res) {
            if (!req.session.user){
			// if user is not logged-in redirect back to login page //
			res.send('Permission denied', 403);
			return;
		}
		
		var data = {
			name		: req.body.name,
			email		: req.body.email,
			pass		: req.body.pass
		};
		if(app.locals.core.isAdmin(req.session.user)){
			data.user	= req.body.user;
			data.role	= req.body.role;
		}
		
		//Edit exissting user
		if(req.params.userId !== undefined) {
			data._id	= req.params.userId;
			if (app.locals.core.isAdmin(req.session.user) ||
                           (req.session.user._id == data._id)) {
				AM.updateUser(data, function(e, o){
					if (e){
						res.status(400).send(e);
					} else {
						if(req.session.user._id == data._id){
							req.session.user = o;
						}
						res.status(200).send('ok');
					}
				});
			} else {
				res.status(403).send('Permission denied');
			}
		//User creation
		} else {
			if(app.locals.core.isAdmin(req.session.user)){
				AM.createUser(data, function(e, user){
					if (e){
						res.status(400);
						if(typeof e === 'string')
							res.send(e);
						else
							res.send(e.toString());
					} else {
						res.status(201).send('created');
						if(data.pass === '')
							AM.getChangePasswordToken(user.email, function(e, token, user) {
								if(!e)
									email.sendPasswordSet(user, true, token);
							});
					}
				});
			} else {
				res.status(403).send('Permission denied');
			}
		}
        })
        .delete(function(req, res) {
            if(app.locals.core.isAdmin(req.session.user)){
			AM.deleteUser(req.params.userId, function(e){
				if (!e){
					res.status(200).send('ok');
				} else {
					res.status(404).send('record not found');
				}
			});
		} else {
			res.status(400).send('permission denied');
		}
        });

};