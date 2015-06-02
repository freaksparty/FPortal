var config = {ssl:{}, db:{}, smtp:{}};

config.ssl.enabled	= false;
config.ssl.keyfile	= '/home/siro/piamad.cert.key';
config.ssl.cerfile	= '/home/siro/piamad.cert.cert';

config.timezone = 'Europe/Madrid';
config.port	= 8888;	//Listening web port
config.blowfish = 'insert here random string';

config.db.host		= '127.0.0.1';
config.db.user		= 'PIAMAD';
config.db.password	= 'piamadpass';
config.db.db		= 'PIAMAD';

/*The email will be displayed in console output if smtp not enabled*/
config.smtp.enabled	= false;
config.smtp.host	= 'smtp.server.com';
config.smtp.user	= 'user@server.com';
config.smtp.password 	= 'password';
config.smtp.senderName	= 'Medical Citation Platform <user@server.com>';
config.baseUrl		= 'http://10.51.1.243:8888';

module.exports = config;