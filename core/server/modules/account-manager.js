/*
 * Under MIT License
 * @Copyright: 2014 Siro González Rodríguez
 */

var db			= require('./database').instance;
var crypto		= require('crypto');
var moment		= require('moment');

var users;

require('./database').ready(function(){
	require('./database').collection('users', function(r){users=r;});
});


/* if no admin user, create default */
setTimeout(function(){
	users.count({role:'Admin'}, function(err, num){
		if(err !== null){
			console.log("[Error] account-manager, checking if admin exists;", err);
		} else {
			if(num>0)
				console.log('[OK]	Admin user found!');
			else {
				console.log('[!!]	No admin user... creating');
				var newUser = {
						user : 'admin',
						pass : 'admin',
						role : 'Admin',
						name : 'Admin'
				};
				createUser(newUser);
			}
		}
	});
}, 2000);

var users = db.collection('users');

/* Manage users */
var createUser = function(userData, callback) {
  users.save(userData, callback);
}

exports.isAdmin = function(user){
	if(!user)
		return false;
	else
		return user.role === 'Admin';
};



exports.manualLogin = function(user, pass, callback)
{
	users.findOne({user:user}, function(e, o) {
		if(e)
			callback('Error finding user:', e);
		else if ((o === undefined) || (o === null))
			callback('Invalid user/password'); //User not found
		else {
			validatePassword(pass, o.pass, function(err, res) {
				if (res){
					callback(null, o);
				}	else{
					callback('Invalid user/password'); //Invalid password
				}
			});
		}
	});
};


/* Rooms management methods (Will be moved)*
exports.addRoom = function(medicId, callback) {
	medicId = ObjectId(medicId);
	assignRoom = function(user) {
		N.API.createRoom(
			user._id, 
			function(licodeRoom) {
				users.update({_id:user._id},{room:licodeRoom._id}, function(e, count){
					if(e){
						console.log('[Error] account-manager.addRoom().assignRoom(): updating user.room, mongo says:', e);
						callback('Updating user: '+e);
					} else
						callback(null);
				});
			},
			function(e){
				console.log('[Error] account-manager.addRoom().assignRoom(): Nuve says: ', e);
				callback('Error creating room');
			},
			{p2p:configP2P});
	};
	
	users.findOne({_id:medicId}, function(e, medic){
		if (e) {
			callback('User not found');
			console.log('[Warning] account.manager.addRoom(): record not found, mongo says: ', e);
		} else if(medic.role != 'Medic') {
			callback('User is not medic: only medics can have a room');
		} else if(medic.room !== undefined) {
			N.API.getRoom(medic.room, function() {
				callback('Medic already have a room');
			}, function() {
				assignRoom(medic);
			});			
		} else {
			assignRoom(medic);
		}
	});
};
exports.removeRoom = function(medicId, callback) {
	medicId = ObjectId(medicId);
	users.findOne({_id:medicId}, function(e, medic){
		if (e) {
			callback('User not found');
			console.log('[Warning] account.manager.removeRoom(): record not found, db says: ', e);
		} else if(medic.room == null) {
			callback('The medic has no room to delete');
		} else {
			N.API.deleteRoom(medic.room,
				function() {
					users.update({_id:medic._id},{room:null}, function(e, count){
						if(e){
							console.log('[Error] account-manager.removeRoom(): unsetting user.room, db says:', e);
							callback('Updating user: '+e);
						} else
							callback(null);
					});
				},
				function(e) {						
						console.log('[Error] account-manager.removeRoom(): unsetting user.room, nuve says:', e);
						callback('Error removing room' + e);
				});
		}
	});
};*/

/* user lookup methods */

exports.deleteUser = function(id, callback)
{
	users.remove({_id: getObjectId(id)}, callback);
};

exports.getUserByEmail = function(email, callback)
{
	users.findOne({email:email}, function(e, o){ callback(o); });
}

exports.listUsers = function(callback, size, skip)
{
	var options = {};
	if(size != null)
		options['size'] = size;
	if(skip != null)
		options['skip'] = skip;
	db.queryToList("SELECT _id, user, nss, name, email, role, room, creation FROM Users",{}, options, 
	function(err,list){
		if(err)
			callback(err,list);
		else { 
			list.forEach(function(user){
				user.creation = moment(user.creation, 'YYYY-MM-DD HH:mm:ss');
			});
			callback(null, list);
		}
			
	});
};

exports.listUsersSmall = function(callback)
{
	db.queryToList("SELECT _id, user, nss, name, role FROM Users",{}, {},callback);
};

exports.listUsersByIds = function(array, callback){
	var ids = "("+array.join(",")+")";
	db.queryToList("SELECT _id, user, nss, name, role FROM Users WHERE _id IN "+ids, {}, {}, callback);
};

exports.findById = function(id, callback)
{
	users.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e);
		else callback(null, res);
	});
};

exports.checkChangePasswordToken = function(token, user, callback) {
	users.findOne({user:user, passToken:token}, function(e, user){
		if(e || !user)
			callback('Not found');
		else
			callback(null,user);
	});
};

exports.defaultUser = function() {
	return {
		'user' : '',
		'name' : '',
		'email': '',
		'role' : 'Patient',
	};
};

function getChangePasswordToken(email, callback) {
	users.findOne({email:email}, function(e, user){
		if(e || !user) {
			callback('Email not found');
		} else {
			var token='AB5927C1145E'; //fallback token
			require('crypto').randomBytes(6, function(ex, buff){
				if(!ex)
					token = buff.toString('hex');
				
				users.update({email:email},{tokenDate:moment(), passToken:token}, function(e, count){
					if(e){
						console.log('[Error] account-manager.getChangePasswordToken(): setting token', e);
						callback('Error setting token in DB');
					} else
						callback(null,token,user);
				});
			});
			
		};
	});	
};
exports.getChangePasswordToken = getChangePasswordToken;
