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
	
	// check the requests against black- & whitelist
	var ip = request.connection.remoteAddress;
	//ip = '1.1.9';
	if (permissions.isBanned(ip)) {
		router.drop(response);
		msg = "IP " + ip + " is banned";
		sys.log(msg);
		return;
	}
	if (!permissions.isAllowed(ip)) {
		router.deny(response, msg);
		msg = "IP " + ip + " is not allowed to use this proxy";
		sys.log(msg);
		return;
	}
	// check the request for brute-force attacks
	if (bruteForce.check(ip, request.url)) {
		router.drop(response);
		msg = "IP " + ip + " is blocked because of too many requests";
		sys.log(msg);
		return;
	}
	// if nothing suspicious - forward the request
	router.forward(request, response);
	
}).listen(8081);
sys.log('Starting proxy firewall on port 8081');
