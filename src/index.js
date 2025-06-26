import express from 'express';
import authRoutes from './routes/authRoutes.js';
import setupSwagger from './config/swagger.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

setupSwagger(app);

app.use(express.json());

app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
