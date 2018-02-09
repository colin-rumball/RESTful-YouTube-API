const fse = require('fs-extra');
const moment = require('moment');

class Logger {
	constructor() {
		this.logs = require('./../../logs/logs.json');
		this.errors = require('./../../logs/errors.json');
	}

	logRequest(req) {
		var newEntry = {
			method: req.method,
			url: req.url,
			body: req.body,
			time: moment().format('YYYY-MM-DD | hh:mm:ss A')
		};

		if (this.logs.logs.length > 200) {
			this.logs.logs.shift();
		}

		this.logs.logs.push(newEntry);
		var logDir = __dirname + '/../../logs/logs.json';
		fse.writeJson(logDir, this.logs);
	}

	getLogs() {
		return this.logs.logs;
	}

	logError(err) {
		console.error(err);

		var newError = {
			message: err.message,
			stack: err.stack,
			time: moment().format('YYYY-MM-DD | hh:mm:ss A')
		};

		this.errors.newErrors.push(newError);

		var errorDir = __dirname + '/../../logs/errors.json';
		fse.writeJson(errorDir, this.errors);
	}

	pushNewErrorsToOld() {
		for (let i = 0; i < this.errors.newErrors.length; i++) {
			this.errors.oldErrors.push(this.errors.newErrors[i]);
		}
		this.errors.newErrors = [];
		var errorDir = __dirname + '/../../logs/errors.json';
		fse.writeJson(errorDir, this.errors);
	}

	getOldErrors() {
		return this.errors.oldErrors;
	}

	getNewErrors() {
		return this.errors.newErrors;
	}
}

module.exports = {
	Logger
};