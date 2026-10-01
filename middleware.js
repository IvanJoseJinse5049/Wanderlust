const Listing = require("./models/listing");
const Review = require("./models/reviews");
const { listingSchema, reviewSchema } = require("./schema");
const ExpressError = require("./utils/ExpressError");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    const message = req.method === "DELETE"
      ? "You must be logged in to delete a listing."
      : "You must be signed in to do that.";
    req.flash("error", message);
    return res.redirect("/login");
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

module.exports.validateListing = (req, res, next) => {
  if (req.method === "POST" && !req.file) {
    req.flash("error", "An image is required for a new listing.");
    return res.redirect("/listings/new");
  }

  const result = listingSchema.validate(req.body);

  if (result.error) {
    const msg = result.error.details.map((el) => el.message).join(", ");
    req.flash("error", msg);
    return res.redirect("/listings/new");
  }

  next();
};

module.exports.validateReview = (req, res, next) => {
  const result = reviewSchema.validate(req.body);
  if (result.error) {
    const msg = result.error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found.");
    return res.redirect(`/listings/${req.params.id}`);
  }

  if (!review.author || !review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to delete this review.");
    return res.redirect(`/listings/${req.params.id}`);
  }

  next();
};
