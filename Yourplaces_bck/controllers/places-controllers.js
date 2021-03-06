const fs = require("fs");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");

/////////////////////////////////////////Get//////////////////////////////

const getPlaces = async (req, res, next) => {
  let places;
  try {
    places = await Place.find({}, "-location -creator -description"); // o -password
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again.",
      500
    );
    return next(error);
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId); //(no devuelve promesa), en caso de necesitar ---.exec()
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place", //si falta informacion , falla la entity
      500
    );
    return next(error);
  }

  if (!place) {
    //no asincrono
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    ); //no encuentra
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId }); //busqueda en parametros
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again",
      500
    );
    return next(error);
  }
  if (!places || places.length === 0) {
    //asincrono
    return next(
      new HttpError("Could not find a places for the provided user id.", 404)
    );
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  }); // = {places : places}
};

/////////////////////////////////////////Create//////////////////////////////

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    next(new HttpError(" Invalid inputs passed, please check your data", 422));
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title, //title: title
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating place failed, try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError(" Could not find user for provided id", 404);
    return next(error);
  }

  console.log(user);
  //transaction: allow to perform multiple operations in isolation of each other and undone duties, built on sessions. start a session, initiate a transaction
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    // place created , ahora se a??ade al user
    user.places.push(createdPlace); //push de mongoose, para crear la relacion
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating place failed, try again", 500);
    return next(error);
  }

  res.status(201).json({ place: createdPlace }); //exito en sv
};

/////////////////////////////////////////Update//////////////////////////////

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, imageup } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    // autorizacion  via token
    const error = new HttpError("You are not allowed to edit the post", 401);
    return next(error);
  }
  bool = false;
  const imagePath = place.image;
  place.title = title;
  place.description = description;
  if (imageup === "true") {
    place.image = req.file.path;
  }
  try {
    await place.save();
    if (imageup === "true") {
      fs.unlink(imagePath, (err) => {
        console.log(err);
      });
    }
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

/////////////////////////////////////////Delete//////////////////////////////

const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); // borrar con referencia
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find a place for this id", 404); // check si existe el id
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    // autorizacion  via token
    const error = new HttpError("You are not allowed to delete the post", 401);
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess }); //aqui
    place.creator.places.pull(place); //  place creator -> places
    await place.creator.save({ session: sess }); //aqui
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
