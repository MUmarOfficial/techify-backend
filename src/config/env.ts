export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 10,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  MAX_JSON_PAYLOAD: process.env.MAX_JSON_PAYLOAD || '600mb',
  MEDIA_LIMITS: {
    THUMBNAIL: 50 * 1024 * 1024,
    VIDEO: 500 * 1024 * 1024,
    AVATAR: 1 * 1024 * 1024,
  },
};

