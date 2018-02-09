var googleAuth = require('google-auth-library');
const fs = require('fs');
const fse = require('fs-extra');
var uniqid = require('uniqid');

var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
var TOKEN_DIR = __dirname + '/../tokens/';

class TokenManager {
	constructor(token) {
		this.oauth2Client;
		if (token) {
			this.currentToken = this.tryLoadToken(token.id+'.json');
		}
	}

	generateNewOAuth2Client(credentials) {
		var clientSecret = credentials.installed.client_secret;
		var clientId = credentials.installed.client_id;
		var redirectUrl = credentials.installed.redirect_uris[0];
		var auth = new googleAuth();
		this.oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
		return this.oauth2Client;
	}

	generateTokenUrl() {
		return this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES
		});
	}

	createNewToken(config, body) {
		this.oauth2Client.getToken(body.code, (err, token) => {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
				return;
			}
			this.oauth2Client.credentials = token;
			var tokenId = uniqid();
			this.storeToken(tokenId, token);
			config.addToken(tokenId, body.name, token);
			this.currentToken = token;
		});
	}

	storeToken(tokenId, token) {
		try {
			fs.mkdirSync(TOKEN_DIR);
		} catch (err) {
			if (err.code != 'EEXIST') {
				throw err;
			}
		}
		fs.writeFile(TOKEN_DIR+tokenId.toString()+'.json', JSON.stringify(token));
		console.log('Token stored to ' + TOKEN_DIR + tokenId.toString() + '.json');
	}

	tryLoadToken(file) {
		return fse.readJson(__dirname + '/../tokens/' + file).then((token) => {
			return token;
		});
	}

	getAuthClient(credentials) {
		if (this.oauth2Client && this.oauth2Client.credentials) {
			return this.oauth2Client;
		} else {
			this.generateNewOAuth2Client(credentials);
			if (this.currentToken) {
				this.oauth2Client.credentials = this.currentToken;
			}
			return this.oauth2Client;
		}
	}
}

module.exports = {
	TokenManager
}