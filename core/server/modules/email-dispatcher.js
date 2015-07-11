var ES		= require('../../../config').smtp;
var AM		= require('./account-manager');
var app		= require('../../../app.js');
var appBaseUrl	= require('../../../config').baseUrl;
/*var server = require("emailjs/email").server.connect({

	host	 : ES.host,
	user	 : ES.user,
	password : ES.password,
	ssl	 : true

});*/

function render(template, variables, callback){
	app.render('email/'+template, variables, callback);
}

function doSend(template, variables, subject, email){
	var callback = function(e,o){
		if(e)
			console.log("[Error] email-dispatcher doSend() emailjs says: "+e);
		else
			console.log("Email sent");
	};
	if(typeof render != 'function')
		console.log("[Error] email-dispatcher templates were not loaded, the email will not be sent");
	else render(template, variables, function(err, html) {
		if(err)
			console.log("[Error email-dispatcher render says: ", err);
		else {
		  if(ES.enabled){
			server.send({
				from         : ES.senderName,
				to           : email,
				subject      : subject,
				//text         : text,
				text		 : 'Error',
				attachment	 :
					{data:html, alternative:true}
			}, callback );
		  } else
			console.log("[EMAIL]", html);
		}			
	});	
}


var EM = {};
module.exports = EM;

if(ES.enabled) {
  EM.server = require("emailjs/email").server.connect({
	host		: ES.host,
	user		: ES.user,
	password	: ES.password,
	ssl		: true
  });
}

function getUser(uid, event, callback) {
	AM.findById(uid, function(err, u){
		if(err){
			console.log("[Error] email-dispatcher getUser(), user not found");
		} else
			callback(u, event);
	});
}

EM.sendInvitation = function(user, event) {
	if(typeof user != 'object')
		getUser(user, event, EM.sendInvitation);
	else {
		var url = appBaseUrl + '/event/' + event._id + '/';
		doSend('invitation', {user:user, event:event, url:url}, 'New Medical appointment', user.email);
	}		
};

EM.sendCancellation = function(user, event) {
	if(typeof user != 'object')
		getUser(user, event, EM.sendCancellation);
	else {
		doSend('cancellation', {user:user, event:event}, 'Medical appointment was cancelled', user.email);
	}		
};

EM.sendPasswordSet = function(user, newUser, token) {
	var url = appBaseUrl + '/passwordset/'+ user.user + '/' + token + '/';
	var subject;
	if(newUser)
		subject = 'Your account is ready';
	else
		subject = 'Reset your account password';
	doSend('setpassword', {user:user, newUser:newUser, url:url}, subject, user.email);
};
