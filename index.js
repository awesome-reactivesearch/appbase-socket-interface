var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var Appbase = require('appbase-js');

/* appname, username and password should be changed */
var appbaseRef = new Appbase({
	url: 'https://scalr.api.appbase.io',
	appname: 'AppbaseSocket',
	username: 'sOvrbqBZI',
	password: '691444f1-c047-4f42-9f18-86a711f542eb'
});

var wildcard = require('socketio-wildcard');
var nsp;

var Sockbase = require('./sockbase');
var Acl = require('./acl');

var acl = new Acl(appbaseRef);

acl.addPermission('admin', 'pendingpost', 'read');
acl.addPermission('admin', 'pendingpost', 'delete');
acl.addPermission('admin', 'approvedpost', 'read');
acl.addPermission('admin', 'approvedpost', 'write');
acl.addPermission('admin', 'approvedpost', 'delete');

acl.addPermission('user', 'pendingpost', 'read');
acl.addPermission('user', 'pendingpost', 'write');
acl.addPermission('user', 'approvedpost', 'read');
acl.addPermission('user', 'approvedpost', 'delete');


var sockbase = new Sockbase(appbaseRef, acl);

var callbacks = {
	'subscribe': sockbase.onSubscribe.bind(sockbase),
	'blog post': sockbase.onBlogPost.bind(sockbase),
	'disconnect': sockbase.onDisconnect.bind(sockbase)
};

var aclCheckList = {
	'subscribe': {
		'role': 'admin',
		'model': 'pendingpost',
		'permission': 'read'
	}
};


app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log('a user connected');
	
	var middleware = wildcard();
    nsp = io.of('/sockbase');
    io.use(middleware);
    nsp.use(middleware);
	
	socket.on('*', function(msg){
		callbacks[msg.data[0]](io, socket, msg.data[1]);
		
		/*var role = 'role';
		var model = 'model';
		var permission = 'permission';
		
		acl.isAllowed(role, model, permission, function(result){
			if (result){
				console.log('acl success');
				callbacks[msg.data[0]](io, socket, msg.data[1]);
			}else{
				console.log('acl failed');
			}
		});*/
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
