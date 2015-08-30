var config = {ssl:{}, db:{}, smtp:{}};

config.ssl.enabled	= false;
config.ssl.keyfile	= '/route/to/cert.key';
config.ssl.cerfile	= '/route/to/cert.cert';

//This will always consider default Erizo port at localhost
//You need to define keyfile and cerftile as well
config.ssl.builtInProxy	= false;

config.title	= "Freak's Party";
config.timezone	= 'Europe/Madrid';
config.port		= 8888;	//Listening web port
config.blowfish	= 'insert here random string';
config.p2p		= false;  //You should recreate rooms in-app to update this value

config.db.host		= '127.0.0.1';
config.db.port		= 27017;
//config.db.user		= 'PIAMAD';
//config.db.password	= 'piamadpass';
config.db.db		= 'FPortal';

/*The email will be displayed in console output if smtp not enabled*/
config.smtp.enabled	= false;
config.smtp.host	= 'smtp.server.com';
config.smtp.user	= 'user@server.com';
config.smtp.password 	= 'password';
config.smtp.senderName	= "Freak's Party";
config.baseUrl		= 'http://freaksparty.org';

module.exports = config;
