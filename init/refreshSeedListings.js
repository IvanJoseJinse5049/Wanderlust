const mongoose = require("mongoose");
const Listing = require("../models/listing");
const { data: seedListings } = require("./data");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function refreshSeedListings() {
  await mongoose.connect(MONGO_URL);

  const operations = seedListings.map(({ title, category, image }) => ({
    updateOne: {
      filter: { title },
      update: { $set: { category, image } },
    },
  }));

  const result = await Listing.bulkWrite(operations, { ordered: false });
  console.log(`Updated ${result.modifiedCount} seeded listings.`);
}

refreshSeedListings()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
