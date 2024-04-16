import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "fs";


const createBook = async (req: Request, res: Response, next: NextFunction) => {
    const { title, genre } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    // appliation/pdf
    const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName)


    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: fileName,
            folder: 'book-covers',
            format: coverImageMimeType
        })

        const bookFileName = files.file[0].filename;
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName)


        const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: 'raw', filename_override: bookFileName, folder: 'book-pdfs',
            format: 'pdf'
        })

        console.log('bookFileUploadResult: ', bookFileUploadResult)
        console.log('uploadResult: ', uploadResult)

        const newBook = await bookModel.create({
            title,
            genre,
            author: '661e1f94ecf8d167a487b9af',
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        })

        // Delete temp files
        // todo: wrap in try catch
        try {

            await fs.promises.unlink(filePath)
            await fs.promises.unlink(bookFilePath)

            return res.status(201).json({ id: newBook._id })
        } catch (err) {
            next(createHttpError(500, 'Failed to delete files from server.'))
        }

    } catch (err) {
        console.log(err)
        return next(createHttpError(500, 'Error while uploading the files.'))
    }


}

export { createBook }