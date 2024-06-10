import express, { Router } from 'express'
import { createBooking, deleteBooking, getAllBookings, getSingleBooking, updateBooking } from '../controller/rentalBookingController.js';
export const bookingRouter = express.Router();

bookingRouter.get('/get-bookings', getAllBookings);
bookingRouter.post('/create-booking', createBooking);

bookingRouter.patch('/update-single-booking/:id', updateBooking)

bookingRouter.get('/get-single-booking/:id', getSingleBooking);
bookingRouter.delete('/delete-booking/:id', deleteBooking);