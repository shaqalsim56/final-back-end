import express from 'express'
import { getBookingDetails, getPurchaseDetails } from '../controller/userDetailsController.js';
export const detailsRouter = express.Router();

detailsRouter.get('/get-user-bookings/:id', getBookingDetails);
detailsRouter.get('/get-user-purchases/:id', getPurchaseDetails);

