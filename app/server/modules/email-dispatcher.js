//var emailTemplates 	= require('email-templates');
var ES = require('./email-settings');
var AM = require('./account-manager');
var app = require('../../../app.js');
//var render;

/*email-templates code
 * emailTemplates('./app/server/email', function(err, templateFunction) {

  if (err) {
    console.log(err);
  } else {
	  render = templateFunction;
  }
});*/

function render(template, variables, callback){
	app.render('email/'+template, variables, callback);
}

function doSend(template, variables, subject, email){
	if(typeof render != 'function')
		console.log("[Error] email-dispatcher templates were not loaded, the email will not be sent");
	else render(template, variables, function(err, html) {
		if(err)
			console.log("[Error email-dispatcher render says: ", err);
		else {
			/*EM.server.send({
				from         : sender,
				to           : email,
				subject      : subject,
				text         : text,
				html		 : html
			}, callback );*/
			console.log("[EMAIL]", html);
		}			
	});	
}


var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({

	host		: ES.host,
	user		: ES.user,
	password	: ES.password,
	ssl			: true
});

/*EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : ES.sender,
		to           : account.email,
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.forgotPasswordEmail = function(o)
{
	//TODO: fix link
	var link = 'http://node-login.braitsch.io/reset-password?e='+o.email+'&p='+o.pass;
	var html = "<html><body>";
		html += "Hi "+o.name+",<br><br>";
		html += "Your username is : <b>"+o.user+"</b><br><br>";
		html += "<a href='"+link+"'>Please click here to reset your password</a><br><br>";
		html += "Cheers,<br>";
		html += "<a href='http://twitter.com/braitsch'>braitsch</a><br><br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

EM.eventInviteEmail = function(eventLink, user, medic) {
	var html = '<html><body>Hello '+user.name+', <br><br>';
		html +='You have a new appointment with medic '+medic.name+'.<br>';
		html +='Please, confirm your assistance with the following link:<br>';
		html +="<a href='"+eventLink+"'></body></html>";
	//doSend(html, 'New Medical Appointment', user.email, EM.sender, function(){});
	console.log(html);
};*/
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
		var url = ES.baseUrl + '/event/' + event._id + '/';
		doSend('invitation', {user:user, event:event, url:url}, 'New Medical appointment', user.email);
	}		
};

EM.sendCancellation = function(user, event) {
	if(typeof user != 'object')
		getUser(user, event, EM.sendCancellation);
	else {
		doSend('cancellation', {user:user, event:event}, 'Medical appointment was cancelled', user.email);
	}		
}
