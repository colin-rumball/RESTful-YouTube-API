const prettyBytes = require('pretty-bytes');

class Uploads {
    constructor() {
        this.uploads = [];
    }

	addUpload(uid, filename, fileSize, req) {
        var upload = {
			uid,
			filename, 
			fileSize,
			req 
		};
        this.uploads.push(upload);
        return upload;
	}

	getUpload(uid) {
		var upload = this.uploads.find((upload) => upload.uid == uid);
		return upload;
	}

	GetUploadProgress(uid) {
		var upload = this.getUpload(uid);
		if (upload) {
			var progress = 0;
			if (upload.req.req && upload.req.req.connection) {
				progress = Math.round(100 * (upload.req.req.connection._bytesDispatched / upload.fileSize));
				progress = progress <= 100 ? progress : 100;
			}
			return progress;
		}
		return 0;
	}

	GetUploadStatus(uid) {
		var upload = this.getUpload(uid);
		if (upload) {
			var status = 'preparing';
			if (upload.req.req && upload.req.req.connection) {
				status = 'uploading';
			}
			return status;
		}
		return 'unknown';
	}

	toJSON() {
		var uploadObjs = [];
		this.uploads.forEach((upload) => {
			var uploadObj = {
				uid: upload.uid,
				status: this.GetUploadStatus(upload.uid),
				filename: upload.filename,
				fileSize: prettyBytes(upload.fileSize),
				progress: this.GetUploadProgress(upload.uid)
			}
			uploadObjs.push(uploadObj);
		});
		return uploadObjs;
	}

    // removeUpload(id) {
    //     var user = this.getUser(id);

    //     if (user) {
    //         this.users = this.users.filter((user) => user.id !== id);
    //     }

    //     return user;
    // }

    // getUser(id) {
    //     var user = this.users.find((user) => user.id == id);
    //     return user;
    // }

    // getUserList(room) {
    //     var roomUsers = this.users.filter((user) => user.room === room);
    //     var namesArray = roomUsers.map((user) => user.name);
    //     return namesArray;
    // }
}

module.exports = { Uploads };