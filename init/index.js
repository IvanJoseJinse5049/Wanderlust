const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
    return initDB();
  })
  .then(() => {
    console.log("data was initialized");
    mongoose.connection.close();
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data=initData.data.map((listing) => {
    listing.owner = "64a0f1e3c5b8f7d2e4a1b2c3"; // Replace with the actual user ID
    return listing;
  });
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

