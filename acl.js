

var permissions = [];
var appbaseRef = null;

function Acl(appbaseRef){
	this.appbaseRef = appbaseRef;
}

Acl.prototype.addPermission = function(role, model, permission){
	permissions.push([role, model, permission]);
}

Acl.prototype.isAllowed = function(role, model, permission, cb){
		console.log('isAllowed called');
		
		permissions.every(function(element, index, array){
			
			if (element[0] === role && element[1] === model && element[2] === permission){
				cb(true);
				return false;
			}
			
			if (index == array.length-1){
				cb(false);
				return false;
			}
			
			return true;
		});
	}

module.exports = Acl;