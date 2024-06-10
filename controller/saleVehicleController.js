//Create Connection Pool
import { pool } from "../data/database_connection.js";

import { getRandomHexValue } from "../utils.js";

//Imports modules for working with file paths and the file system.
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Set __filename and __dirname manually since they are not available in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


//Create New Vehicle For Sale
export async function addNewVehicleForSale(request, response) {
    try {
        // SQL query to insert a new vehicle into the database
        let insertVehicle = `INSERT INTO vehicles_for_sale(vehicle_model, vehicle_make, seat_num, year, door, fuel_type,
            price, descr, img, status) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`;
          // Check if an image file is provided in the request   
        const vStatus = 'Available'
        const image = request.files?.image;
        let vFile = ' ';
        if (image) {
            // Generate a random filename for the image to store into the database
            vFile = `${getRandomHexValue(8)}_${image.name}`;
        }

         // Run the SQL query to insert the vehicle into the database
        const [vehicle] = await pool.query(insertVehicle, [
            request.body.vehicle_model,
            request.body.vehicle_make,
            request.body.seat_num,
            request.body.year,
            request.body.door,
            request.body.fuel_type,
            request.body.price,
            request.body.descr,
            vFile,
            vStatus
        ]);
        // If an image is provided, save it to the server's upload directory
        if (image) {
            const serverUploadPath = path.join(__dirname, './uploads', vFile);
            await image.mv(serverUploadPath);
       // When an image is uploaded,  copy the uploaded image to an Angular application's assets directory
            const angularPath = path.join(`C:/WebDev/angular_final_project/frontend/src/assets/uploads`, vFile)
            fs.copyFile(serverUploadPath, angularPath, (error) => {
                if (error) throw error;
                console.log('Image Copied To Frontend')
            });
        }
        // Send a success response with the inserted vehicle data
        response.status(201).json({
            status: 'success',
            message: 'Vehicle Successfully Inserted',
            data: vehicle
        });
    } catch (error) {
        // Handle the error
        console.error('Error:', error);
        // Send an error response if any error occurs during the process
        response.status(500).json({
            status: 'error',
            message: 'Incomplete. Please Fill in All Fields & Try Again'
        });
    }
}

//Update Vehicle For Sale
export async function updateVehicleForSale(request, response){
     // Extract the vehicle ID from the request parameters
    const id = request.params.id;
    // SQL query to update vehicle information in the 'vehicles_for_rent' table
    let updateVehicle = `UPDATE vehicles_for_sale SET vehicle_model = ?, vehicle_make = ?, seat_num = ?, year = ?,
    door = ?, fuel_type = ?, price = ?, descr = ?,  img = ? WHERE id = ? `;
    // Check if an image file is provided in the request
    const image = request.files?.image;
    let vFile = ' ';
    if (image) {
         // Generate a random filename for the new image
        vFile = `${getRandomHexValue(8)}_${image.name}`;
        // Save the image to the server's upload directory
        const serverUploadPath = path.join(__dirname, './uploads', vFile);
        await image.mv(serverUploadPath);
         // When an image is uploaded,  copy the uploaded image to an Angular application's assets directory
        const angularPath = path.join(`C:/WebDev/angular_final_project/frontend/src/assets/uploads`, vFile)
        fs.copyFile(serverUploadPath, angularPath, (error) => {
                if (error) throw error;
                console.log('Image Copied To Frontend')
        });
    }else {
        // If no new image is uploaded, use the existing image from the request body
        vFile = request.body.img
    }
    // Run the SQL query to update the vehicle information
    const [vehicle] = await pool.query(updateVehicle, [
        request.body.vehicle_model,
        request.body.vehicle_make,
        request.body.seat_num,
        request.body.year,
        request.body.door,
        request.body.fuel_type,
        request.body.price,
        request.body.descr,
        vFile,
        id
    ]);
     // Check if any rows were affected
    if(vehicle.affectedRows <= 0){
        response.status(400).json({
            status: 'error',
            message: 'Vehicle Data Not Updated'
        });
    }else{
        // If rows were affected, send a success response with the number of affected rows
        response.status(200).json({
            status: 'success',
            updatedRow: vehicle.affectedRows
        })
    }
}

//Get All Vehicles For Sale
export async function getAllVehiclesForSale(request, response){
    try {
        // SQL query to select all vehicles from the 'vehicles_for_sale' table
    const sqlQuery = `SELECT * FROM vehicles_for_sale`;
        
        // Execute the SQL query
        const [vehicles] = await pool.query(sqlQuery);

        // Send a success response with the retrieved vehicles data
        response.status(200).json({
            status: 'success',
            results: vehicles.length, 
            vehicles: vehicles   
        });
    } catch (error) {
        // Handle errors
        console.error('Error:', error);
        // Send an error response if any error occurs during the process
        response.status(500).json({
            status: 'error',
            message: 'Failed to retrieve vehicles'
        });
    }
}

//Get All Vehicles For Sale
export async function get_all_available_vehicles_for_sale(request, response){
    try {
        // SQL query to select all available vehicles from the 'vehicles_for_sale' table
    const sqlQuery = `SELECT * FROM vehicles_for_sale WHERE status = 'Available'`;

        // Execute the SQL query
        const [vehicles] = await pool.query(sqlQuery);

        // Send a success response with the retrieved vehicles data
        response.status(200).json({
            status: 'success',
            results: vehicles.length, 
            vehicles: vehicles        
        });
    } catch (error) {
        // Handle errors
        console.error('Error:', error);
        // Send an error response if any error occurs during the process
        response.status(500).json({
            status: 'error',
            message: 'Failed to retrieve available vehicles'
        });
    }
}

//Get Single Vehicle For Sale
export async function getSingleVehicleForSale(request, response){
    const id = request.params.id;

    if (isNaN(id)) {
        return response.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }

  try {
         // SQL query to select a vehicle with the specified ID
        const viewVehicle = 'SELECT * FROM vehicles_for_sale WHERE id = ?';
        // Execute the SQL query with the provided ID
        const [rows] = await pool.query(viewVehicle, [id]);
        // Check if any vehicle is found with the specified ID
        if (rows.length === 0) {
            return response.status(404).json({
                status: 'error',
                message: 'Vehicle not found'
            });
        }
        // Retrieve the vehicle data from the query result
        const vehicle = rows[0];
        // Send a success response with the retrieved vehicle data
        response.status(200).json({
            status: 'success',
            results: 1,
            vehicle: vehicle
        });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error(error);
        response.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

//Delete Vehicle For Sale
export async function deleteVehicleForSale(request, response){
        // Extract the vehicle ID from the request parameters
        const id = request.params.id;

        // Validate the ID format to ensure it is a number
            if (isNaN(id)) {
             return response.status(400).json({
                    status: 'error',
                    message: 'Invalid ID format'
                });
            }
    
    const deleteVehicle = `DELETE FROM vehicles_for_sale WHERE id = ${id}`;
 
    // Execute the SQL query with the provided ID
    const [vehicle] = await pool.query(deleteVehicle);

   // Send a success response with the result of the deletion
    response.status(200).json({
        status: 'success',
        result: 1,
        vehicle: vehicle
    })
}