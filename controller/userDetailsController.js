import { pool } from "../data/database_connection.js";

//Get User Detail on Booking
export async function getBookingDetails(request, response){
    // Extract the user ID from the request parameters
    const id = request.params.id;
    // Check if the ID is a valid number
    if (isNaN(id)) {
        return response.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }
    try {
        // SQL query to fetch booking details for a specific user
        const sqlQuery = `SELECT rental_bookings.id,  u.first_nm,  u.last_nm,  v.vehicle_make, v.vehicle_model, v.img, v.id AS vehicle_id, rental_bookings.rent_date, rental_bookings.return_date, 
                                  rental_bookings.total_price FROM rental_bookings INNER JOIN users u ON rental_bookings.user_id = u.id
                           INNER JOIN vehicles_for_rent v ON rental_bookings.vehicle_id = v.id 
                           WHERE rental_bookings.user_id = ?`;

        // Execute the SQL query to fetch booking details
        const [rows] = await pool.query(sqlQuery, [id]);
        // Check if any booking details were found
        if (rows.length === 0) {
            return response.status(404).json({
                status: 'error',
                message: 'Booking Not Found'
            });
        }
        // Extract the booking details from the fetched rows
        const details = rows;
        // Send success response with the booking details
        response.status(200).json({
            status: 'success',
            results: details.length,
            details: details
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



export async function getPurchaseDetails(request, response){
    // Extract the user ID from the request parameters
    const id = request.params.id;
    // Check if the ID is a valid number
    if (isNaN(id)) {
        return response.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }
    try {
        // SQL query to fetch purchase details for a specific user
        const sqlQuery = `SELECT purchases.id,  users.first_nm,  users.last_nm,  vehicles_for_sale.vehicle_make, vehicles_for_sale.vehicle_model, vehicles_for_sale.img, purchase_date, 
                                  total_price FROM purchases  INNER JOIN users ON purchases.user_id = users.id
                           INNER JOIN vehicles_for_sale ON purchases.vehicle_id = vehicles_for_sale.id 
                           WHERE user_id = ?`;

        // Execute the SQL query to fetch purchase details
        const [rows] = await pool.query(sqlQuery, [id]);
        // Check if any purchase details were found
        if (rows.length === 0) {
            return response.status(404).json({
                status: 'error',
                message: 'No Purchase Found'
            });
        }
        // Extract the purchase details from the fetched rows
        const details = rows;
        // Send success response with the purchase details
        response.status(200).json({
            status: 'success',
            results: details.length,
            details: details
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
