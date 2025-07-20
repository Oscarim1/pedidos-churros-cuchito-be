# Pedidos Churros Cuchito Backend
Este proyecto usa Express y ahora tiene habilitado CORS.

## Endpoints adicionales

- `GET /api/orders/total-por-dia?fecha=AAAA-MM-DD` retorna el total de ventas
  por método de pago (efectivo o tarjeta) para la fecha indicada.
- `POST /api/cierres-caja/generar` genera un cierre de caja para la fecha indicada
  combinando datos enviados por el usuario con los montos calculados a partir de
  las órdenes del día.
