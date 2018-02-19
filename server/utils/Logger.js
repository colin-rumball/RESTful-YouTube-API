const fse = require('fs-extra');
const moment = require('moment');
const uniqid = require('uniqid');
const path = require('path');

const pathToLogsDir = path.join(__dirname, '..', '..', 'logs');
const logsFilename = 'logs.json';
const defaultLogsFilename = 'logs.default.json';

class Logger {
	constructor() {
		// Load logs from file
		this.tryLoadLogsJson();
	}

	tryLoadLogsJson() {
		let pathToJson = path.join(pathToLogsDir, logsFilename);
		try {
			this.logsObject = fse.readJsonSync(pathToJson);
		} catch(e) {
			this.logsObject = this.loadDefaultJson(pathToJson);
			storeLogsObject_sync(this.logsObject);
			this.logError(new Error('Failed to load log file. Loaded logs from default.'));
		}
	}

	loadDefaultJson(pathToJson) {
		let newFilename = `logs-failure-${uniqid()}.json`;
		let pathToNewFile = path.join(pathToLogsDir, 'failures', newFilename);
		fse.copySync(pathToJson, pathToNewFile);
		let pathToDefault = path.join(pathToLogsDir, defaultLogsFilename);
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

		while (this.logsObject.logs.length > 200) {
			this.logsObject.logs.shift();
		}

		this.logsObject.logs.push(newEntry);
		storeLogsObject(this.logsObject);
	}

	getLogs() {
		return this.logsObject.logs;
	}

	logError(err) {
		console.error(err);

		var newError = {
			message: err.message,
			stack: err.stack,
			date: moment().format('YYYY-MM-DD'),
			time: moment().format('hh:mm:ss A')
		};

		this.logsObject.newErrors.push(newError);
		storeLogsObject(this.logsObject);
	}

	deleteLogs() {
		this.logsObject.logs = [];
		storeLogsObject_sync(this.logsObject);
	}

	pushNewErrorsToOld() {
		for (let i = 0; i < this.logsObject.newErrors.length; i++) {
			this.logsObject.oldErrors.push(this.logsObject.newErrors[i]);
		}
		this.logsObject.newErrors = [];
		storeLogsObject_sync(this.logsObject);
	}

	getOldErrors() {
		return this.logsObject.oldErrors;
	}

	getNewErrors() {
		return this.logsObject.newErrors;
	}

	deleteErrors() {
		this.logsObject.oldErrors = [];
		this.logsObject.newErrors = [];
		storeLogsObject_sync(this.logsObject);
	}
}

var storeLogsObject = (logsToSave) => {
	fse.writeJson(path.join(pathToLogsDir, logsFilename), logsToSave);
};

var storeLogsObject_sync = (logsToSave) => {
	fse.writeJsonSync(path.join(pathToLogsDir, logsFilename), logsToSave);
};

module.exports = {
	Logger
};