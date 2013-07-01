var sys  = require('sys');
var fs   = require('fs');

Permissions = function(options) {
   // list all ip addresses that should be blocked
	var _blacklist = [];
	// list all ip addresses that should be allowed
	var _whitelist = [];
	
	var _options = options || {};
	var _blackpath = _options.blacklist;
	var _whitepath = _options.whitelist;
	var _unban = _options.unban || 120; 
	
	if (!_blackpath || !_whitepath) throw ('lists not found');
	
	// ban an ip
	// @param ip: the ip address to ban
	this.ban = function(ip){
		// determine linebreak of the current platform
		var nl = process.platform === 'win32' ? '\r\n' : '\n';
		// check if ip is already in the blacklist
		for (i in _blacklist) {
			if (_blacklist[i] == ip) return;
		}
		// blacklist ip in memory
		_blacklist.push(ip);
		// blacklist ip in file
		fs.appendFile(_blackpath , ip + nl, encoding='utf8', function (err) {
			if(err) sys.log('error in updating blacklist [' + err + ']');
		});
	};
	
	// check if the ip is blacklisted/banned
	// @param ip: the ip address to check
	this.isBanned = function(ip){
		for (i in _blacklist) {
			if (_blacklist[i] == ip) return true;
		} 
		return false;
	}
	
	// if the whitelist file is not empty check if the ip is listed/allowed
	// @param ip: the ip address to check
	this.isAllowed = function(ip) {
		if (_whitelist.length == 0) return true;
		for (i in _whitelist) {
			if (_whitelist[i] == ip) return true;
		}
		return false;
	}
	
	// unban all blacklisted ips
	var _unBan = function() {
		_blacklist = [];
		fs.writeFile(_blackpath, '', function(err){
			if (err) console.log(err);
			else sys.log('deleting blacklist');
		});
		_blacklist = [];
		setTimeout(_unBan, _unban*1000);
	};
	
	// read the allowed and blocked ip addresses from the config files
	// triggered once when server starts & and everytime the config changes
	var _updatePermissions = function() {
		sys.log("Updating permissions");
		try {
			fs.readFile(_whitepath, encoding='utf8', function(err, data){
				if (err) sys.log('error reading whitelist [' + err + ']');
				else if(data) _whitelist = data.toString().split('\n');
				else _whitelist = [];
			});
			fs.readFile(_blackpath, encoding='utf8', function(err, data){
				if (err) sys.log('error reading blacklistitelist [' + err + ']');
				else if(data) _blacklist = data.toString().split('\n');
				else _blacklist = [];
			});
		} catch (err) {
			sys.log(err);
		}
	}
	
	// watch the config files for black- and whitelist
	// if a file changes update the list at runtime - no restart required
	var _watchPermissions = function(){
		try {
			fs.watchFile(_blackpath, function(c,p) { _updatePermissions(); });
			fs.watchFile(_whitepath, function(c,p) { _updatePermissions(); });
		} catch (err){
			sys.log(err);
		}
	}
	
	_unBan();
	_watchPermissions();
	_updatePermissions();
};

exports.Permissions = Permissions;