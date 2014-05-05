var inspect = require('util').inspect;
var Client = require('mariasql');
var sprintf = require('sprintf').sprintf;

var c = new Client();
c.connect({
  host: '127.0.0.1',
  user: 'PIAMAD',
  password: 'piamadpass',
  db: 'PIAMAD'
});

exports.sql = c;

c.on('connect', function() {
	   console.log('[OK] SQL datasource connected');
	 })
	 .on('error', function(err) {
	   console.log('[ERROR] Connecting to SQL: ' + err);
	 })
	 .on('close', function(hadError) {
	   console.log('[!!] SQL client closed');
	 });

/* Aux functions */
function filtersToWhere(filters, joiner){
	var where = [];
	for (key in filters){
		val = filters[key];
		key = c.escape(key);
		if(typeof val == "string")
			where.push(key+"='"+c.escape(val)+"'");
		else if(typeof val == "number")
			where.push(key+"="+val);
		else if(val == null)
			where.push(key+" IS NULL");
	}
	return where.join(" AND ");
}
function filtersToSet(filters) {
	var set = [];
	for (key in filters){
		val = filters[key];
		key = c.escape(key);
		if(typeof val == "string")
			set.push(key+"='"+c.escape(val)+"'");
		else if(typeof val == "number")
			set.push(key+"="+val);
		else if(val == null)
			set.push(key+"= NULL");
	}
	return set.join(", ");
}

/* Basic CRUD */
function queryToObject(query, values, callback){
	var found = false;
	c.query(query, values)
	.on('result', function(res) {
		res.on('row', function(row) {
			found = true;
			callback(null, row);
		})
		.on('error', function(err) {
			console.log('[Error] Database queryToObject() Error in row: ' + inspect(err));
		    callback(err);
		});
	}).on('end', function(err) {
		if(!found)
			callback(null, null);
	});
}
function queryToList(query,values, options, callback) {
	if(options.size){
		options.skip = options.skip?options.skip:0;
		query += sprintf(" LIMIT %i, %i", options.skip, options.skip+options.size);
	}
	var result = [];
	var error = null;
	c.query(query, values)
	.on('result', function(res) {
		res.on('row', function(row) {
			result.push(row);
		})
		.on('error', function(err) {
			console.log('[Error] Database queryToList() Error in row: ' + inspect(err));
		    error = err;
		});
	}).on('end', function(info){
		if(error)
			callback(err, result);
		else
			callback(null, result);
	});
}

exports.queryToList = queryToList;
//**Common for insert and update **//
function saveQuery(query, values, callback){
	c.query(query, values)
	.on('result', function(res){
		res.on('end', function(info){
			callback(null, info);
		}).on('error', function(err){
			console.log("[Error] saving", inspect(err));
			callback(err);
		});
	}).on('error', function(err){
		callback(err);
	});
}
function insertQuery(query, values, callback){
	saveQuery(query, values, function(err, info){
		if(err)
			callback(err);
		else if(info.affectedRows == 1)
			callback(null, info.insertId);
		else
			callback("inserting: unexpected affected rows number="+info.affectedRows);			
	});
};
function updateQuery(query, values, callback){
	saveQuery(query, values, function(err, info){
		if(err)
			callback(err);
		else 
			callback(null, info.affectedRows);
	});
};

/* mongo-like API */
exports.howMany = function(table, filters, callback){
	var query = sprintf("SELECT COUNT(*) FROM %s WHERE %s", table, filtersToWhere(filters));
	c.query(query, null, true)
	.on('result', function(res) {
		res.on('row', function(row) {
			callback(null, row[0]);
		})
		.on('error', function(err) {
			console.log('[Error] Database queryToObject() Error in row: ' + inspect(err));
		    callback(err);
		});
	});
};

exports.users = {
	insert :	function(user, callback){
		user.user = user.user?user.user:null;
		user.email = user.email?user.email:null;
		insertQuery("INSERT INTO Users (user, name, role, email, pass) VALUES (:user, :name, :role, :email, :pass)",
		user, function(err, id){
			if(err)
				callback(null, err);
			else if(typeof callback == 'function'){
				user._id = id;
				callback(null,user);
			}					
		});
	},
	findOne :	function(filters, callback){
		var query = sprintf("SELECT * FROM Users WHERE %s", filtersToWhere(filters));
		queryToObject(query, null, function(e, o){
			if(o && o._id) o._id = parseInt(o._id);
			callback(e,o);
		});
	},
	save :		function(data, options, callback){
		if(!data._id)
			callback('User update needs the _id');
		else {
			var user = {
					_id: data._id,
					user: data.user,
					name: data.name,
					role: data.role,
					email: data.email,
					pass: data.pass,
					room: data.room
			};
			var query = sprintf("UPDATE Users SET %s WHERE _id=?", filtersToSet(user));
			updateQuery(query, [data._id], function(error, affected){
				if(error){
					console.log("[Error] [SQL]",query);
					callback(error);
				} else if(affected == 1)
					callback(null, user);
				else
					callback("updating user: unexpected affected rows number="+affected);
			});
		}
	}
};