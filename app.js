// ==================== IMPORTS ====================
const express=require('express');
const app=express();
const mongoose=require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const ExpressError = require("./utils/ExpressError");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
require("dotenv").config();

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
  await mongoose.connect(process.env.ATLASDB_URL, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 30000,
  });
}


// ==================== APP CONFIGURATION & MIDDLEWARE ====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
  }
};
const store = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  secret: "mysupersecretcode",
  touchAfter: 24 * 60 * 60, // 24 hours
});
store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});
sessionOptions.store = store;  
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user; // Make the current user available in all templates
  next();
});
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ==================== ROUTES ====================

// ---------- Home Route ----------
// app.get('/',(req,res)=>{
//     res.send("Hi i am root");
// });

// ---------- Listing Routes ----------
app.use("/listings", listingRouter);

// ---------- Review Routes ----------
app.use("/listings/:id/reviews", reviewRouter);

// ---------- User Routes ----------
app.use("/", userRouter);


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

    // Keep visitors in the listing creation flow when saving the listing fails.
    if (req.method === "POST" && req.originalUrl === "/listings") {
        req.flash("error", message);
        return res.redirect("/listings/new");
    }

    res.status(statusCode).render("error.ejs", { err: { message } });
});
