var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Appbase = require('appbase-js');

/* appname, username and password should be changed */
var appbaseRef = new Appbase({
	url: 'https://scalr.api.appbase.io',
	appname: 'AppbaseSocket',
	username: 'sOvrbqBZI',
	password: '691444f1-c047-4f42-9f18-86a711f542eb'
});

var subscribeCount = 0;

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log('a user connected');


	socket.on('disconnect', function(){
		console.log('a user disconnected');
	});

	socket.on('blog post', function(msg){
		appbaseRef.index({
			type: 'pendingpost',
			body: msg
		}).on('data', function(response){
			console.log(response);
		}).on('error', function(error){
			console.log(error);
		});

		console.log('new blog post: ' + msg.title);
	});

	socket.on('subscribe', function(msg){
		subscribeCount++;

		console.log('subscribe: ' + subscribeCount);

		io.emit('subscribecount', subscribeCount + " subscriber");


		appbaseRef.searchStream({
			type: 'pendingpost',
			body: {
				query: {
					match_all: {}
				}
			}
		}).on('data', function(response) {
			console.log("searchStream(), new match: ", response);
	        socket.emit('blog post', response._source);
		}).on('error', function(error) {
			console.log("caught a searchStream() error: ", error)
		});
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
