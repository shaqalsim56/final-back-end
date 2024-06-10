//Create Connection Pool
import { pool } from "../data/database_connection.js";

//Security Imports
//bcryptjs -- hashing passwords
//jsonwebtoken -- signing JWT tokens
//dotenv - managing environment variables
import bcrypt from 'bcryptjs'
import { request, response } from "express";
import JWT from 'jsonwebtoken'
import dotenv from 'dotenv' 
dotenv.config({path: './config.env'});

//imported connection pool to a constant 
const conn = pool;

//Signing Token -- generates a JWT token with the ID, first_nm & last_nm
//JWT sign is used with a secret & expiration time from the environment variable
function signJWTToken(user){
    return JWT.sign({
        id: user.id, 
        first_name: user.first_nm,
        last_name: user.last_nm
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

// Middleware to protect routes and ensure the user is authenticated
export const protectAdmin = async (request, response, next) => {
    // Get the Authorization header from the request
    const authorization = request.get('Authorization');
    console.log(`REQUEST AUTHORIZATION >> ${authorization}`);

    // Check if the Authorization header is present and starts with 'Bearer'
    if (!authorization?.startsWith('Bearer')) {
        return next(
            response.status(400).json({
                status: 'error',
                message: 'Unable to access. Please log in.'
            })
        );
    }
    // Extract the token from the Authorization header
    const token = authorization.split(' ')[1]; 
    try {
        // Verify the token using the JWT secret
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        console.log(`DECODED TOKEN: ${JSON.stringify(decoded)}`);

         // Query the database to find the user by the ID in the token and ensure the user is active
        const [user] = await conn.query(`SELECT * FROM users WHERE id = ? AND status = 'Active'`, [decoded.id]);

        // If no user is found, return an error
        if (!user) { 
            return next(response.status(400).json({
                status: 'error',
                message: 'The token is no longer valid'
            }));
        }

        // Remove the password from the user data and attach the user data to the request object
        const data = user[0];
        data.password = undefined;
        request.user = data;
        next();

    } catch (error) {
        console.log(error.message);
        // Handle different JWT errors
       if(error.message == 'jwt expired'){
       return next(
            response.status(400).json({
                status: 'error',
                message: 'Token Expired'
            }));

       } else if(error.message == 'jwt malformed'){
        return next(
            response.status(400).json({
                status: 'error',
                message: 'Token Malformed'
            })
        )
       } else if(error.message == 'invalid signature'){
        return next(
            response.status(400).json({
                status: 'error',
                message: 'Signature is Invalid'
            })     
        )
       }else if(error.message == 'invalid token'){
        return next(
            response.status(400).json({
                status: 'error',
                message: 'Token is Invalid'
            })     
        )
       }else{
        return next(
            response.status(400).json({
                status: 'error',
                message: 'Unknown Error'
            })    
        ) 
       }
     //next();
    };
};


//Database Query For Adding New User 
export const registerAdmin = async (request, response, next) =>{
    const sqlQuery = `INSERT INTO users (first_nm, last_nm, email, password, last_logged_in, level) VALUES (?,  ?,  ?,  ?,  ?, ?)`;

//Get data from the request body to insert into the database. VDate will be the current date & time that the query is ran. 
//vLevel is automatically ADMIN when using the registerAdmin
    const data = request.body;
    const vLevel = 'ADMIN'
    const vDate = new Date();

    //Hashing password before saving it to database
    data.password = bcrypt.hashSync(data.password)

    //Runs the query 
    const [result] = await conn.query(sqlQuery, [data.first_nm, data.last_nm,  data.email, data.password, vDate, vLevel] );

    //Check if  the is an insertID meaning a user was successfully created
    if (result.insertId > 0){
        //Generate a JWT token for the new user
        const token = signJWTToken({id: result.insertId, first_name: data.first_nm, last_name: data.last_nm});
        //Generate a JWT token for the new user
        response.status(201).json({
            status: 'success',
             data: {token, user: data}
        });
    }else{
        //Respond with an error status
        response.status(400).json({
            status: 'error',
            message: 'Error in Registration'
        })
    }
}


//Database Query For Signing In as Admin
export const loginAdmin = async(request, response, next)=>{
       //Get data from the request body
    const data = request.body;
    //Query the database to find a user with the given email
    const [user] = await conn.query(`SELECT * FROM users WHERE email = ? AND level = 'ADMIN' `, [data.email, data.level]);
    // If no user is found, respond with a 404 status and error message
    if(!user.length)
            return response.status(404).json({
                status: 'error',
                message: 'Administrator Not Found',
            });
        console.log([response.message])
   // Compare the provided password with the stored hashed password
     if(!(await bcrypt.compare(data.password, user[0].password)))
            return response.status(400).json({
                        status: 'error',
                        message: 'Invalid Admin Credentials'
            });

    // Update the user's last login time in the database
    await conn.query(`UPDATE users SET last_logged_in = CURRENT_TIMESTAMP() WHERE id = ?`, [user[0].id]);
    // Generate a JWT token for the user
     const token = signJWTToken(user);
   // Remove the password from the user object before sending the response
     user[0].password = undefined;
  // Respond with a success status, token, and user data 
    response.status(200).json({
                status: 'success',
                data: { token,
                    user: user[0]
                }
            });
}


//Update User
export async function updateUser(request, response){
    const id = request.params.id;
     // Hash the updated password
    request.body.password = bcrypt.hashSync(request.body.password)
    // SQL query to update user information
    let updateUser = `UPDATE users SET first_nm = ?, last_nm = ?, email = ?, password = ?, level = ?, status = ? 
         WHERE id = ?` ;
    // Run the SQL query with updated user information
    const [user] = await pool.query(updateUser, [
        request.body.first_nm,
        request.body.last_nm,
        request.body.email,
        request.body.password,
        request.body.level,
        request.body.status,
        id
    ]);

    if(user.affectedRows <= 0){
        // If no rows were affected, return an error
        response.status(400).json({
            status: 'error', 
            message: 'User Not Updated'
        });
    }else{
        // If rows were affected, return success message with the number of affected rows
        response.status(200).json({
            status: 'success',
            updatedRow: user.affectedRows
        })
    }
}

//Delete User 
export async function deleteUser(request, response){
    const id = request.params.id;
    // SQL query to delete user with the specified ID
    const deleteUser = `DELETE FROM users WHERE id = ${id}`;
    // Run the SQL query to delete the user
    const [user] = await pool.query(deleteUser);

    // Return success message with the number of affected rows and the user that was deleted
    response.status(200).json({
        status: 'success',
        result: 1,
        user: user
    })
}


