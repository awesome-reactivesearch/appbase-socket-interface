var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var wildcard = require('socketio-wildcard');
var nsp;

var sockbase = require('./sockbase');

var callbacks = {
	'subscribe': sockbase.onSubscribe,
	'blog post': sockbase.onBlogPost,
	'disconnect': sockbase.onDisconnect
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
		console.log('on: new post: ' + msg.data[0]);
		callbacks[msg.data[0]](io, socket, msg.data[0]);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
