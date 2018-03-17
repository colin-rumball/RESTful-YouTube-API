const fse = require('fs-extra');
const express = require('express');
const bodyParser = require('body-parser');
const uniqid = require('uniqid');
const prettyBytes = require('pretty-bytes');
const favicon = require('serve-favicon');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');

var { mongoose } = require('./db/mongoose');

// Services
const {editVideo} = require('./utils/services');
const {getThumbnail} = require('./utils/services');
const {uploadVideo} = require('./utils/services');
const {deleteVideo} = require('./utils/services');

// Classes
const {Uploads} = require('./utils/uploads');
const {Config} = require('./config/config');
const {AuthManager} = require('./utils/AuthManager');
const {Logger} = require('./utils/Logger');

// Mongo Models
var { User } = require('./models/User');

var app = express();
var uploads = new Uploads();
var config = new Config();
var authManager = new AuthManager();
var logger = new Logger();

app.use(require('express-session')({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(__dirname + '/../public'));
app.use(favicon(path.join(__dirname, 'favicon', 'favicon.ico')));
app.set('views', __dirname + '/../views');
app.set('view engine', 'ejs');

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Logging middleware
app.use((req, res, next) => {
	if (config.isServiceEnabled('logging')) {
		logger.logRequest(req)
	}
	next();
});

// ----------------------------------------------------------------------------
// ------ GET

app.get('/', isLoggedIn, (req, res) => {
	res.render('pages/home', { footer: createFooterObject() });
});

app.get('/dashboard', isLoggedIn,(req, res) => {
	var dbObj = {
		services: config.getServices(),
		tokens: authManager.getAllTokens(),
		config: config.toString(),
		footer: createFooterObject()
	};
	res.render('pages/dashboard', dbObj);
});

app.get('/dashboard/token-url', isLoggedIn, (req, res) => {
	fse.readJson('client_secret/client_secret.json').then((clientSecret) => { // TODO
		authManager.generateNewOAuth2Client(clientSecret);
		var url = authManager.generateTokenUrl();
		res.send({url});
	});
});

app.get('/errors', isLoggedIn,(req, res) => {
	logger.pushNewErrorsToOld(); //TODO
	res.render('pages/errors', {
		errors: logger.getOldErrors(), // TODO
		footer: createFooterObject()
	});
});

app.get('/logs', isLoggedIn,(req, res) => {
	res.render('pages/logs', {
		logs: logger.getLogs(),
		footer: createFooterObject()
	});
});

app.get('/upload/local', isLoggedIn, (req, res) => { // TODO
	res.render('pages/upload-local', {footer: createFooterObject()});
});

app.get('/uploads', isLoggedIn, (req, res) => {
	res.render('pages/uploads', {
		uploads: uploads.toJSON(), // TODO
		footer: createFooterObject()
	});
});

app.get('/thumbnail/:id', checkAuthToken, (req, res) => {
	var videoId = req.params.id;
	if (config.isServiceEnabled('thumbnails')) {
		tryGetThumbnail(videoId, res); // TODO
	} else {
		res.sendStatus(503);
		logger.logError(new Error('Thumbnail req attempt while service is offline'));
	}
});

app.get('/sign-in', (req, res) => {
	res.render('pages/sign-in', { footer: createFooterObject() });
})

// ------ GET.json

app.get('/config.json', isLoggedIn,(req, res) => {
	res.send(config.toJSON());
});

app.get('/uploads.json', isLoggedIn, (req, res) => {
	res.send(uploads.toJSON());
});

// ------ POST

app.post('/dashboard/services', isLoggedIn, (req, res) => {
	config.updateEnabledServices(req.body);
	res.sendStatus(200);
});

app.post('/dashboard/tokens', isLoggedIn, (req, res) => {
	authManager.createNewToken(config, req.body)
	res.sendStatus(200);
});

app.post('/dashboard/client-secret', isLoggedIn, (req, res) => {
	let newClientSecret = {
		installed: req.body.installed
	};

	let clientSecretDir = __dirname + '/client_secret'; // TODO
	fse.writeJson(clientSecretDir + '/client_secret.json', newClientSecret).then(() => { // TODO
		res.sendStatus(200);
	}).catch((e) => {
		logger.logError(e);
		res.sendStatus(500);
	});
});

app.post('/uploads', checkAuthToken, (req, res) => {
	if (config.isServiceEnabled('uploading')) {
		tryUploadVideo(req.body.filename, req.body.callbackUrl);
		res.sendStatus(200);
	} else {
		res.sendStatus(503);
		logger.logError(new Error('Upload attempt while service is offline'));
	}
});

app.post('/shutdown', isLoggedIn, (req, res) => {
	var intervalId = setInterval(() => {
		if (!Logger.saving) {
			clearInterval(intervalId);
			process.exit();
		}
	}, 1000);
});

app.post('/sign-in', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/sign-in'
}), (req, res) => {

});

