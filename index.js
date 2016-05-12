var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var config = require('./config').config;


var appbaseRef = config();

var wildcard = require('socketio-wildcard');
var nsp;
var role = 'none';
var sessionCount = 0;

var Sockbase = require('./sockbase');
var Acl = require('./acl');

var acl = new Acl(appbaseRef);

acl.addPermission('admin', 'pendingpost', 'write');
acl.addPermission('admin', 'pendingpost', 'read');
acl.addPermission('admin', 'pendingpost', 'delete');
acl.addPermission('admin', 'approvedpost', 'read');
acl.addPermission('admin', 'approvedpost', 'write');
acl.addPermission('admin', 'approvedpost', 'delete');


acl.addPermission('user', 'pendingpost', 'write');
acl.addPermission('user', 'approvedpost', 'read');
acl.addPermission('user', 'approvedpost', 'delete');


var sockbase = new Sockbase(appbaseRef, acl);

var callbacks = {
	'loggedin': sockbase.onLogin.bind(sockbase),
	'subscribe_approved': sockbase.onSubscribeApproved.bind(sockbase),
	'subscribe_pending': sockbase.onSubscribePending.bind(sockbase),
	'on_blog_post': sockbase.onBlogPost.bind(sockbase),
	'approve_pending': sockbase.onApprovePost.bind(sockbase),
	'move_to_pending': sockbase.onDisapprovePost.bind(sockbase),
	'delete_post': sockbase.onDeletePost.bind(sockbase),
	'disconnect': sockbase.onDisconnect.bind(sockbase)
};

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/dashboard', function(req, res) {
	console.log('role = ' + role);

	if (role == 'admin' || role == 'user' || role == 'guest')
		res.sendFile(__dirname + '/dashboard_' + role + '.html');
});

app.use(express.static(__dirname));


io.on('connection', function(socket) {
	console.log('a user connected');

	var middleware = wildcard();
	nsp = io.of('/sockbase');
	io.use(middleware);
	nsp.use(middleware);

	var sessionId = 'room' + sessionCount;
	socket.join(sessionId);
	io.to(sessionId).emit('joined', sessionId);
	sessionCount++;
	
	socket.on('*', function(msg) {
		callbacks[msg.data[0]](io, socket, msg.data[1]);
	});
});

http.listen(3000, function() {
	console.log('listening on *:3000');
});
