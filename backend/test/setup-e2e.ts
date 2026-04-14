process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/trazabilidad_municipal?schema=public';
process.env.JWT_SECRET = 'cambia-esta-clave-en-produccion-para-ci';
process.env.JWT_EXPIRES_IN = '8h';
process.env.FRONTEND_URL = 'http://localhost:5173';
