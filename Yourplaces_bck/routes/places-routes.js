const express = require("express");

const { check } = require("express-validator");

const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

router.get("/", placesControllers.getPlaces);

router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
    
  ],
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  fileUpload.single("image"),
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 }),check("imageup").isBoolean()],
  placesControllers.updatePlaceById
); // validacion

router.delete("/:pid", placesControllers.deletePlaceById);

module.exports = router;
