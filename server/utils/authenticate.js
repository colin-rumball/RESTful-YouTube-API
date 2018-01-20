var fse = require('fs-extra');
var readline = require('readline');
var util = require('util');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
var TOKEN_DIR = __dirname + '/../tokens';
var TOKEN_PATH = TOKEN_DIR + '/youtube-api-token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
function authenticate(credentials) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

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

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 */
function getNewToken(oauth2Client) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oauth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    reject();
                }
                oauth2Client.credentials = token;
                storeToken(token);
                resolve(oauth2Client);
            });
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    fse.ensureDir(TOKEN_DIR).then(() => {
        fse.writeJSON(TOKEN_PATH, token).then(() => {
            console.log('Token stored to ' + TOKEN_PATH);
        }).catch(err => {
            console.error('Could not write to token file', err);
        });
        
    }).catch((err) => {
        if (err.code != 'EEXIST') {
            throw err;
        }
    });
}

module.exports = {authenticate};