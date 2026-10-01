const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    filename: {
        type: String,
        default: "listingimage",
    },
    url: {
        type: String,
        default: "https://thumbs.dreamstime.com/b/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available-236105299.jpg",
    },
  },  
  price: Number,
  location: String,
  country: String,
  category: {
    type: String,
    enum: ["beach", "mountains", "city", "cabins", "historic", "nature"],
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
}); 

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
