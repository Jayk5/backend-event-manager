const mongoose = require("mongoose");
const passpportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        require: true,
        unique: true,
    },
    invitedTo: [{ type: Schema.Types.ObjectId, ref: "Event" }],
});
UserSchema.plugin(passpportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
