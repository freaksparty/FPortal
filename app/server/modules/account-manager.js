/*
 * Derived work from Node.js login (http://bit.ly/LsODY8)
 * Under MIT License
 * @Copyright: 2013 Stephen Braitsch
 * @Copyright: 2014 Siro González Rodríguez
 */
//var mongo		= require('./database');
var DbClass 	= require('./sql');
var db 			= new DbClass();
var crypto		= require('crypto');
var moment		= require('moment');
var N			= require('./../../../nuve');
var email = require('./email-dispatcher');
//var ObjectId = require('mongodb').ObjectID;
var ObjectId = parseInt;

//var users	= db.collection('users');
var users = new db.Entity("Users", function(user){
	user.user = user.user?user.user:null;
	user.email = user.email?user.email:null;
	}, 	["_id", "user", "name", "role", "email", "pass", "room", "nss"]);

var roles = ['Medic', 'Patient', 'Admin', 'Familiar'];

exports.roleList = roles;

exports.isAdmin = function(user){
	if(!user)
		return false;
	else
		return user.role === 'Admin';
};

exports.isMedic = function(user) {
	if(!user)
		return false;
	else
		return user.role === 'Medic';
};

exports.logUser = function(user) {
	return user.user+"(id="+user._id+")";
};

/* if no admin user, create default */
setTimeout(function(){
	users.howMany({role:'Admin'}, function(err, num){
		if(err || !num){
			console.log("[Error] account-manager, checking if admin exists;", err);
		} else {
			if(num>0)
				console.log('[OK]	Admin user found!');
			else {
				console.log('[!!]	No admin user... creating');
				var newData = {
						user : 'admin',
						pass : 'admin',
						role : 'Admin',
						name : 'Admin'
				};
				saltAndHash(newData.pass, function(hash){
					newData.user = 'admin';
					newData.pass = hash;
					users.insert(newData);
				});
			}
		}
	});
}, 1000);

/* login validation methods */

exports.autoLogin = function(user, pass, callback)
{
	users.findOne({user:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
};

exports.manualLogin = function(user, pass, callback)
{
	users.findOne({user:user}, function(e, o) {
		if(e)
			callback('Error finding user:', e);
		else if (o === undefined)
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

/* record insertion, update & deletion methods */

exports.addNewUser = function(newData, callback)
{
	users.findOne({user:newData.user}, function(e, o) {
		if (o){
			callback('Username already exists');
		}	else{
			users.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('Email is already in use');
				}	else{
					newData.creation = new Date();
					if(newData.pass === ''){
						users.insert(newData, {safe: true}, callback);
					} else
						saltAndHash(newData.pass, function(hash){
							newData.pass = hash;
							users.insert(newData, {safe: true}, callback);
						});
				}
			});
		}
	});
};

exports.updateUser = function(newData, callback)
{
	newData._id = ObjectId(newData._id);  //convert string into ObjectId
	users.findOne({user:newData.user}, function(e1, o1) {
		if(o1 && (o1._id != newData._id) ){
			callback('Username already in use');
		} else {
			users.findOne({email:newData.email}, function(e2, o2){
				if(o2 && (o2._id != newData._id) ){
					callback('Email already in use');
				} else {
					users.findOne({_id:ObjectId(newData._id)}, function(e, o){
						if(e !== null){
							callback(e, null);
							return;
						}
						if(newData.user !== undefined)
							o.user	= newData.user;
						o.name		= newData.name;
						o.email		= newData.email;
						o.role		= newData.role;
						o.nss		= newData.nss;
						if (newData.pass === ''){
							users.save(o, {safe: true}, function(err) {
								if (err) callback(err);
								else callback(null, o);
							});
						} else {
							saltAndHash(newData.pass, function(hash){
								o.pass = hash;
								users.save(o, {safe: true}, function(err) {
									if (err) callback(err);
									else callback(null, o);
								});
							});
						}
					});
				}
			});			
		}			
	});	
};

exports.updatePassword = function(email, newPass, callback)
{
	users.findOne({email:email}, function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
		        o.pass = hash;
		        users.save(o, {safe: true}, callback);
			});
		}
	});
}

/* Rooms management methods */
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
			});
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
			console.log('[Warning] account.manager.removeRoom(): record not found, mongo says: ', e);
		} else if(medic.room == null) {
			callback('The medic has no room to delete');
		} else {
			N.API.deleteRoom(medic.room,
				function() {
					users.update({_id:medic._id},{room:null}, function(e, count){
						if(e){
							console.log('[Error] account-manager.removeRoom(): unsetting user.room, mongo says:', e);
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
};

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

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
};

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

/* auxiliary methods */

var getObjectId = function(id)
{
	return id;
//	return users.db.bson_serializer.ObjectID.createFromHexString(id);
}


/*var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	users.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
};*/
