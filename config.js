var Appbase = require('appbase-js');

/* appname, username and password should be changed */
var appbaseRef = new Appbase({
	url: 'https://scalr.api.appbase.io',
	appname: 'AppbaseBlog',
	username: 'yuQ65Bu21',
	password: 'cecd0380-e05a-48b7-81e2-ca2d90799881'
});


exports.config = function () {
	return appbaseRef;
}