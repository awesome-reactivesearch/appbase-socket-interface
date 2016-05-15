var appbaseRef = null;
var acl = null;
var subscribe_pending_count = 0;
var subscribe_publish_count = 0;

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
				type: TABLE_APPROVED_POST,
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
	this.acl.isAllowed(role, TABLE_APPROVED_POST, 'read', function(result){
		if (result){
			console.log('acl successful');

			subscribe_publish_count++;
			var subscribers = " subscriber" + ((subscribe_publish_count>1)?"s":"");
			// approve the publish subscribe
			socket.emit('subscribe_publish', true);
			// broadcast the subscription state
			io.emit('subscribe_publish_count', subscribe_publish_count + subscribers);

			self.appbaseRef.searchStream({
				type: TABLE_APPROVED_POST,
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
	this.acl.isAllowed(role, TABLE_PENDING_POST, 'read', function(result){
		if (result){
			console.log('acl successful');

			subscribe_pending_count++;

			var subscribers = " subscriber" + ((subscribe_pending_count>1)?"s":"")
			// approve the "pending" subscribe
			socket.emit('subscribe_pending', true)
			// broadcast the subscription state
			io.emit('subscribe_pending_count', subscribe_pending_count + subscribers);

			self.appbaseRef.searchStream({
				type: TABLE_PENDING_POST,
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


			self.appbaseRef.search({
				type: TABLE_PENDING_POST,
				body: {
					query: {
						match_all: {}
					}
				}
			}).on('data', function(response) {
				var hits = response.hits.hits;

				hits.forEach(function(element, index, array){
					socket.emit('blog_post_created', element);
				});
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
	this.acl.isAllowed(role, TABLE_PENDING_POST, 'write', function(result){
		if (result){
			console.log(msg);
			self.appbaseRef.index({
				type: TABLE_PENDING_POST,
				body: msg
			}).on('data', function(response){
				self.appbaseRef.get({
					type: TABLE_PENDING_POST,
					id: response._id
				}).on('data', function(response){
					console.log(response);
					socket.emit('blog_post_created', response);
				});
			}).on('error', function(error){
				console.log(error);
			});
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

	this.acl.isAllowed(role, TABLE_APPROVED_POST, 'write', function(result){
		if (result){
			self.appbaseRef.get({
			  type: TABLE_PENDING_POST,
			  id: id,
			}).on('data', function(response) {
				console.log(response);
				if (response.found === true){
					self.appbaseRef.index({
						type: TABLE_APPROVED_POST,
						body: response._source
					}).on('data', function(response){
						self.appbaseRef.delete({
							type:TABLE_PENDING_POST,
							id: id
						}).on('data', function(response){
							socket.emit('blog_post_deleted', response);
						});

						self.appbaseRef.get({
							type: TABLE_APPROVED_POST,
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

	this.acl.isAllowed(role, TABLE_APPROVED_POST, 'delete', function(result){
		if (result){
			self.appbaseRef.get({
			  type: TABLE_APPROVED_POST,
			  id: id,
			}).on('data', function(response) {
				if (response.found === true){
					console.log(response);
					self.appbaseRef.index({
						type: TABLE_PENDING_POST,
						body: response._source
					}).on('data', function(response){
						self.appbaseRef.delete({
							type:TABLE_APPROVED_POST,
							id: id
						}).on('data', function(response){
							socket.emit('blog_post_deleted', response);
						});

						self.appbaseRef.get({
							type: TABLE_PENDING_POST,
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
