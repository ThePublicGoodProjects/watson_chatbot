#!/usr/bin/env

'use strict';

require('dotenv').config({silent: true});

var server = require('./app');
var port   = process.env.PORT || 9000;

server.listen(port, function () {
    // eslint-disable-next-line
    console.log('Server running on port: %d', port);
});

