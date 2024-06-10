import { pool } from "../data/database_connection.js";

// Get All Bookings
export async function getAllBookings(request, response) {
    try {
        // SQL query to select all booking details with user and vehicle information
        const sqlQuery = `
            SELECT 
                rental_bookings.id, 
                users.first_nm, 
                users.last_nm, 
                vehicles_for_rent.vehicle_make, 
                vehicles_for_rent.vehicle_model,  
                rent_date, 
                return_date,  
                total_price 
            FROM 
                rental_bookings
            INNER JOIN 
                users ON rental_bookings.user_id = users.id
            INNER JOIN 
                vehicles_for_rent ON rental_bookings.vehicle_id = vehicles_for_rent.id
        `;

        // Execute the SQL query
        const [bookings] = await pool.query(sqlQuery);

        // Send a success response with the retrieved bookings data
        response.status(200).json({
            status: 'success',
            results: bookings.length,
            bookings: bookings
        });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error:', error);
        response.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}


// Get Single Booking
export async function getSingleBooking(request, response) {
    // Extract the booking ID from the request parameters
    const id = request.params.id;
    // Validate the ID format to ensure it is a number
    if (isNaN(id)) {
        return response.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }
    try {
        // SQL query to select booking details with user and vehicle information
        const sqlQuery = `
            SELECT  users.first_nm,  users.last_nm, vehicles_for_rent.vehicle_make, vehicles_for_rent.vehicle_model,  rent_date, return_date, vehicles_for_rent.img,  vehicles_for_rent.id AS vehicle_id, vehicles_for_rent.price, vehicles_for_rent.year,
                vehicles_for_rent.descr, total_price FROM rental_bookings INNER JOIN  users ON rental_bookings.user_id = users.id
            INNER JOIN vehicles_for_rent ON rental_bookings.vehicle_id = vehicles_for_rent.id 
            WHERE rental_bookings.id = ?
        `;
        // Execute the SQL query with the provided ID
        const [rows] = await pool.query(sqlQuery, [id]);
        // Check if any rows were returned (i.e., if the booking was found)
        if (rows.length === 0) {
            return response.status(404).json({
                status: 'error',
                message: 'Booking not found'
            });
        }
        // Get the booking details from the first row of the result
        const booking = rows[0];
        // Send a success response with the retrieved booking data
        response.status(200).json({
            status: 'success',
            results: 1,
            booking: booking
        });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error:', error);
        response.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

// Database Query For Making New Booking
export const createBooking = async (request, response, next) => {
    // SQL query to insert a new booking
    const sqlQuery = `INSERT INTO rental_bookings(user_id, vehicle_id, rent_date, return_date, total_price) VALUES(?, ?, ?, ?, ?)`;
    // Get data from the request body
    const data = request.body;
    // Parse rent and return dates
    const rentDate = new Date(data.rent_date);
    const returnDate = new Date(data.return_date);
    // Format dates to YYYY-MM-DD
    const formattedRentDate = rentDate.toISOString().split('T')[0];
    const formattedReturnDate = returnDate.toISOString().split('T')[0];
    // Calculate the time difference in milliseconds
    const timeDifference = returnDate.getTime() - rentDate.getTime();
    // Calculate the number of days between the rent and return dates
    const daysDifference = Math.round(timeDifference / (1000 * 3600 * 24));
    // Calculate total price based on price per day and number of days
    const totalPrice = data.price * daysDifference;
    // Execute the SQL query to insert the booking
    const [result] = await pool.query(sqlQuery, [data.user_id, data.vehicle_id, formattedRentDate, formattedReturnDate, totalPrice]);
    if (result.insertId > 0) {
        // If the booking was successfully created, send a success response
        response.status(201).json({
            status: 'success',
            data: {
                id: result.insertId,
                ...data
            }
        });

        // Update the vehicle status to 'Unavailable'
        await pool.query(`UPDATE vehicles_for_rent SET status = 'Unavailable' WHERE id = ?`, [data.vehicle_id]);
    } else {
        // If there was an error in creating the booking, send an error response
        response.status(400).json({
            status: 'error',
            message: 'Error in Booking'
        });
    }
};

export const updateBooking = async (request, response, next) => {
    // Extract the booking ID from the request parameters
    const id = request.params.id;
    // SQL query to update booking details
    const sqlUpdateQuery = `UPDATE rental_bookings SET rent_date = ?, return_date = ?, total_price = ? WHERE id = ?`;
    // Get data from the request body
    const data = request.body;
    // Parse rent and return dates
    const rentDate = new Date(data.rent_date);
    const returnDate = new Date(data.return_date);
    // Format dates to YYYY-MM-DD
    const formattedRentDate = rentDate.toISOString().split('T')[0];
    const formattedReturnDate = returnDate.toISOString().split('T')[0];
    // Calculate the time difference in milliseconds
    const timeDifference = returnDate.getTime() - rentDate.getTime();
    // Calculate the number of days between the rent and return dates
    const daysDifference = Math.round(timeDifference / (1000 * 3600 * 24));
    // Calculate total price based on price per day and number of days
    const totalPrice = data.price * daysDifference;
    try {
        // Execute the SQL query to update booking details
        const [result] = await pool.query(sqlUpdateQuery, [formattedRentDate, formattedReturnDate, totalPrice, id]);
        if (result.affectedRows > 0) {
            // If the booking was successfully updated, send a success response
            response.status(200).json({
                status: 'success',
                message: 'Booking dates and price updated successfully'
            });
        } else {
            // If there was an error in updating the booking or booking not found, send an error response
            response.status(400).json({
                status: 'error',
                message: 'Error in updating booking dates or booking not found'
            });
        }
    } catch (error) {
        // Forward the error to the error handling middleware
        next(error);
    }
};

//Delete Booking
export async function deleteBooking(request, response){
    // Extract booking ID from request parameters
    const id = request.params.id;

    // Extract vehicle ID from request body
    const { vehicle_id } = request.body;

    // SQL query to delete booking
    const deleteBooking = `DELETE FROM rental_bookings WHERE id = ?`;

    // Execute SQL query to delete booking
    const [booking] = await pool.query(deleteBooking, [id]);

    if (booking.affectedRows === 1) {
        // If booking deletion was successful, update vehicle status to 'Available'
        await pool.query(`UPDATE vehicles_for_rent SET status = 'Available' WHERE id = ?`, [vehicle_id]);

        // Send success response
        response.status(200).json({
            status: 'success',
            result: 1,
            booking: booking
        });
    } else {
        // If booking not found or could not be deleted, send error response
        response.status(400).json({
            status: 'error',
            result: 0,
            message: 'Booking not found or could not be deleted.'
        });
    }
}

