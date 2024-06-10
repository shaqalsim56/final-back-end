import express from 'express'
import { addNewVehicleForRent, deleteVehicleForRental, getAllVehiclesForRent, getSingleVehicleForRent, get_all_available_vehicles_for_rent, updateVehicleForRent } from '../controller/rentVehicleController.js';
import { protect } from '../controller/authController.js';
export const vehicleRouter = express.Router();

// vehicleRouter.use(protect)
vehicleRouter.post('/add-vehicle-rent', addNewVehicleForRent);

vehicleRouter.get('/get-vehicles-rent', getAllVehiclesForRent);
vehicleRouter.get('/get-available', get_all_available_vehicles_for_rent);

vehicleRouter.patch('/update-vehicle-rent/:id', updateVehicleForRent);

vehicleRouter.get('/get-singlevehicle-rent/:id', getSingleVehicleForRent);

vehicleRouter.delete('/delete-vehicle-rent/:id', deleteVehicleForRental);