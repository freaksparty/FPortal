# PIAMAD
Plataforma Informática de Asistencia Médica A Distancia


####PIAMAD is built on top of the following libraries :

* [Node.js](http://nodejs.org/) - Application Server
* [Licode] (http://lynckia.com/licode) - Open Source WebRTC Communications Platform
* [Mariasql](https://github.com/mscdex/node-mariasql) - MariaDB and MySQL client framework
* [Express.js](http://expressjs.com/) - Node.js Web Framework
* [Jade](http://jade-lang.com/) - HTML Templating Engine
* [Stylus](http://learnboost.github.com/stylus/) - CSS Preprocessor
* [EmailJS](http://github.com/eleith/emailjs) - Node.js > SMTP Server Middleware
* [Moment.js](http://momentjs.com/) - Lightweight Date Library

PIAMAD was started as fork of [Node-login] (http://node-login.braitsch.io/) so it have some (but just a bit of) legacy code.

####Installation & Setup

(Stub) Install/Config licode (note not to run initLicode.sh as we have a tunned up version for this project)
TODO clean and include run script

####About HTTPS
For serving the pages with HTTPS some work-arrounds are needed relative to Licode. This program assumes that you are following these instructions to work properly on HTTPS.

When the client code tries to load data from a non-https connection, it will be blocked in modern browsers (including Firefox and Chrome). This forces us to use https in all client-server requests.
The erizo controller API relies on socket.io library, according to some external experiments [] ([1]) there are some problems in implementing https directly with this scenario, so the suggested method is to reverse proxy one https port to the actual Erizo API.

In order to make this easy, the client side of PIAMAD already does the trick of changing the port while connecting if config.erizoController.ssl is set to true. This uses the next port as https proxy of the actual service.

An example nginx.conf file will be provided, it will listen on port 8081 and proxy it to 8080 adding https. But you can use any port you want, as long the https is the http + 1.

But the token signature is generated with the port number included in the url, so you need to patch Erizo to reset the original port information before validating the token.

In short, the step-by-step guide is:
1. Enable HTTPS in PIAMAD config (TODO, not implemented)
2. Enable "config.erizoController.ssl" in file "LICODE_HOME/licode_config.js" of your licode installation.
3. Patch "LICODE_HOME/erizo_controller/erizoController/erizoController.js" with patch in "PIAMAD_HOME/https_example/ErizoController.js.patch"
4. Re-run "LICODE_HOME/scripts/installErizo.sh" to compile patch changes.
5. Set route to certificate files in "PIAMAD_HOME/https_example/nginx.conf"
   And run nginx with the config file.
6. Run PIAMAD as usual.

All these changes will not affect the http configuration. You only have to disable HTTPS/SSL in PIAMAD and LICODE config files to revert changes.

WARNING: If your certificate is not recognized by the browser (It needs to be manually accepted by user), it will be rejected also in the Erizo API without asking the user. To fix it, just enter the API url and manually add the certificate exception (for example https://localhost:8081/ )