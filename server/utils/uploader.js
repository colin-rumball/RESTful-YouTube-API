var fs = require('fs');
var util = require('util');
var google = require('googleapis');

const {removeEmptyParameters} = require('./removeEmptyParameters');
const {createResource} = require('./createResource');

var startUpload = (auth, requestData) => {
    var service = google.youtube('v3');
    var parameters = removeEmptyParameters(requestData['params']);
    parameters['auth'] = auth;
	parameters['media'] = { body: fs.createReadStream(requestData['mediaFilename']) };
	parameters['notifySubscribers'] = false;
	parameters['resource'] = createResource(requestData['properties']);
	var req = service.videos.insert(parameters, function (err, data) {
		if (err) {
			console.log('The API returned an error: ' + err);
		}
	});
	return req;
}

module.exports = {startUpload};