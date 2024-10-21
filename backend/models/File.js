const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    fileType: {
        type: String, // "image" or "video"
        required: true
    },
    tags: {
        type: [String], // Array of tags
        default: []
    },
    views: {
        type: Number,
        default: 0 // Track number of views
    },
    url: {
        type: String, // URL to the stored file
        required: true
    },
    sharedLinks: {
        type: [String], // Unique identifiers for shareable links
        default: [] // Initialize with an empty array
    },
    clickTrack: [
        {
            clickedByIP: String,
            clickedAt: {
                type: Date,
                default: Date.now
            }
        }
    ], // Store IPs and timestamps of who accessed the file
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', fileSchema);


