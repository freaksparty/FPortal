var config = {ssl:{}, db:{}, smtp:{}};

config.ssl.enabled	= true;
config.ssl.keyfile	= '/home/usuario/piamad.cert.key';
config.ssl.cerfile	= '/home/usuario/piamad.cert.cert';

//If NGINX is not working properly for SSL enable this instead
//This will always consider default Erizo port at localhost
//You need to define keyfile and cerftile as well
config.ssl.builtInProxy	= true;

config.timezone	= 'Europe/Madrid';
config.port		= 8888;	//Listening web port
config.blowfish	= 'insert here random string';
config.p2p		= false;  //You should recreate rooms in-app to update this value

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
