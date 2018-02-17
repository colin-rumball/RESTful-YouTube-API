var fs = require('fs');
var util = require('util');
var google = require('googleapis');

const { removeEmptyParameters } = require('./removeEmptyParameters');

var getThumbnail = (auth, requestData, callback) => {
	var service = google.youtube('v3');
	var parameters = removeEmptyParameters(requestData['params']);
	parameters['auth'] = auth;
	service.videos.list(parameters, callback);
}

module.exports = { getThumbnail };