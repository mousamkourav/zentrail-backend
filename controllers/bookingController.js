
const getPanelDb = require('../config/dbManager');

const createBooking = async (req, res) => {
    const { panel } = req?.params || req?.user;
    const { Booking } = getPanelDb(panel);

    try {
        const {
            fullname,
            email,
            age,
            gender,
            phone,
            billing_address,
            tour_id,
            number_of_people,
            peoplelist,
            booking_date,
            preference,
            travel_date_start,
            travel_date_end,
            status,
            paymentmethod,
            payment
        } = req.body;

        if (!fullname || !email || !tour_id || !travel_date_start || !paymentmethod) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        const bookingsdata = await Booking.create({
            fullname,
            email,
            age,
            gender,
            phone,
            billing_address,
            tour_id,
            number_of_people,
            peoplelist,
            booking_date: booking_date || new Date(),
            preference,
            travel_date_start,
            travel_date_end,
            status: status || 'pending',
            paymentmethod,
            payment
        });


        res.status(201).json({
            message: "Booking created successfully",
            data: bookingsdata
        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
const getAllBookingforAdmin = async (req, res) => {
    res.status(200).json({
        message: "Booking fetch successfully",
    });
}
module.exports = {
    createBooking,
    getAllBookingforAdmin
};
