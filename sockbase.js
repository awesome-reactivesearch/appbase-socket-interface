var appbaseRef = null;
var acl = null;
var pending_subscribeCount = 0;
var approved_subscribeCount = 0;

var TABLE_APPROVED_POST = 'approvedpost';
var TABLE_PENDING_POST = 'pendingpost';

function Sockbase(appbaseRef, acl){
	console.log('sockbase initialized');
	this.appbaseRef = appbaseRef;
	this.acl = acl;
}

Sockbase.prototype.onLogin = function(io, socket, msg){
	var role = msg.role;	
	var self = this;
	
	self.appbaseRef.search({
				type: 'approvedpost',
				body: {
					query: {
						match_all: {}
					}
				}
			}).on('data', function(response) {
				var hits = response.hits.hits;
				
				hits.forEach(function(element, index, array){
					//console.log(element);
					socket.emit('blog_post_approved', element);
				});
			}).on('error', function(error) {
				console.log("caught a searchStream() error: ", error)
			});
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
				var isDelete = response._deleted;
				
				if (isDelete == null){
					socket.emit('blog_post_approved', response);
				}
				else{
					socket.emit('blog_post_deleted', response);
				}
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
				var isDelete = response._deleted;
				
				if (isDelete == null){
					socket.emit('blog_post_created', response);
				}
				else{
					socket.emit('blog_post_deleted', response);
				}
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
	var session = msg.session;
	
	var self = this;
	this.acl.isAllowed(role, 'pendingpost', 'write', function(result){
		if (result){
			console.log(msg);
			self.appbaseRef.index({
				type: 'pendingpost',
				body: msg
			}).on('data', function(response){
				self.appbaseRef.get({
					type: 'pendingpost',
					id: response._id
				}).on('data', function(response){
					console.log(response);
					socket.emit('blog_post_created', response);
				});
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
	var id = msg.id;
	var self = this;
	
	console.log('request to approved: ' + id);
	
	this.acl.isAllowed(role, 'approvedpost', 'write', function(result){
		if (result){
			self.appbaseRef.get({
			  type: 'pendingpost',
			  id: id,
			}).on('data', function(response) {
				console.log(response);
				if (response.found === true){
					self.appbaseRef.index({
						type: 'approvedpost',
						body: response._source
					}).on('data', function(response){
						self.appbaseRef.delete({
							type:'pendingpost',
							id: id
						}).on('data', function(response){
							socket.emit('blog_post_deleted', response);
						});

						self.appbaseRef.get({
							type: 'approvedpost',
							id: response._id
						}).on('data', function(response){
							console.log(response);
							socket.emit('blog_post_approved', response);
						});
					}).on('error', function(error){
						console.log(error);
					});
				}
				else{
					socket.emit('failure', 'incorrect id');
				}
			}).on('error', function(error) {
				console.log(error)
			});
			
		}else{
			socket.emit('failure', 'not allowed');
			console.log('acl failed');
		}
	});
};

Sockbase.prototype.onDisapprovePost = function(io, socket, msg){
	var role = msg.role;
	var id = msg.id;
	var self = this;
	
	console.log('request to disapprove: ' + id);
	
	this.acl.isAllowed(role, 'approvedpost', 'delete', function(result){
		if (result){
			self.appbaseRef.get({
			  type: 'approvedpost',
			  id: id,
			}).on('data', function(response) {
				if (response.found === true){
					console.log(response);
					self.appbaseRef.index({
						type: 'pendingpost',
						body: response._source
					}).on('data', function(response){
						self.appbaseRef.delete({
							type:'approvedpost',
							id: id
						}).on('data', function(response){
							socket.emit('blog_post_deleted', response);
						});
						
						self.appbaseRef.get({
							type: 'pendingpost',
							id: response._id
						}).on('data', function(response){
							console.log(response);
							socket.emit('blog_post_created', response);
						});
						
					}).on('error', function(error){
						console.log(error);
					});
				}
				else{
					socket.emit('failure', 'incorrect id');
				}
			}).on('error', function(error) {
				console.log(error)
			});
			
		}else{
			socket.emit('failure', 'not allowed');
			console.log('acl failed');
		}
	});
};

Sockbase.prototype.onDeletePost = function(io, socket, msg){
	var role = msg.role;
	var id = msg.id;
	var type = msg.type;
	var self = this;
	
	console.log('request to delete');
	console.log(msg);
	
	this.acl.isAllowed(role, type, 'delete', function(result){
		if (result){
			self.appbaseRef.delete({
			  type: type,
			  id: id,
			}).on('data', function(response) {
				if (response.found === true){
					socket.emit('blog_post_deleted', response);
				}
				else{
					socket.emit('failure', 'incorrect id');
				}
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