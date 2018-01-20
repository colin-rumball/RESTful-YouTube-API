var fse = require('fs-extra');

const {Uploads} = require('./utils/uploads');
const {authenticate} = require('./utils/authenticate');
const {uploadVideo} = require('./utils/uploader');


var clientSecret;
var uploads = new Uploads();

// Load client secrets from a local file.
fse.readJson('server/client_secret.json').then((content) => {
    clientSecret = content;
    uploadVideoToYouTube({
        'params': { 'part': 'snippet,status' }, 'properties': {
            'snippet.categoryId': '22',
            'snippet.defaultLanguage': '',
            'snippet.description': 'Description of uploaded video.',
            'snippet.tags[]': '',
            'snippet.title': 'Test video upload 2',
            'status.embeddable': '',
            'status.license': '',
            'status.privacyStatus': 'private',
            'status.publicStatsViewable': ''
        }, 'mediaFilename': 'test.avi'
    });
}).catch((err) => {
    if (err) {
        console.error(err);
        return;
    }
});

var uploadVideoToYouTube = (requestData) => {
    // Authorize a client with the loaded credentials, then call the YouTube API.
    authenticate(clientSecret).then((oauth2Client) => {
        setInterval(function() {
            uploads.uploads.forEach((upload) => {
                console.log(upload.id, upload.req.req.connection._bytesDispatched / 1000);
            });
        }, 2000);
        var newReq = uploadVideo(oauth2Client, requestData);
        if (newReq) {
            uploads.addUpload(requestData.mediaFilename, newReq);
        }
    }).catch((err) => {
        // authentication failed
        console.log('authentication failed');
    });
};