var http = require('http');
var sys  = require('sys');
var Permissions = require('./detectives/permissions').Permissions;
var BruteForce = require('./detectives/bruteForce').BruteForce;
var Router = require('./services/router').Router;
var Logger = require('./services/logging').Logger;

var permissions = new Permissions();
var bruteForce = new BruteForce(permissions);
var router = new Router();
var logger = new Logger();

// create the proxy server
http.createServer(function(request, response) {
	sys.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
	
	// check the requests against blacklist
	var ip = request.connection.remoteAddress;
	if (permissions.isBanned(ip)) {
		router.drop(response);
		sys.log(msg);
		return;
	}
	// check the requests against whitelist
	if (!permissions.isAllowed(ip)) {
		msg = "IP " + ip + " is not allowed to use this proxy";
		router.deny(response, msg);
		sys.log(msg);
		return;
	}
	// check the request for brute-force attacks
	if (bruteForce.check(ip, request.url)) {
		router.drop(response);
		sys.log(msg);
		return;
	}
	
	// options for the proxy request
	request.headers.host = '';
	var options = {
		hostname: 'localhost',
		port: 8080,
		path: request.url,
		method: request.method,
		headers: request.headers
	};
  
	// create the proxy request object
	var proxy_request = http.request(options); 
	// add listeners to the proxy request 
	proxy_request.addListener('response', function (proxy_response) {

		proxy_response.on('data', function(chunk) {
			response.write(chunk, 'binary');
		});

		proxy_response.on('end', function() {
			response.end();
		});

		proxy_response.on('error', function(error) {
			sys.log('request.listener - error: ' + error);
		});
		
		response.writeHead(proxy_response.statusCode, proxy_response.headers);
	});
	
	// add the listeners for the requests
	request.on('data', function(chunk) {
		proxy_request.write(chunk, 'binary');
	});

	request.on('end', function() {
		proxy_request.end();
	});
 
	request.on('error', function(error) {
	});
	
}).listen(8081);
sys.log('Starting proxy firewall on port 8081');
