import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import orderItemRoutes from './routes/orderItemRoutes.js';
import cierreCajaRoutes from './routes/cierreCajaRoutes.js';
import informesCierreCajaRoutes from './routes/informesCierreCajaRoutes.js';
import setupSwagger from './config/swagger.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

setupSwagger(app);

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/cierres-caja', cierreCajaRoutes);
app.use('/api/informes-cierres-caja', informesCierreCajaRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
