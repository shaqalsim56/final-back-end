import express from 'express'
import { addNewVehicleForSale, deleteVehicleForSale, getAllVehiclesForSale, getSingleVehicleForSale, get_all_available_vehicles_for_sale, updateVehicleForSale } from '../controller/saleVehicleController.js';
export const saleRouter = express.Router();

saleRouter.post('/add-vehicle-sale', addNewVehicleForSale);

saleRouter.get('/get-vehicles-sale', getAllVehiclesForSale);
saleRouter.get('/get-available', get_all_available_vehicles_for_sale)

saleRouter.patch('/update-vehicle-sale/:id', updateVehicleForSale);

saleRouter.get('/get-singlevehicle-sale/:id', getSingleVehicleForSale);

saleRouter.delete('/delete-vehicle-sale/:id', deleteVehicleForSale);