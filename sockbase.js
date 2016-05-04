var appbaseRef = null;
var acl = null;
var pending_subscribeCount = 0;
var approved_subscribeCount = 0;


function Sockbase(appbaseRef, acl){
	console.log('sockbase initialized');
	this.appbaseRef = appbaseRef;
	this.acl = acl;
}

Sockbase.prototype.onLogin = function(io, socket, msg){
	var role = msg.role;
	
	var jsonObject = {
		role: role,
		result: 'true'
	};
	
	socket.emit('loggedin', jsonObject);
}

Sockbase.prototype.onSubscribeApproved = function(io, socket, msg){
	var role = msg.role;
	
	var self = this;
	this.acl.isAllowed(role, 'approvedpost', 'read', function(result){
		if (result){
			console.log('acl successful');
			
			approved_subscribeCount++;

			io.emit('approved_subscribeCount', approved_subscribeCount + " subscriber");


			self.appbaseRef.searchStream({
				type: 'approvedpost',
				body: {
					query: {
						match_all: {}
					}
				}
			}).on('data', function(response) {
				socket.emit('blog_post_approved', response._source);
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
			
			pending_subscribeCount++;

			io.emit('pending_subscribeCount', pending_subscribeCount + " subscriber");


			self.appbaseRef.searchStream({
				type: 'pendingpost',
				body: {
					query: {
						match_all: {}
					}
				}
			}).on('data', function(response) {
				socket.emit('blog_post_created', response._source);
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
		
			//socket.emit('success', 'Posted');			
		}else{
			socket.emit('failure', 'not allowed');
			console.log('acl failed');
		}
	});
};

Sockbase.prototype.onApprovePost = function(io, socket, msg){
	var role = msg.role;
	var self = this;
	
	this.acl.isAllowed(role, 'approvedpost', 'write', function(result){
		if (result){
			self.appbaseRef.search({
			  type: 'pendingpost',
			  body: {
				query: {
					match_all: {}
				}
			  }
			}).on('data', function(response) {
				var total = response.hits.total;
				var hits = response.hits.hits;
				
				hits.forEach(function(element, index, array){					
					self.appbaseRef.index({
						type: 'approvedpost',
						body: element._source
					}).on('data', function(response){
						self.appbaseRef.delete({
							type:'pendingpost',
							id: element._id
						});
					}).on('error', function(error){
						console.log(error);
					});
				});
			}).on('error', function(error) {
				console.log(error)
			});
			
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