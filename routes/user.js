const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const userController = require("../controllers/user");

router.get("/signup", userController.renderSignupForm);

router.post("/signup", wrapAsync(userController.signup));

router.get("/login", userController.renderLoginForm);

router.post("/login", passport.authenticate("local", {
  failureFlash: true,
  failureRedirect: "/login"
}), userController.login);
router.get("/logout", userController.logout);

module.exports = router;
