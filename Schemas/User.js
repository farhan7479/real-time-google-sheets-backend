const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    pass: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        code: {
            type: String,
            default: null
        },
        expirationTime: {
            type: Date,
            default: null
        }
    }
});

module.exports = mongoose.model('user', userSchema);
