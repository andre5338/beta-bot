const mongoose = require('mongoose');

const allowedServerSchema = new mongoose.Schema({

    guildId: { type: String, required: true }

});

module.exports = mongoose.model('AllowedServers', allowedServerSchema);
