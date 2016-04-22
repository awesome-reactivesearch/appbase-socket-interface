var Appbase = require('appbase-js');

/* appname, username and password should be changed */
var appbaseRef = new Appbase({
	url: 'https://scalr.api.appbase.io',
	appname: 'AppbaseSocket',
	username: 'sOvrbqBZI',
	password: '691444f1-c047-4f42-9f18-86a711f542eb'
});

var subscribeCount = 0;

module.exports = {
	onSubscribe: function(io, socket, msg){
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
	},
	
	onBlogPost: function(io, socket, msg){
		appbaseRef.index({
			type: 'pendingpost',
			body: msg
		}).on('data', function(response){
			console.log(response);
		}).on('error', function(error){
			console.log(error);
		});

		console.log('new blog post: ' + msg.title);
	},
	
	onDisconnect: function(io, socket, msg){
		console.log('a user disconnected');
	}
};