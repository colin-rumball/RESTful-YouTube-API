const fse = require('fs-extra');
const moment = require('moment');

class Config {
	constructor() {
		this.config = require("./config.json");
	}

	isServiceEnabled(service) { // TODO: create a way where srvice isn't a string
		return this.config.services[service].enabled;
	}

	getServices() {
		return this.config.services;
	}

	getEnabledServices() {
		var enabledServices = [];
		var services = this.config.services;
		for (var service in services) {
			if (services[service].enabled) {
				enabledServices.push(services[service]);
			}
		}
		return enabledServices;
	}

	updateEnabledServices(services) {
		for (var service in services) {
			services[service].name = service[0].toUpperCase() + service.substr(1);
			services[service].enabled = services[service].enabled === 'true' ? true : false;
		}
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