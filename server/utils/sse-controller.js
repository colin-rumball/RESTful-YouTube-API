const _ = require('lodash');
const UploadsController = require('./UploadsController');

var currentConnections = [];
var StreamRunning = false;
var intervalID;

module.exports.StreamToClient = async function (res) {
	res.sseSetup();
	currentConnections.push(res);
	if (!StreamRunning) {
		StartStream();
	}
}

var StartStream = async function() {
	if (!StreamRunning) {
		StreamRunning = true;
		intervalID = setInterval(async function() {
			try {
				await SendUploadsToConnections();

				if (currentConnections.length <= 0) {
					throw new Error("No connections remain");
				}
			} catch(err) {
				clearInterval(intervalID);
				StreamRunning = false;
			}
		}, 350);
		SendUploadsToConnections();
	}
}

var SendUploadsToConnections = async function()
{
	var uploadsToSend = UploadsController.toJSON();
	currentConnections.forEach(connection => {
		var success = connection.sseSend(uploadsToSend);
		if (!success) {
			_.pull(currentConnections, connection);
		}
	});
}