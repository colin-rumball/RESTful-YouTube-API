class Uploads {
    constructor() {
        this.uploads = [];
    }

    addUpload(id, req) {
        var upload = { id, req };
        this.uploads.push(upload);
        return upload;
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