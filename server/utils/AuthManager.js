var googleAuth = require('google-auth-library');
const fse = require('fs-extra');
var uniqid = require('uniqid');
const request = require('request-promise-native');
const moment = require('moment');
const _ = require('lodash');

var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
var TOKEN_DIR = __dirname + '/../tokens/';

class AuthManager {
	constructor() {
		this.oauth2Client;
		this.tokensJson = require("./../tokens/tokens.json");
		
		for (let i = 0; i < this.tokensJson.tokens; i++) {
			if (this.tokensJson.tokens[i].current) {
				this.currentTokenId = this.tokensJson.tokens[i].id;
				break;
			}
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

	async getAuthClient(clientSecret) {
		if (this.oauth2Client && this.oauth2Client.credentials) {
			return this.oauth2Client;
		} else {
			this.generateNewOAuth2Client(clientSecret);
			let currentToken = this.tryGetCurrentToken();
			let currentTime = moment().valueOf();
			if (currentToken.token.expiry_date < currentTime) {
				await this.refreshToken(currentToken.token);
			}
			if (currentToken) {
				this.oauth2Client.credentials = currentToken.token;
			} else {
				// no current token!!
			}
			return this.oauth2Client;
		}
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
			this.storeToken(tokenId, body.name, token);
		});
	}

	refreshToken(token) {
		return request.post({
			url: 'https://www.googleapis.com/oauth2/v4/token',
			form: {
				client_id: '257951428918-mtv9silb3ar8jvrv35nnvbd02emgcvd4.apps.googleusercontent.com', 
				client_secret: 'ZG4gTOw4ehF416WJbNLdKGfq', 
				refresh_token: token.refresh_token,
				grant_type: 'refresh_token'
			}}).then((res) => {
				res = JSON.parse(res);
				token.access_token = res.access_token;
				token.expiry_date = moment().valueOf() + res.expires_in;
				saveTokensToFile(this.tokensJson);
			}).catch((err) => {
				console.error(err);
			});
	}

	deleteToken(id) {
		_.remove(this.tokensJson.tokens, (token) => token.id === id);
	}

	selectToken(id) {
		for (let i = 0; i < this.tokensJson.tokens.length; i++) {
			this.tokensJson.tokens[i].current = false;
		}
		var selectedToken = this.tokensJson.tokens.find((token) => token.id === id);
		if (selectedToken) {
			selectedToken.current = true;
		}
		saveTokensToFile(this.tokensJson);
	}

	storeToken(id, name, token) {
		let tokenObj = {
			id,
			name,
			current: this.tokensJson.tokens.length > 0 ? false : true,
			token
		}
		this.tokensJson.tokens.push(tokenObj);
		saveTokensToFile(this.tokensJson);
	}

	getAllTokens() {
		return this.tokensJson.tokens;
	}

	tryGetCurrentToken() {
		return this.tokensJson.tokens.find((token) => token.current === true);
	}
}

function saveTokensToFile(tokensToSave) {
	fse.writeJson(TOKEN_DIR + 'tokens.json', tokensToSave);
}

module.exports = {
	AuthManager
}