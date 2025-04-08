const express = require('express');
const router = express.Router()

// middleware import
const validateToken = require('../middleware/validateToken');
// controller import
const {
    // add opeations
    addReservation, createReservationForm,
    // get operations
    getMyReservations, getReservationById,
    // delete operations
    deleteReservation
} = require('../controller/reservationController')

// creats a new reservation
router.post("/create-reservation", validateToken, addReservation);

// Form-based reservation creation (no middleware validation)
router.post("/create-reservation-form", createReservationForm);

// gets all reservations associated with the user
router.get("/my-reservations", validateToken, getMyReservations);

// get a reservation by its id
router.get("/get-reservation/:reservationId", validateToken, getReservationById);

// Add route to match frontend endpoint
router.delete("/delete/:reservationId", validateToken, deleteReservation);

module.exports = router;