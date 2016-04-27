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


acl.addPermission('user', 'pendingpost', 'write');
acl.addPermission('user', 'approvedpost', 'read');
acl.addPermission('user', 'approvedpost', 'delete');


var sockbase = new Sockbase(appbaseRef, acl);

var callbacks = {
	'subscribe_approved': sockbase.onSubscribeApproved.bind(sockbase),
	'subscribe_pending' : sockbase.onSubscribePending.bind(sockbase),
	'on_blog_post': sockbase.onBlogPost.bind(sockbase),
	'approve_pending': sockbase.onApprovePost.bind(sockbase),
	'disconnect': sockbase.onDisconnect.bind(sockbase)
};

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log('a user connected');
	
	appbaseRef.index({type: 'pendingpost', body: {} });
	appbaseRef.index({type: 'approvedpost', body: {} });
	
	var middleware = wildcard();
    nsp = io.of('/sockbase');
    io.use(middleware);
    nsp.use(middleware);
	
	socket.on('*', function(msg){
		callbacks[msg.data[0]](io, socket, msg.data[1]);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
