const fse = require('fs-extra');
const moment = require('moment');
const uniqid = require('uniqid');
const path = require('path');

const pathToDir = path.join(__dirname, '..', '..', 'logs');

class Logger {
	constructor() {
		// ERRORS
		this.errors = this.tryLoadJson('errors', storeErrors);
		// LOGS
		this.logs = this.tryLoadJson('logs', storeLogs);
	}

	tryLoadJson(name, saveFunc) {
		let pathToJson = path.join(pathToDir, `${name}.json`);
		var retJson;
		try {
			retJson = fse.readJsonSync(pathToJson);
		} catch(e) {
			retJson = this.loadDefaultJson(pathToJson, name);
		}
		saveFunc(retJson);
		return retJson;
	}

	loadDefaultJson(pathToJson, name) {
		let newFilename = `${name}-failure-${uniqid()}.json`;
		let pathToNewFile = path.join(pathToDir, 'failures', newFilename);
		fse.copySync(pathToJson, pathToNewFile);
		let pathToDefault = path.join(pathToDir, `${name}.default.json`)
		let defaultJson = fse.readJsonSync(pathToDefault);
		return defaultJson;
	}

	logRequest(req) {
		var newEntry = {
			method: req.method,
			url: req.url,
			body: req.body,
			date: moment().format('YYYY-MM-DD'),
			time: moment().format('hh:mm:ss A')
		};

		while (this.logs.logs.length > 200) {
			this.logs.logs.shift();
		}

		this.logs.logs.push(newEntry);
		storeLogs(this.logs);
	}

	getLogs() {
		return this.logs.logs;
	}

	logError(err) {
		console.error(err);

		var newError = {
			message: err.message,
			stack: err.stack,
			date: moment().format('YYYY-MM-DD'),
			time: moment().format('hh:mm:ss A')
		};

		this.errors.newErrors.push(newError);
		storeErrors(this.errors);
	}

	deleteLogs() {
		this.logs.logs = [];
		storeLogs(this.logs);
	}

	pushNewErrorsToOld() {
		for (let i = 0; i < this.errors.newErrors.length; i++) {
			this.errors.oldErrors.push(this.errors.newErrors[i]);
		}
		this.errors.newErrors = [];
		storeErrors(this.errors);
	}

	getOldErrors() {
		return this.errors.oldErrors;
	}

	getNewErrors() {
		return this.errors.newErrors;
	}

	deleteErrors() {
		this.errors.oldErrors = [];
		this.errors.newErrors = [];
		storeErrors(this.errors);
	}
}

var storeLogs = (logsToSave) => {
	fse.writeJsonSync(path.join(pathToDir, 'logs.json'), logsToSave);
};

var storeErrors = (errorsToSave) => {
	fse.writeJsonSync(path.join(pathToDir, 'errors.json'), errorsToSave);
};

module.exports = {
	Logger
};