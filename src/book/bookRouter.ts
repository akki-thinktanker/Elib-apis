import express from 'express'
import { createBook } from './bookController'
import multer from 'multer';
import path from 'node:path';

const bookRouter = express.Router();


const upload = multer({
    dest: path.resolve(__dirname, '../../public/data/uploads'),

    // todo: put limit 10mb max
    // limits: { fileSize: 3e7 } // 30mb 30 * 1024 * 1024
    limits: { fileSize: (10 * 1048576) } // 30mb 30 * 1024 * 1024

    // 1048576 = 1 Mb allowed, so for 10Mb we can do 10 * 1048576

})

// routes
// /api/books
bookRouter.post('/', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), createBook)

export default bookRouter