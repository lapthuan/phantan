const mongoose = require("mongoose"); // Erase if already required
const { CART_ITEM_STATUS } = require("../constants");
// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        qty: Number,
      },
    ],
    paymentIntent: {},
    shippingMethor: {},
    orderStatus: {
      type: String,
      default: CART_ITEM_STATUS.Processing,
      enum: [
        CART_ITEM_STATUS.Processing,
        CART_ITEM_STATUS.Shipped,
        CART_ITEM_STATUS.Delivered,
        CART_ITEM_STATUS.Cancelled,
        CART_ITEM_STATUS.Not_processed,
      ],
    },
    totalPrice: {
      type: Number,
    },
    orderby: {
      type: mongoose.Schema.Types.ObjectId,
    },
    nameUserOrder: {
      type: String,
    },
    messageCancel: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
