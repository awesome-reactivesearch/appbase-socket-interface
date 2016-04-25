var appbaseRef = null;
var acl = null;
var subscribeCount = 0;


function Sockbase(appbaseRef, acl){
	console.log('sockbase initialized');
	this.appbaseRef = appbaseRef;
	this.acl = acl;
}

Sockbase.prototype.onSubscribe = function(io, socket, msg){
	var role = 'user';
	
	var self = this;
	this.acl.isAllowed(role, 'pendingpost', 'read', function(result){
		if (result){
			console.log('acl successful');
			console.log(self.appbaseRef);
			
			subscribeCount++;

			io.emit('subscribecount', subscribeCount + " subscriber");


			self.appbaseRef.searchStream({
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
			
		}else{
			console.log('acl failed');
			socket.emit('error', 'not allowed');
		}
	});
};

Sockbase.prototype.onBlogPost = function(io, socket, msg){	
	this.appbaseRef.index({
		type: 'pendingpost',
		body: msg
	}).on('data', function(response){
		console.log(response);
	}).on('error', function(error){
		console.log(error);
	});

	console.log('new blog post: ' + msg.title);
};

Sockbase.prototype.onDisconnect = function(io, socket, msg){
	console.log('a user disconnected');
};

module.exports = Sockbase;