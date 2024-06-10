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


//Database Query For Adding New User 
export const registerUser = async (request, response, next) =>{
    const sqlQuery = `INSERT INTO users (first_nm, last_nm, email, password, last_logged_in) VALUES (?,  ?,  ?,  ?,  ?)`;

//Get data from the request body to insert into the database. VDate will be the current date & time that the query is ran.
    const data = request.body;
    const vDate = new Date();

//Hashing password before saving it to database
    data.password = bcrypt.hashSync(data.password)

//Runs the query 
    const [result] = await conn.query(sqlQuery, [data.first_nm, data.last_nm,  data.email, data.password, vDate] );

//Check if  the is an insertID meaning a user was successfully created
    if (result.insertId > 0){
        //Generate a JWT token for the new user
        const token = signJWTToken({id: result.insertId, first_name: data.first_nm, last_name: data.last_nm});
        //Respond with a success status 
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





//Database Query For Signing In as User
export const loginuser = async(request, response, next)=>{
    //Get data from the request body
    const data = request.body;
    //Query the database to find a user with the given email
    const [user] = await conn.query(`SELECT * FROM users WHERE email = ?`, [data.email]);
    // If no user is found, respond with a 404 status and error message
    if(!user.length)
            return response.status(404).json({
                status: 'error',
                message: 'User Not Found',
            });
            console.log([response.message])
   //If the user is inactive, respond with a 400 status and error message
     if(user[0].status == 'Inactive')
            return response.status(400).json({
                status: 'error',
                message: 'User Not Active In System'
            })
// Compare the provided password with the stored hashed password
    if(!(await bcrypt.compare(data.password, user[0].password)))
    return response.status(400).json({
                status: 'error',
                message: 'Invalid User Credentials'
    });

    // Update the user's last login time in the database
    await conn.query(`UPDATE users SET last_logged_in = CURRENT_TIMESTAMP() WHERE id = ?`, [user[0].id]); 

     // Generate a JWT token for the user
    const token = signJWTToken(user[0]);
    // Remove the password from the user object before sending the response
    user[0].password = undefined;
// Respond with a success status, token, and user data
    response.status(200).json({
        status: 'success',
        data: {
            token, 
            user: user[0],
        }
    })
};


// Middleware to protect routes and ensure the user is authenticated
export const protect = async (request, response, next) => {
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



export async function getUsers(request, response, next) {
    try {
        // Query the database to retrieve all users
        const [users] = await conn.query(`SELECT * FROM users`);
        
        // If no users are found
        if (!users.length) {
            return response.status(404).json({
                status: 'error',
                message: 'Users Not Found'
        });
        }

        // Copy the user data to a new variable
        const userData = users;

        // Remove the password from each user object for security
        userData.forEach(user => {
            user.password = undefined;
        });

        // Send the response with a success status and the user data
        response.status(200).json({
            status: 'success',
            data: users
        });
    } catch (error) {
        next(error); 
    }
}



export const getSingleUser = async(request, response, next) =>{
    try {
        // Extract the user ID from the request parameters
        const id = request.params.id;

        // Check if the ID is missing
        if (!id){
            return response.status(400).json({
                status: 'error',
                message: 'ID is reuired'
            });
        } 
        // Query the database to retrieve the user with the given ID
        const [rows] = await conn.query(`SELECT * FROM users WHERE id = ?`, [id]);

         // If no user is found with the given ID, return a 404 error
        if(!rows.length){
            return response.status(404).json({
                status: 'error',
                message: 'User Not Found'
        });
     }
     // Remove the password from the user object
     const user = rows[0];
     user.password = undefined;

      // Send the response with the user data
     response.status(200).json({
        status: 'success',
        data: user
    });
    }catch(error){
         // Pass any errors to the error handling middleware
        next(error)
    }
}