// ------ PATCH

app.patch('/videos', checkAuthToken, (req, res) => {
	if (config.isServiceEnabled('editing')) {
		tryEditVideo(req.body);
		res.sendStatus(200);
	} else {
		res.sendStatus(503);
		logger.logError(new Error('Edit attempt while service is offline'));
	}
});

app.patch('/dashboard/tokens/:id', isLoggedIn, (req, res) => {
	var tokenId = req.params.id;
	authManager.selectToken(tokenId);
	res.sendStatus(200);
});

// ------ DELETE

app.delete('/dashboard/tokens/:id', isLoggedIn, (req, res) => {
	var tokenId = req.params.id;
	authManager.deleteToken(tokenId);
	res.sendStatus(200);
});

app.delete('/logs', isLoggedIn, (req, res) => {
	logger.deleteLogs();
	res.sendStatus(200);
});

app.delete('/errors', isLoggedIn, (req, res) => {
	logger.deleteErrors();
	res.sendStatus(200);
});

app.delete('/video/:id', checkAuthToken, (req, res) => {
	var videoId = req.params.id;
	if (videoId && (isNumber(videoId) || isString(videoId))) {
		tryDeleteVideo(videoId, res);
	}
});

// ------ LISTENER
var port = process.env.PORT;
app.listen(port, (err) => {
	console.log(`Running server on port ${port}`);
});

// ------ SERVICE ATTEMPTS

var tryEditVideo = async (body) => {
	var params = { // TODO
		'params': { 'part': 'snippet,status' }, 'properties': {
			'id': body.videoId,
			'snippet.categoryId': '22',
			'snippet.description': body.description,
			'snippet.tags[]': body.tags,
			'snippet.title': body.title
		}
	};
	var clientSecret = await fse.readJson('client_secret/client_secret.json'); // TODO
	var authClient = await authManager.getAuthClient(clientSecret);
	editVideo(authClient, params);
}

var tryGetThumbnail = async (videoId, res) => { // TODO
	var params = { // TODO
	'params': {
		'id': videoId,
		'part': 'snippet,contentDetails,statistics'
	}};
	var clientSecret = await fse.readJson('client_secret/client_secret.json'); // TODO
	var authClient = await authManager.getAuthClient(clientSecret);
	getThumbnail(authClient, params, (err, response) => {
		if (err) {
			console.log('The API returned an error: ' + err); // TODO
			return;
		}
		res.send({ url: response.items[0].snippet.thumbnails.standard.url });
	});
};

var tryDeleteVideo = async (videoId, res) => {
	if (config.isServiceEnabled('deleting')) {
		var clientSecret = await fse.readJson('client_secret/client_secret.json'); // TODO
		var authClient = await authManager.getAuthClient(clientSecret);
		deleteVideo(authClient, videoId);
	} else {
		res.sendStatus(503);
		logger.logError(new Error('Delete attempt while service is offline'));
	}
};

var tryUploadVideo = async (filename, callbackUrl) => {
	try {
		let pathToFile = path.join(process.env.PATH_TO_CLIPS, 'uploading', filename);
		const exists = await fse.pathExists(pathToFile);

		if (exists) {
			var params = { // TODO
				'params': { 'part': 'snippet,status' }, 'properties': {
					'snippet.categoryId': '22',
					'snippet.description': filename,
					'snippet.title': filename,
					'status.privacyStatus': 'unlisted',
				}, 'mediaFilename': pathToFile
			};
			const filesize = await fse.statSync(pathToFile).size;
			var clientSecret = await fse.readJson('client_secret/client_secret.json');
			var authClient = await authManager.getAuthClient(clientSecret);
			var uId = uniqid();
			var uploadReq = await uploadVideo(authClient, params, function (youtubeId) {
				uploads.onUploadComplete(uId, youtubeId);
			});
			uploads.addUpload(uId, filename, filesize, uploadReq, callbackUrl);
		} else {
			throw new Error(`File (${filename}) does not exist for upload.`);
		}
	} catch(e) {
		logger.logError(e);
	}
};

// ------ OTHER STUFF

var createFooterObject = function () {
	return {
		services: config.getEnabledServices().length,
		errors: logger.getNewErrors().length,
		version: config.getVersion()
	};
};

function isString(value) {
	return typeof value === 'string' || value instanceof String;
};

function isNumber(value) {
	return typeof value === 'number' && isFinite(value);
};

function checkAuthToken(req, res, next) {
	if (req.headers['x-auth'] === process.env.MASTER_AUTH_TOKEN || req.isAuthenticated()) {
		return next();
	}
	req.sendStatus(401);
}

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.returnTo = req.url;
	res.redirect('/sign-in');
};