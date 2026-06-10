import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import jwt from 'jsonwebtoken';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Pedidos Churros Cuchito',
      version: '1.0.0',
      description: 'Documentación generada automáticamente con Swagger',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'], // asegúrate que apunta a tus archivos correctamente
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default function setupSwagger(app) {
  app.use('/api/docs', (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token requerido para acceder a la documentación' });

    jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
      next();
    });
  }, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
