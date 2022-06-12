const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
    name: String,
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    invitees: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Event", EventSchema);
