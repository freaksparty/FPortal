/*
 * @license: MIT
 * @copyright: 2014 Siro González Rodríguez
 */
var dbconfig = {
		  host: '127.0.0.1',
		  user: 'PIAMAD',
		  password: 'piamadpass',
		  db: 'PIAMAD',
		  queryCache: false
		};

/*
 * NOTE: Entity is always out of transactions
 */

var inspect = require('util').inspect;
var Client = require('mariasql');
var sprintf = require('sprintf').sprintf;
var moment = require('moment');

/*Common for not transactional queries*/
var mainClient;
var sql;
if(mainClient == null) {
	console.log("[INFO] Connecting to SQL...");
	mainClient = new Client();
	mainClient.connect(dbconfig);
	mainClient.on('connect', function() {
		   console.log('[OK] SQL datasource connected');
		   mainClient.query("SET autocommit=0;");
		 })
		 .on('error', function(err) {
		   console.log('[ERROR] Connecting to SQL: ' + err);
		 })
		 .on('close', function(hadError) {
		   console.log('[!!] SQL client closed');
		 });
	sql = new Sql();
}

module.exports = sql;

function Sql(){
	
	this.c = mainClient;
	this.transaction = false;
	
	this.close = function() {
		/*if(this.transaction)
			this.rollback();
		this.c.end();*/
	};
	
	/* Basic CRUD */
	this.queryToObject = function(query, values, callback){
		var found = false;
		this.c.query(query, values)
		.on('result', function(res) {
			res.on('row', function(row) {
				found = true;
				callback(null, row);
			})
			.on('error', function(err) {
				console.log('[Error] Database queryToObject() Error in row: ' + inspect(err));
				console.log('[Error] [SQL] ', query);
			    callback(err);
			});
		}).on('end', function(err) {
			if(!found)
				callback(null, null);
		});
	};
	this.queryToList = function (query,values, options, callback) {
		if(options.size){
			options.skip = options.skip?options.skip:0;
			query += sprintf(" LIMIT %i, %i", options.skip, options.skip+options.size);
		}
		var result = [];
		var error = null;
		this.c.query(query, values)
		.on('result', function(res) {
			res.on('row', function(row) {
				result.push(row);
			})
			.on('error', function(err) {
				console.log('[Error] Database queryToList() Error in row: ' + inspect(err));
			    error = err;
			});
		}).on('end', function(info){
			if(error) {
				console.log("[Error] [SQL] ",query);
				callback("Error in datasource", result);
			}
			else
				callback(null, result);
		});
	};
	this.queryToArray = function(query, values, callback) {
		var result = [];
		var error = null;
		this.c.query(query, values, true)
		.on('result', function(res){
			res.on("row", function(row){result.push(row[0]);})
			.on("error", function(err) {
				error = err;
				console.log("[Error] In row: ", err);
			});
		}).on("end", function(info) {
			if(error){
				console.log("[Error] [SQL] ", query);
				callback("Error in datasource", result);
			}
			else
				callback(null, result);
		});
	};
	
	//**Common for insert and update **//*
	this.saveQuery = function (query, values, callback){
		this.c.query(query, values)
		.on('result', function(res){
			res.on('end', function(info){
				callback(null, info);
			}).on('error', function(err){
				console.log("[Error] saving", inspect(err));
				console.log("[Error] [SQL]", query);
				callback(err);
			});
		}).on('error', function(err){
			callback(err);
		});
	};
	this.insertQuery = function (query, values, callback){
		this.saveQuery(query, values, function(err, info){
			if(err) {
				callback(err);
				console.log("[Error] [SQL]", query);
			} else if(info.affectedRows == 1)
				callback(null, info.insertId);
			else
				callback("inserting: unexpected affected rows number="+info.affectedRows);			
		});
	};
	this.updateQuery = function (query, values, callback){
		this.saveQuery(query, values, function(err, info){
			if(err) {
				callback(err);
				console.log("[Error] [SQL]", query);
			} else 
				callback(null, info.affectedRows);
		});
	};
	
	//** Simple ORM **//*
	this.Entity = function(table, checkData, columns, momentColumns) {

		this.table = table;
		this.columns = columns;
		if(!momentColumns)
			this.momentCols = [];
		else
			this.momentCols = momentColumns;
		
		this.entityFromData = function(data){
			checkData(data);
			var rtn = {};
			var columns = this.columns;
			var column;
			for(i in columns){
				column = columns[i];
				if(data[column] != undefined)
					if((data[column] == null) || (data[column].length === 0))
						rtn[column] = null;
					else if(moment.isMoment(data[column]))
						rtn[column] = momentToString(data[column]);
					else
						rtn[column] = data[column];
			}
			return rtn;
		};
		
		this.parseRow = function(row){
			var col;
			for(i in this.momentCols){
				col = this.momentCols[i];
				if(row[col])
					row[col]=moment(row[col], 'YYYY-MM-DD HH:mm:ss');
			}
			return row;
		};
		
		this.insert = function(data, options, callback){
			data = this.entityFromData(data);
			var query = sprintf("INSERT INTO %s (%s) VALUES (:%s)", 
					this.table, 
					Object.keys(data).join(','), 
					Object.keys(data).join(',:'));
			sql.insertQuery(query,data, 
			function(err, id){
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
			var me = this;
			var query = sprintf("SELECT * FROM "+this.table+" WHERE %s", filtersToWhere(filters));
			sql.queryToObject(query, null, function(e, o){
				if(o) o = me.parseRow(o);
				callback(e,o);
			});
		};
		this.save = function(data, options, callback){
			if(!data._id)
				callback(table+' update needs the _id');
			else {
				var entity = this.entityFromData(data);
				var that = this;
				var query = sprintf("UPDATE "+this.table+" SET %s WHERE _id=?", filtersToSet(entity));
				sql.updateQuery(query, [data._id], function(error, affected){
					if(error){
						callback(error);
					} else if(affected <= 1)
						callback(null, entity);
					else {
						console.log("[Warning] [SQL] "+query);
						callback("updating "+that.table+": unexpected affected rows number="+affected);
					}
				});
			}
		};
		this.remove = function(filters, callback){
			var query = sprintf("DELETE FROM "+this.table+" WHERE %s", filtersToWhere(filters));
			sql.insertQuery(query, {}, callback);
		};
		this.update = function(filters, sets, callback){
			var query = sprintf("UPDATE "+this.table+" SET %s WHERE %s", filtersToSet(sets), filtersToWhere(filters),callback);
			sql.updateQuery(query, {}, callback);
		};
		this.howMany = function(filters, callback){
			var query = sprintf("SELECT COUNT(*) FROM %s WHERE %s", this.table, filtersToWhere(filters));
			sql.c.query(query, null, true)
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
	};
	//this.Entity.prototype.c = this.c;
	this.Entity.sql = this;
	
	this.filtersToWhere = filtersToWhere;
	this.filtersToSet = filtersToSet;
	
	/*Transaction support*/
	this.startTransaction = function() {
		this.c = new Client();
		var c = this.c;
		//this.hasErrors = hasErrors;
		this.c.on('connect', function() {
			   /*c.query("SET autocommit=0;");
			   c.query("START TRANSACTION;");*/
			   //console.log("Transaction start");
		 })
		 .on('error', function(err) {
		   console.log('[ERROR] Creating transaction client on SQL: ' + err);
		 })
		 .on('close', function(hadError) {
			 //c.query("ROLLBACK;");
			 //console.log('[ !! ] SQL client closed');
		 });
		this.c.connect(dbconfig);
		this.transaction = true;
	};
	this.commit = function() {
		this.c.query("COMMIT;");
	};
	this.rollback = function() {
		//this.c.query("ROLLBACK;");
		//console.log("[SQL] ROLLBACK");
	};
}

/* Aux functions */
function momentToString(m){
	return m.format('YYYY-MM-DD HH:mm:ss');
}

function filtersToWhere(filters, joiner){
	var where = [];
	for (key in filters){
		val = filters[key];
		key = mainClient.escape(key);
		if(typeof val == "string")
			if(val.length > 0)
				where.push(key+"='"+mainClient.escape(val)+"'");
			else
				where.push(key+"IS NULL");
		else if(typeof val == "number")
			where.push(key+"="+val);
		else if(moment.isMoment(val))
			where.push(key+"'"+momentToString(val)+"'");
		else if(val == null)
			where.push(key+" IS NULL");
	}
	return where.join(" AND ");
}

function filtersToSet(filters) {
	var set = [];
	for (key in filters){
		val = filters[key];
		key = mainClient.escape(key);
		if(typeof val == "string")
			if(val.length > 0)
				set.push(key+"='"+mainClient.escape(val)+"'");
			else
				set.push(key+"=NULL");
		else if(typeof val == "number")
			set.push(key+"="+val);
		else if(moment.isMoment(val))
			set.push(key+"'"+momentToString(val)+"'");
		else if(val == null)
			set.push(key+"= NULL");
	}
	return set.join(", ");
}

/*function Transaction() {
	var c = new Client(dbconfig);
	var hasErrors = false;
	this.hasErrors = hasErrors;
	
	c.on('connect', function() {
		   c.query("SET autocommit=0;");
		   c.query("START TRANSACTION;");
	 })
	 .on('error', function(err) {
	   console.log('[ERROR] Creating transaction client on SQL: ' + err);
	 })
	 .on('close', function(hadError) {
	   console.log('[!!] SQL client closed');
	 });
	c.connect();
	this.commit = function() {
		c.query("COMMIT;");
	};
	this.rollback = function() {
		c.query("ROLLBACK;");
	};
	this.close = function() {
		if(!this.hasErrors)
			c.query("COMMIT;");
		c.close();
		c = null;
	};
	this.alterQuery = function(query, values, callback){
		c.query(query, values)
		.on('result', function(res){
			res.on('end', function(info){
				callback(null, info);
			}).on('error', function(err){
				console.log("[Error] saving", inspect(err));
				callback(err);
			});
		}).on('error', function(err){
			hadErrors = true;
			callback(err);
		});
	};

}
exports.transaction = Transaction;*/

/*exports.users = new Entity("Users", function(user){
	user.user = user.user?user.user:null;
	user.email = user.email?user.email:null;
	}, 	["_id", "user", "name", "role", "email", "pass", "room", "nss"]);

exports.events = new Entity("Events", function(e){
	e.comments = e.comments?e.comments:null;
	}, ["_id", "owner", "patient", "start", "duration", "comments", "status"], ["start"]);*/