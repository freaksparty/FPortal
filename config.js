var config ={};

config.ssl = {
		enabled : false,
		keyfile : '/home/siro/piamad.cert.key',
		cerfile : '/home/siro/piamad.cert.cert'
};

config.timezone = 'Europe/Madrid';
config.port = 8888;
config.blowfish = 'insert here random string';

module.exports = config;