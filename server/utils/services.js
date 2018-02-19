var fs = require('fs');
var util = require('util');
var google = require('googleapis');

const { removeEmptyParameters } = require('./removeEmptyParameters');
const { createResource } = require('./createResource');

var editVideo = (auth, requestData) => {
	var service = google.youtube('v3');
	var parameters = removeEmptyParameters(requestData['params']);
	parameters['auth'] = auth;
	parameters['resource'] = createResource(requestData['properties']);
	service.videos.update(parameters, function (err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
	});
};

var uploadVideo = (auth, requestData, callback) => {
	var service = google.youtube('v3');
	var parameters = removeEmptyParameters(requestData['params']);
	parameters['auth'] = auth;
	parameters['media'] = { body: fs.createReadStream(requestData['mediaFilename']) };
	parameters['notifySubscribers'] = false;
	parameters['resource'] = createResource(requestData['properties']);
	var req = service.videos.insert(parameters, function (err, data) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
		callback(data.id);
	});
	return req;
};

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
};

module.exports = {
	editVideo,
	uploadVideo,
	deleteVideo,
	getThumbnail 
};