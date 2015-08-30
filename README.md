# FPortal
Experiments with Node.js modularity that could lead to:
FP Main portal at freaksparty.org

## Install and execution
Prerequisites: node npm mongodb-server

Installation:
$ npm install
$ sh deploy.sh (this step will be integrated in the app init if possible)

This tool is executed the same way any other Node.js & Express app.
$ node app

If no admin user exists it will be created, please change password as soon as possible in the first execution.

## Core functionalities planned
Login/accounting service
Admin users and groups
Multilanguage support
Templating system
Modularity support

## Modules intended to be part of this
LDAP auth and accounting
Custom multi-conferencing for big groups, with moderation.
Every fp.org service integration with priorities as listed in private docs.