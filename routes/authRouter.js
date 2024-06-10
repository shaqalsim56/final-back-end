import express from 'express'
import { getSingleUser, getUsers, loginuser, protect, registerUser } from '../controller/authController.js';
import { deleteUser, loginAdmin, protectAdmin, registerAdmin, updateUser } from '../controller/adminAuthController.js';
export const authRouter = express.Router();

//POST Request For Registering New User & New Admins
authRouter.post('/register', registerUser);
authRouter.post('/register-admin', registerAdmin);


authRouter.post('/login', loginuser);
authRouter.post('/login-admin', loginAdmin);

//Protecting Route So That Only Logged In Users Are Able To Access
// authRouter.use(protectAdmin)
authRouter.get('/users', getUsers);
authRouter.get('/profile/:id', getSingleUser);
authRouter.patch('/update-user/:id', updateUser);
authRouter.delete('/delete-user/:id', deleteUser);