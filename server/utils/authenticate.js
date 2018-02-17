var fse = require('fs-extra');
var googleAuth = require('google-auth-library');

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
var authenticate = async (authManager, credentials) => {
	var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
	var redirectUrl = credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	oauth2Client.credentials = authManager.tryGetCurrentToken().token;

    // Check if we have previously stored a token.
    return fse.readFile(TOKEN_PATH)
        .then((token) => {
            oauth2Client.credentials = JSON.parse(token);
            return oauth2Client;
        }, (err) => {
            return getNewToken(oauth2Client);
        })
        .then((thing) => {
            return thing;
        }).catch((err) => {
            console.log('Something wrong');
        });
}

module.exports = {authenticate};