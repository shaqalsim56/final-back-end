import { request, response } from "express";
import { pool } from "../data/database_connection.js";


//Make a Purchase
export const makePurchase = async (request, response, next) => {
    // SQL query to insert a new purchase into the database
    const sqlQuery = `INSERT INTO purchases (user_id, vehicle_id, purchase_date, total_price) VALUES (?, ?, ?, ?)`;

    // Extract data from the request body
    const data = request.body;

    // Get the current date
    const currentDate = new Date();

    // Execute the SQL query to insert the purchase
    const [result] = await pool.query(sqlQuery, [data.user_id, data.vehicle_id, currentDate, data.price]);

    // Check if the purchase was successfully inserted
    if (result.insertId > 0) {
        // If the purchase was successful, send a success response
        response.status(201).json({
            status: 'success',
            data: {
                id: result.insertId,
                data: data
            }
        });

        // Update the status of the vehicle to 'Sold'
        await pool.query(`UPDATE vehicles_for_sale SET status = 'Sold' WHERE id = ?`, [data.vehicle_id]);
    } else {
        // If there was an error in making the purchase, send an error response
        response.status(400).json({
            status: 'error',
            message: 'Error in Making Purchase'
        });
    }
};

export async function getAllPurchases(request, response){
    // SQL query to fetch all purchases along with user and vehicle details
    const sqlQuery = `SELECT purchases.id, 
                            users.first_nm, 
                            users.last_nm,
                            vehicles_for_sale.vehicle_make,
                            vehicles_for_sale.vehicle_model, 
                            vehicles_for_sale.img, 
                            purchase_date, 
                            total_price 
                     FROM purchases 
                     INNER JOIN users ON purchases.user_id = users.id
                     INNER JOIN vehicles_for_sale ON purchases.vehicle_id = vehicles_for_sale.id`;

    // Execute the SQL query to fetch all purchases
    const [purchases] = await pool.query(sqlQuery);

    // Send success response with the fetched purchases
    response.status(200).json({
        status: 'success',
        results: purchases.length,
        purchases: purchases
    });
}

//Get Single Purchase
export async function getSinglePurchase(request, response){
    // Extract the purchase ID from the request parameters
    const id = request.params.id;
    // Check if the ID is a valid number
    if (isNaN(id)) {
        return response.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }
    try {
        // SQL query to fetch details of a single purchase along with user and vehicle details
        const sqlQuery = `SELECT users.first_nm, users.last_nm, vehicles_for_sale.vehicle_make, vehicles_for_sale.vehicle_model, purchase_date, vehicles_for_sale.descr, vehicles_for_sale.img, vehicles_for_sale.year, total_price 
                           FROM purchases 
                           INNER JOIN users ON purchases.user_id = users.id
                           INNER JOIN vehicles_for_sale ON purchases.vehicle_id = vehicles_for_sale.id 
                           WHERE purchases.id = ?`;
        // Execute the SQL query to fetch details of the single purchase
        const [rows]= await pool.query(sqlQuery, [id]);
        // Check if the purchase was found
        if (rows.length === 0) {
            return response.status(404).json({
                status: 'error',
                message: 'Purchase not found'
            });
        }
        // Extract the purchase details from the fetched rows
        const purchase = rows[0];
        // Send success response with the details of the single purchase
        response.status(200).json({
            status: 'success',
            results: purchase.length,
            purchase: purchase
        });
    } catch(error) {
        // Handle internal server error
        console.error(error);
        response.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}
