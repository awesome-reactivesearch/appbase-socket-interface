
var config = require('./config').config;


var appbaseRef = config();

var createTable = function(){
	console.log('\n\nLets create some empty table for you\n\n' )
	appbaseRef.index({
		
			type: 'pendingpost',
			body: {}
			
		}).on('data', function(response){
			appbaseRef.delete({
				
				type: response._type,
				id: response._id
				
			}).on('data', function(res) {
				console.log("successfully created table: ", res._type);

				appbaseRef.index({
					
					type: 'approvedpost',
					body: {}
					
				}).on('data', function(response){
					
					appbaseRef.delete({
						
						type: response._type,
						id: response._id
						
					}).on('data', function(res) {
						
						console.log("successfully created table: ", res._type);
						console.log('\n\nWe\'re done.\nYou can exit now and start original app using the command "node index.js"');
						
					}).on('error', function(err) {
						
						console.log("deletion error: ", err);
					})
				}).on('error', function(error){
					
					console.log(error);
				});
				
			}).on('error', function(err) {
			  console.log("deletion error: ", err);
			})
			
		}).on('error', function(error){
			console.log(error);
		});
};


createTable();
