const Listing = require("../models/listing");
const Review = require("../models/reviews");
const ExpressError = require("../utils/ExpressError");

module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ExpressError(404, "Listing Not Found");

  const review = new Review(req.body.review);
  review.author = req.user._id;
  await review.save();

  listing.reviews.push(review);
  await listing.save();

  req.flash("success", "Successfully added your review!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) throw new ExpressError(404, "Listing Not Found");

  const belongsToListing = listing.reviews.some(
    (review) => review.toString() === reviewId
  );
  if (!belongsToListing) {
    throw new ExpressError(404, "Review Not Found for this Listing");
  }

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Successfully deleted the review!");
  res.redirect(`/listings/${id}`);
};
