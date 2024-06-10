import express from 'express'
import { getAllPurchases, getSinglePurchase, makePurchase } from '../controller/makePurchaseController.js';
export const purchaseRouter = express.Router();

purchaseRouter.post('/make-purchase', makePurchase);
purchaseRouter.get('/get-purchases', getAllPurchases);
purchaseRouter.get('/get-single-purchase/:id', getSinglePurchase)