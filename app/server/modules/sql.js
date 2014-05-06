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
			if(val.length > 0)
				where.push(key+"='"+c.escape(val)+"'");
			else
				where.push(key+"IS NULL");
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
			if(val.length > 0)
				set.push(key+"='"+c.escape(val)+"'");
			else
				set.push(key+"=NULL");
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
		if(err) {
			callback(err);
			console.log("[Error] [SQL]", query);
		} else if(info.affectedRows == 1)
			callback(null, info.insertId);
		else
			callback("inserting: unexpected affected rows number="+info.affectedRows);			
	});
};
function updateQuery(query, values, callback){
	saveQuery(query, values, function(err, info){
		if(err) {
			callback(err);
			console.log("[Error] [SQL]", query);
		} else 
			callback(null, info.affectedRows);
	});
};

//** Simple ORM **//
function Entity(table, checkData, columns) {

	this.table = table;
	this.columns = columns;
	
	this.entityFromData = function(data){
		var rtn = {};
		var columns = this.columns;
		var column;
		for(i in columns){
			column = columns[i];
			if((data[column] == undefined) || (data[column] == null) || (data[column].length === 0))
				rtn[column] = null;
			else
				rtn[column] = data[column];
		}
		return rtn;
	};
	
	this.insert = function(data, options, callback){
		data = this.entityFromData(data);
		insertQuery("INSERT INTO "+this.table+" (user, name, role, email, pass) VALUES (:user, :name, :role, :email, :pass)",
		data, function(err, id){
			if(typeof callback == 'function')
				if(err)
					callback(null, err);
				else if(typeof callback == 'function'){
					data._id = id;
					callback(null,data);
				}
			else if(err) {
				console.log("[Error] Inserting on"+this.table, err);
			}
		});
	};
	
	this.findOne = function(filters, callback){
		var query = sprintf("SELECT * FROM "+this.table+" WHERE %s", filtersToWhere(filters));
		queryToObject(query, null, function(e, o){
			if(o && o._id) o._id = parseInt(o._id);
			callback(e,o);
		});
	};
	this.save = function(data, options, callback){
		if(!data._id)
			callback(table+' update needs the _id');
		else {
			var entity = this.entityFromData(data);
			var query = sprintf("UPDATE "+this.table+" SET %s WHERE _id=?", filtersToSet(entity));
			updateQuery(query, [data._id], function(error, affected){
				if(error){
					callback(error);
				} else if(affected == 1)
					callback(null, entity);
				else
					callback("updating "+this.table+": unexpected affected rows number="+affected);
			});
		}
	};
	this.remove = function(filters, callback){
		var query = sprintf("DELETE FROM "+this.table+" WHERE %s", filtersToWhere(filters));
		insertQuery(query, {}, callback);
	};
	this.update = function(filters, sets, callback){
		var query = sprintf("UPDATE "+this.table+" SET %s WHERE %s", filtersToSet(sets), filtersToWhere(filters),callback);
		updateQuery(query, {}, callback);
	};
	this.howMany = function(filters, callback){
		var query = sprintf("SELECT COUNT(*) FROM %s WHERE %s", this.table, filtersToWhere(filters));
		c.query(query, null, true)
		.on('result', function(res) {
			res.on('row', function(row) {
				callback(null, row[0]);
			})
			.on('error', function(err) {
				console.log('[Error] Database howMany() Error in row: ' + inspect(err));
			    callback(err);
			});
		});
	};
}

exports.users = new Entity("Users", function(user){
	user.user = user.user?user.user:null;
	user.email = user.email?user.email:null;
	}, 	["_id", "user", "name", "role", "email", "pass", "room", "nss"]);