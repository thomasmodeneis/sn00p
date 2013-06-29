var http = require('http');

var Router = function(){
	
	// when invalid client deny the response
	this.drop = function(response) {
		response.end();
	}
	
	// when invalid request deny the response
	// tell the client that the response is denied
	this.reject = function(response, msg) {
		response.writeHead(403);
		response.write(msg);
		response.end();
	}
	
	this.forward = function(request, response) {
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
	}
	
	this.allow = function(response, msg){
		// ... use for outoing traffic
	}
}

exports.Router = Router;