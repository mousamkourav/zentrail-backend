const express = require('express');
const router = express.Router();
const  bookingController  = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');


router.post("/:panel", bookingController.createBooking);

router.use(protect);
router.get("/", bookingController.getAllBookingforAdmin);

module.exports = router;
