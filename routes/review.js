const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");
const reviewController = require("../controllers/review");

// ==================== REVIEW ROUTES ====================

// Add a new review to a listing
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Delete a review and remove its reference from the listing
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;
