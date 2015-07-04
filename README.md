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

$ git clone https://github.com/ging/licode.git
$ git clone https://github.com/xiromoreira/PIAMAD.git PIAMAD

Run the dependencies script in "licode/scripts" called "install*Deps.sh" you can use the one located in "PIAMAD/extras" for Fedora 20/21 with RPMFusion.

(Read "About HTTPS" now if you want to enable it.
$ ./licode/scripts/installErizo.sh; ./licode/scripts/installNuve.sh

Copy the provided Licode initializer:
$ cp PIAMAD/extras/startLicode.sh .

You need to create the Database as described in "PIAMAD/docs/create.sql".
Then set your settings in "PIAMAD/config.js".
And install dependencies:
$ cd PIAMAD; npm install

####Starting up
First, init Licode service (needed after every reboot):
$ ./startLicode.sh
Then, you are free to start the platform:
$ cd PIAMAD; node app.js; cd ..

Use CONTROL+C to end the instance. You can run it in background or through screen to detach the session without terminating the service.


####About HTTPS
For serving the pages with HTTPS some work-arrounds are needed relative to Licode. This program assumes that you are following these instructions to work properly on HTTPS.

When the client code tries to load data from a non-https connection, it will be blocked in modern browsers (including Firefox and Chrome). This forces us to use https in all client-server requests.
The erizo controller API relies on socket.io library, according to some external experiments [] ([1]) there are some problems in implementing https directly with this scenario, so the suggested method is to reverse proxy one https port to the actual Erizo API.

In order to make this easy, the client side of PIAMAD already does the trick of changing the port while connecting if config.erizoController.ssl is set to true. This uses the next port as https proxy of the actual service.

You can enable built-in reverse proxy in "config.js", it will listen on port 8081 and proxy it to 8080 adding https. But you can use any port you want, as long the https is the http + 1.

The token signature is generated with the port number included in the url, so you need to patch Erizo to reset the original port information before validating the token.

In short, the step-by-step guide is:
1. Enable HTTPS and builtIn proxy in PIAMAD config.js.
2. Enable "config.erizoController.ssl" in file "LICODE_HOME/licode_config.js" of your licode installation.
3. Patch "LICODE_HOME/erizo_controller/erizoController/erizoController.js" with patch in "PIAMAD_HOME/extras/https/ErizoController.js.patch"
4. Re-run "LICODE_HOME/scripts/installErizo.sh" to compile patch changes.
5. Run PIAMAD as usual.

All these changes will not affect the http configuration. You only have to disable HTTPS/SSL in PIAMAD and LICODE config files to revert changes.

WARNING: If your certificate is not recognized by the browser (It needs to be manually accepted by user), it will be rejected also in the Erizo API without asking the user. To fix it, just enter the API url and manually add the certificate exception (for example https://localhost:8081/ )
