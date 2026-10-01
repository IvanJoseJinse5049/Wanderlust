const Listing = require("../models/listing");
const Review = require("../models/reviews");
const ExpressError = require("../utils/ExpressError");
const { cloudinary } = require("../cloudConfig");

const filterCategories = [
  { value: "beach", label: "Beach", icon: "fa-umbrella-beach" },
  { value: "mountains", label: "Mountains", icon: "fa-mountain" },
  { value: "city", label: "City", icon: "fa-city" },
  { value: "cabins", label: "Cabins", icon: "fa-house-chimney" },
  { value: "historic", label: "Historic", icon: "fa-landmark" },
  { value: "nature", label: "Nature", icon: "fa-tree" },
];

module.exports.index = async (req, res) => {
  const searchQuery = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const activeCategory = typeof req.query.category === "string" ? req.query.category : "";
  const category = filterCategories.find(({ value }) => value === activeCategory);
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", {
    allListings,
    filterCategories,
    searchQuery,
    activeCategory: category ? category.value : "",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate("owner")
    .populate({ path: "reviews", populate: { path: "author" } });

  if (!listing) throw new ExpressError(404, "Listing Not Found");

  res.render("listings/show.ejs", { listing, mapToken: process.env.MAP_TOKEN });
};

module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.image = {
    filename: req.file.filename,
    url: req.file.path,
  };
  newListing.owner = req.user._id;
  await newListing.save();
  req.flash("success", "Successfully created a new listing!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ExpressError(404, "Listing Not Found");

  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) throw new ExpressError(400, "Invalid Listing Data");

  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ExpressError(404, "Listing Not Found");

  const update = { ...req.body.listing };
  const previousImage = listing.image;
  if (req.file) {
    update.image = {
      filename: req.file.filename,
      url: req.file.path,
    };
  }

  const updatedListing = await Listing.findByIdAndUpdate(req.params.id, update, {
    runValidators: true,
    new: true,
  });
  if (req.file && previousImage?.filename) {
    await cloudinary.uploader.destroy(previousImage.filename);
  }

  req.flash("success", "Successfully updated the listing!");
  res.redirect(`/listings/${updatedListing._id}`);
};

module.exports.destroyListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ExpressError(404, "Listing Not Found");

  await Review.deleteMany({ _id: { $in: listing.reviews } });
  await listing.deleteOne();

  req.flash("success", "Successfully deleted the listing!");
  res.redirect("/listings");
};
