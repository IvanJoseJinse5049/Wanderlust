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

app.use(express.static(path.join(__dirname, "public")));
main()
    .then(() => {console.log("Connected to MongoDB")})
    .catch((err) => {console.log(err)});

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

app.get('/',(req,res)=>{
    res.send("Hi i am root");
});

app.get("/listings", wrapAsync(async (req, res, next) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
    
}));

app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

app.get("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  if (!listing) {
    throw new ExpressError(404, "Listing Not Found");
  }
  res.render("listings/show.ejs", { listing });
}));

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

const validateReview = (req, res, next) => {
  let result = reviewSchema.validate(req.body);
  if (result.error) {
    const msg = result.error.details.map(el => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing Not Found");
  }
  res.render("listings/edit.ejs", { listing });
}));

app.put("/listings/:id", wrapAsync(async (req, res) => {
  if(!req.body.listing){
    throw new ExpressError(400, "Invalid Listing Data");
  }
  let { id } = req.params;
  const updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { runValidators: true, new: true });
  if (!updatedListing) {
    throw new ExpressError(404, "Listing Not Found");
  }
  res.redirect(`/listings/${id}`);
}));

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


app.delete("/listings/:listingId/reviews/:reviewId", wrapAsync(async (req, res) => {
  const { listingId, reviewId } = req.params;

  const listing = await Listing.findByIdAndUpdate(
    listingId,
    { $pull: { reviews: reviewId } },
    { new: true }
  );

  if (!listing) {
    throw new ExpressError(404, "Listing Not Found");
  }

  const deletedReview = await Review.findByIdAndDelete(reviewId);

  if (!deletedReview) {
    throw new ExpressError(404, "Review Not Found");
  }

  res.redirect(`/listings/${listingId}`);
}));

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

app.all("/{*any}", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err: { message } });
});




app.listen(8080,()=>{
    console.log("Server is running on port 8080");
}); 