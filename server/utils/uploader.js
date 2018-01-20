var fse = require('fs-extra');
var util = require('util');
var google = require('googleapis');

const {removeEmptyParameters} = require('./removeEmptyParameters');
const {createResource} = require('./createResource');

function uploadVideo(auth, requestData) {
    var service = google.youtube('v3');
    var parameters = removeEmptyParameters(requestData['params']);
    parameters['auth'] = auth;
    parameters['media'] = { body: fse.createReadStream(requestData['mediaFilename']) };
    parameters['notifySubscribers'] = false;
    parameters['resource'] = createResource(requestData['properties']);
    var req = service.videos.insert(parameters);

    return req;

    var fileSize = fse.statSync(requestData['mediaFilename']).size;
    console.log('FILE SIzE', fileSize);
    // show some progress
    // var id = setInterval(function () {
    //     var uploadedBytes = req.req.connection._bytesDispatched;
    //     var uploadedMBytes = uploadedBytes / 1000000;
    //     var progress = uploadedBytes > fileSize
    //         ? 100 : (uploadedBytes / fileSize) * 100;
    //     process.stdout.clearLine();
    //     process.stdout.cursorTo(0);
    //     process.stdout.write(uploadedMBytes.toFixed(2) + ' MBs uploaded. ' +
    //         progress.toFixed(2) + '% completed.');
    //     if (progress === 100) {
    //         process.stdout.write('Done uploading, waiting for response...');
    //         clearInterval(id);
    //     }
    // }, 250);
}

module.exports = {uploadVideo};