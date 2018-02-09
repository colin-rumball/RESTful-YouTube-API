const fse = require('fs-extra');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const uniqid = require('uniqid');
const prettyBytes = require('pretty-bytes');
const favicon = require('serve-favicon')
const path = require('path')

const {startUpload} = require('./utils/uploader');

// Classes
const {Uploads} = require('./utils/uploads');
const {Config} = require('./config/config');
const {TokenManager} = require('./utils/TokenManager');
const {Logger} = require('./utils/Logger');

var app = express();
var uploads = new Uploads();
var config = new Config();
var tokenManager = new TokenManager(config.getCurrentToken());
var logger = new Logger();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(__dirname + '/../public'));
app.use(favicon(path.join(__dirname, 'favicon', 'favicon.ico')));
app.set('view engine', 'ejs');

// Logging
app.use((req, res, next) => {
	if (config.isServiceEnabled('logging')) {
		logger.logRequest(req)
	}

	next();
});

// ----------------------------------------------------------------------------
// ------ GET

app.get('/', (req, res) => {
	res.render('pages/home', { footer: createFooterObject() });
});

app.get('/dashboard', (req, res) => {
	var dbObj = {
		services: {
			uploading: config.isServiceEnabled('uploading') ? 'checked' : '',
			deleting: config.isServiceEnabled('deleting') ? 'checked' : '',
			editing: config.isServiceEnabled('editing') ? 'checked' : '',
			playlists: config.isServiceEnabled('playlists') ? 'checked' : '',
			thumbnails: config.isServiceEnabled('thumbnails') ? 'checked' : '',
			logging: config.isServiceEnabled('logging') ? 'checked' : ''
		},
		tokens: config.getTokens(),
		config: config.toString(),
		footer: createFooterObject()
	};
	res.render('pages/dashboard', dbObj);
});

app.get('/addToken', (req, res) => {
	fse.readJson('server/client_secret/client_secret.json').then((clientSecret) => {
		tokenManager.generateNewOAuth2Client(clientSecret);
		var url = tokenManager.generateTokenUrl();
		res.render('pages/addToken', {
			url,
			footer: createFooterObject()
		})
	});
});

app.get('/errors', (req, res) => {
	logger.pushNewErrorsToOld();
	res.render('pages/errors', {
		errors: logger.getOldErrors(),
		footer: createFooterObject()
	});
});

app.get('/logs', (req, res) => {
	res.render('pages/logs', {
		logs: logger.getLogs(),
		footer: createFooterObject()
	});
});

app.get('/uploads', (req, res) => {
	res.render('pages/uploads', {
		uploads: uploads.toJSON(),
		footer: createFooterObject()
	});
});

app.get('/shutdown', (req, res) => {
	res.render('pages/shutdown', { footer: createFooterObject() });
	setTimeout(() => {
		process.exit();
	}, 3000);
});

// ------ GET.json

app.get('/config.json', (req, res) => {
	res.send(config.toJSON());
});

app.get('/uploads.json', (req, res) => {
	res.send(uploads.toJSON());
});

// ------ POST

app.post('/services', (req, res) => {
	config.updateEnabledServices(req.body);
	res.sendStatus(200);
});

app.post('/tokens', (req, res) => {
	tokenManager.createNewToken(config, req.body)
	res.sendStatus(200);
});

app.post('/uploads', (req, res) => {
	if (config.isServiceEnabled('uploading')) {
		uploadVideo(req.body);
		res.sendStatus(200);
	} else {
		res.sendStatus(503);
		logger.logError(new Error('Upload attempt while service is offline'));
	}
});

app.post('/ClientSecret', (req, res) => {
	let newClientSecret = {
		installed: req.body.installed
	};

	let clientSecretDir = __dirname + '/client_secret';
	fse.writeJson(clientSecretDir + '/client_secret.json', newClientSecret).then(() => {
		res.sendStatus(200);
	}).catch((e) => {
		logger.logError(e);
		res.sendStatus(500);
	});
});

// ------ LISTENER

app.listen(3000, (err) => {
	console.log('Running server on port 3000');
});

var uploadVideo = async (params) => {
	try {
		const exists = await fse.pathExists(__dirname + '/../' + params.mediaFilename);

		if (exists) {
			const filesize = await fse.statSync(params.mediaFilename).size;
			var clientSecret = await fse.readJson('server/client_secret/client_secret.json');
			var uploadReq = await startUpload(tokenManager.getAuthClient(clientSecret), params);
			uploads.addUpload(uniqid(), params.mediaFilename, filesize, uploadReq);
		}
	} catch(e) {
		logger.logError(e);
	}
};

var createFooterObject = function () {
	return {
		services: config.getEnabledServices().length,
		errors: logger.getNewErrors().length,
		version: config.getVersion()
	};
};

var req = {
	req: {
		connection: {
			_bytesDispatched: 1
		}
	}
};

uploads.addUpload(uniqid(), 'test.avi', 100, req);
uploads.addUpload(uniqid(), 'test.avi', 100, req);
uploads.addUpload(uniqid(), 'test.avi', 100, req);

setInterval(() => {
	for (let i = 0; i < uploads.uploads.length; i++) {
		uploads.uploads[i].req.req.connection._bytesDispatched += 1;
		if (uploads.uploads[i].req.req.connection._bytesDispatched > 100) {
			uploads.uploads[i].req.req.connection._bytesDispatched = 0;
		}
	};
}, 500);