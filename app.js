// ==================== IMPORTS ====================
const express=require('express');
const app=express();
const mongoose=require('mongoose');
const Listing=require('./models/listing');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema"); 
const Review = require("./models/reviews");

// ==================== DATABASE CONNECTION ====================
// Connect to MongoDB first, then start the Express server.
app.use(express.static(path.join(__dirname, "public")));
main()
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(8080, () => {
      console.log("Server is running on port 8080");
    });
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

// ==================== APP CONFIGURATION & MIDDLEWARE ====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

// ==================== ROUTES ====================

// ---------- Home Route ----------
app.get('/',(req,res)=>{
    res.send("Hi i am root");
});

// ---------- Listing Routes ----------
app.get("/listings", wrapAsync(async (req, res, next) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
    
}));

// Show form for creating a new listing
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Show a single listing with its reviews
app.get("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  if (!listing) {
    throw new ExpressError(404, "Listing Not Found");
  }
  res.render("listings/show.ejs", { listing });
}));

// Create a new listing
app.post("/listings", wrapAsync(async (req, res, next) => {
  let result = listingSchema.validate(req.body);
  if (result.error) {
    const msg = result.error.details.map(el => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
}));

// ==================== REVIEW VALIDATION MIDDLEWARE ====================
const validateReview = (req, res, next) => {
  let result = reviewSchema.validate(req.body);
  if (result.error) {
    const msg = result.error.details.map(el => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

// ==================== EDIT / UPDATE / DELETE LISTING ====================

// Show edit form
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing Not Found");
  }
  res.render("listings/edit.ejs", { listing });
}));

// Update an existing listing
app.put("/listings/:id", wrapAsync(async (req, res) => {
  if(!req.body.listing){
    throw new ExpressError(400, "Invalid Listing Data");
  }
  const result = listingSchema.validate(req.body);
  if (result.error) {
    const msg = result.error.details.map(el => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  let { id } = req.params;
  const updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { runValidators: true, new: true });
  if (!updatedListing) {
    throw new ExpressError(404, "Listing Not Found");
  }
  res.redirect(`/listings/${id}`);
}));

// Delete a listing and all reviews belonging to it
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ExpressError(404, "Listing Not Found");
  }

  await Review.deleteMany({
    _id: { $in: listing.reviews }
  });

  await Listing.findByIdAndDelete(id);

  res.redirect("/listings");
}));

// ==================== REVIEW ROUTES ====================

// Delete a review and remove its reference from the listing
app.delete("/listings/:listingId/reviews/:reviewId", wrapAsync(async (req, res) => {
  const { listingId, reviewId } = req.params;

  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new ExpressError(404, "Listing Not Found");
  }

  // Make sure the review actually belongs to this listing
  const reviewBelongsToListing = listing.reviews.some(
    (review) => review.toString() === reviewId
  );

  if (!reviewBelongsToListing) {
    throw new ExpressError(404, "Review Not Found for this Listing");
  }

  await Listing.findByIdAndUpdate(
    listingId,
    { $pull: { reviews: reviewId } }
  );

  await Review.findByIdAndDelete(reviewId);

  res.redirect(`/listings/${listingId}`);
}));

// Add a new review to a listing
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res, next) => {
    let listing = await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(404, "Listing Not Found");
    }

    let review = new Review(req.body.review);
    
    await review.save();
    listing.reviews.push(review);
    await listing.save();
    res.redirect(`/listings/${listing._id}`);
}));

// ==================== 404 & ERROR HANDLING ====================

// Catch any route that does not exist
app.all("/{*any}", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// Centralized error-handling middleware
app.use((err, req, res, next) => {
    // Invalid MongoDB ObjectId, such as /listings/invalid-id
    if (err.name === "CastError") {
        err.statusCode = 404;
        err.message = "Resource Not Found";
    }

    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err: { message } });
});