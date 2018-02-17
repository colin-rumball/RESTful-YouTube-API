const fse = require('fs-extra');
const moment = require('moment');

class Config {
	constructor() {
		this.config = require("./config.json");
	}

	isServiceEnabled(service) {
		var enabled = this.config.services[service].enabled;
		return (enabled == "true");
	}

	getEnabledServices() {
		var enabledServices = [];
		var services = this.config.services;
		for (var service in services) {
			if (services[service].enabled == 'true') {
				enabledServices.push(service);
			}
		}
		return enabledServices;
	}

	updateEnabledServices(services) {
		this.config.services = services;
		storeConfig(this.config);
	}

	toJSON() {
		return this.config;
	}

	toString() {
		return JSON.stringify(this.config, undefined, 2).trim();
	}

	getVersion() {
		return this.config.version;
	}
}

var storeConfig = (configToSave) => {
	configToSave.date = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
	fse.writeJson(__dirname + '/config.json', configToSave);
};

module.exports = {
	Config
}