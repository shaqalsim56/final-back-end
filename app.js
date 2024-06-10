// Import required modules
import express from 'express';
import morgan from 'morgan';
import session from 'express-session';
import cors from 'cors';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import fileUpload from 'express-fileupload';

// Get current filename and directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Routers
import { authRouter } from './routes/authRouter.js';
import { vehicleRouter } from './routes/vehicleRouter.js';
import { saleRouter } from './routes/saleRouter.js';
import { bookingRouter } from './routes/bookingRouter.js';
import { purchaseRouter } from './routes/purchaseRoute.js';
import { detailsRouter } from './routes/detailsRouter.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'SteelRide',
  resave: false,
  saveUninitialized: false,
}));

// Configure CORS
app.options('*', cors(['http://localhost:4200']));
app.use(cors(['http://localhost:4200']));

// File Upload Middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  abortOnLimit: true,
}));

// Body Parsing
app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ extended: true, limit: '5kb' }));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// API Endpoints 
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/vehicles', vehicleRouter);
app.use('/api/v1/sale', saleRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/api/v1/purchase', purchaseRouter);
app.use('/api/v1/details', detailsRouter);




// Static Folders For Images
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

const port = process.env.PORT || 9815;

// Initialize Server 
app.listen(port, () => {
    console.log(`The Server is Running On Port ${port}`);
});
