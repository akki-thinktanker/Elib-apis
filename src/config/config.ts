import { config as conf } from 'dotenv'
import cloudinary from './cloudinary';
conf();

const _config = {
    port: process.env.PORT,
    databaseUrl: process.env.MONGO_CONNECTION_STRING,
    env: process.env.NODE_ENV,
    jwtSecret: process.env.JWT_SECRET,

    // Cloudinary config
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinarySecretKey: process.env.CLOUDINARY_API_SECRET,

    frontendDomain: process.env.FRONTEND_DOMAIN
}

export const config = Object.freeze(_config)