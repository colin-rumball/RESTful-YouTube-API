var fs = require('fs');
var util = require('util');
var google = require('googleapis');

const { removeEmptyParameters } = require('./removeEmptyParameters');
const { createResource } = require('./createResource');

var deleteVideo = (auth, videoId) => {
	var requestData = {
		'params': {
			'id': videoId
		}
	};
	var service = google.youtube('v3');
	var parameters = removeEmptyParameters(requestData['params']);
	parameters['auth'] = auth;
	service.videos.delete(parameters, function (err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
	}); 
};

var getThumbnail = (auth, requestData, callback) => {
	var service = google.youtube('v3');
	var parameters = removeEmptyParameters(requestData['params']);
	parameters['auth'] = auth;
	service.videos.list(parameters, callback);
}

module.exports = { 
	deleteVideo,
	getThumbnail 
};