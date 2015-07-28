/*
 * Under MIT License
 * @Copyright: 2015 Siro González Rodríguez
 */
/*jshint eqnull:true */

var AM = require('./modules/account-manager');

module.exports = function(app) {

	app.route('/')
	.get(function(req, res) {
		if(req.session.user == null){
			res.render('core/login', {title: 'Hello - Please Login To Your Account' });
		} else {
			if(req.session.redirect){
				var url = req.session.redirect;
				delete req.session.redirect;
				res.redirect(url);
			} else if(AM.isAdmin(req.session.user))
				res.redirect('/admin');
			else
				res.redirect('/events');
		}
	})
	.post(function(req, res) {
		AM.manualLogin(req.params['user'], req.params['pass'], function(e, o){
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

};