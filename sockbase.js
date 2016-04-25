var appbaseRef = null;
var acl = null;
var subscribeCount = 0;


function Sockbase(appbaseRef, acl){
	console.log('sockbase initialized');
	this.appbaseRef = appbaseRef;
	this.acl = acl;
}

Sockbase.prototype.onSubscribeApproved = function(io, socket, msg){
	var role = msg.role;
	
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
			socket.emit('failure', 'not allowed');
		}
	});
};

Sockbase.prototype.onSubscribePending = function(io, socket, msg){
	var role = msg.role;
	
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
			socket.emit('failure', 'not allowed');
		}
	});
};

Sockbase.prototype.onBlogPost = function(io, socket, msg){
	var role = msg.role;
	
	var self = this;
	this.acl.isAllowed(role, 'pendingpost', 'write', function(result){
		if (result){
			console.log(msg);
			self.appbaseRef.index({
				type: 'pendingpost',
				body: msg
			}).on('data', function(response){
				console.log(response);
			}).on('error', function(error){
				console.log(error);
			});
		
			socket.emit('success', 'Posted');
			console.log('new blog post: ' + msg.title);
			
		}else{
			socket.emit('failure', 'not allowed');
			console.log('acl failed');
		}
	});
};

Sockbase.prototype.onDisconnect = function(io, socket, msg){
	console.log('a user disconnected');
};

module.exports = Sockbase;