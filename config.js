var Appbase = require('appbase-js');

/* appname, username and password should be changed */
var appbaseRef = new Appbase({
	url: 'https://scalr.api.appbase.io',
	appname: 'AppbaseSocket',
	username: 'sOvrbqBZI',
	password: '691444f1-c047-4f42-9f18-86a711f542eb'
});


exports.config = function () {
	return appbaseRef;
}