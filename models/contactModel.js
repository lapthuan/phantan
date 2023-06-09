const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Contact Schema
const ContactSchema = new Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String
  },
  message: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Contact', ContactSchema);
