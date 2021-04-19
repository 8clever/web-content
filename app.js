#!/usr/bin/env node

/**
 * Module dependencies.
 */

const { makeApp } = require('./server');
var debug = require('debug')('web-content:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

const run = async () => {
	const app = await makeApp();
	const port = normalizePort(process.env.PORT || '3000');
	app.set('port', port);
	const server = http.createServer(app);
	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening);

	function onListening() {
		var addr = server.address();
		var bind = typeof addr === 'string'
			? 'pipe ' + addr
			: 'port ' + addr.port;
		debug('Listening on ' + bind);
		console.log(`Server listen on port: ${addr.port}!`);
	}
}

run().catch(console.log);

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}