const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var reviewSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  rate: {
    type: Number,
  },
  iduser: {
    type: Number,
    required: true,
  },
  idproduct: {
    type: Number,
    required: true,
  },
});

//Export the model
module.exports = mongoose.model("Review", reviewSchema);
