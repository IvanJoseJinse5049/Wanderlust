const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isOwner, validateListing } = require("../middleware");
const listingController = require("../controllers/listing");
const upload = require("../cloudConfig");

// ==================== LISTING ROUTES ====================

// Show form for creating a new listing
// Keep this route before /:id so "new" is not treated as an ID.
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.route("/")
	.get(wrapAsync(listingController.index))
	.post(
		isLoggedIn,
		upload.single("image"),
		validateListing,
		wrapAsync(listingController.createListing)
	);

router.route("/:id")
	.get(wrapAsync(listingController.showListing))
	.put(
		isLoggedIn,
		isOwner,
		upload.single("image"),
		validateListing,
		wrapAsync(listingController.updateListing)
	)
	.delete(
		isLoggedIn,
		isOwner,
		wrapAsync(listingController.destroyListing)
	);

router
	.route("/:id/edit")
	.get(isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;
