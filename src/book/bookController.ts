import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "fs";
import { AuthRequest } from "../middlewares/authenticate";


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

        const _req = req as AuthRequest

        const newBook = await bookModel.create({
            title,
            genre,
            author: _req.userId,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        })

        // Delete temp files
        // todo: wrap in try catch
        try {

            await fs.promises.unlink(filePath)
            await fs.promises.unlink(bookFilePath)

            return res.status(201).json(newBook)
        } catch (err) {
            next(createHttpError(500, 'Failed to delete files from server.'))
        }

    } catch (err) {
        return next(createHttpError(500, 'Error while uploading the files.'))
    }
}

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
    const { title, genre } = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({ _id: bookId })

    if (!book) {
        return next(createHttpError(404, 'Book not found'))
    }

    // check access
    const _req = req as AuthRequest
    if (book.author.toString() !== _req.userId) {
        return next(createHttpError(403, 'You can not update others books'))
    }

    // check if image field exists

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    let completeCoverImage = "";
    if (files.coverImage) {
        const filename = files.coverImage[0].filename;
        const coverMimeType = files.coverImage[0].mimetype.split('/').at(-1);

        // send files to cloudinary
        const filePath = path.resolve(
            __dirname,
            '../../public/data/uploads/' + filename
        )
        completeCoverImage = `${filename}.${coverMimeType}`
        const uploadResult = await cloudinary.uploader.upload(filePath, { filename_override: completeCoverImage, folder: 'book-covers', format: coverMimeType })


        completeCoverImage = uploadResult.secure_url;
        await fs.promises.unlink(filePath)
    }

    // check if file field exist

    let completeFileName = '';

    if (files.file) {
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads/' + files.file[0].filename)

        const bookFileName = files.file[0].filename;
        // completeFileName = `${bookFileName}.pdf`
        completeFileName = bookFileName

        const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: 'raw',
            filename_override: completeFileName,
            folder: 'book-covers',
            format: 'pdf'
        })

        completeFileName = uploadResultPdf.secure_url;
        await fs.promises.unlink(bookFilePath)
    }

    const updatedBook = await bookModel.findOneAndUpdate(
        {
            _id: bookId,
        }, {
        title: title,
        genre: genre,
        coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
        file: completeFileName ? completeFileName : book.file,
    }, { new: true }
    )

    res.json(updatedBook)
}


const listBooks = async (req: Request, res: Response, next: NextFunction) => { 
    try{
        // todo: add pagination
        const book  = await bookModel.find()

        res.json(book)
    }
    catch(err){
        return next(createHttpError(500, 'Error while getting a book'))
    }
 }

 const getBook = async (req: Request, res: Response, next: NextFunction)  => {
    const bookId = req.params.bookId
    try{
        const book = await bookModel.findOne({_id: bookId})
        if(!book){
            return next(createHttpError(404, 'Book not found'))
        }

        return res.json(book)
    }catch(err){
            return next(createHttpError(500, 'Error while getting a book'))
        }
 }

 const deleteBook = async (req: Request, res: Response, next: NextFunction)  => {
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({_id: bookId})
    if(!book){
        return next(createHttpError(404, 'Book not found!'))
    }

    // check access
    const _req = req as AuthRequest;
    if(book.author.toString() !== _req.userId)
        {
            return next(createHttpError(403, "You cannot delete others book"))
        }

        // book-covers/pvglcv6cfrki1l4xm6qr

        // https://res.cloudinary.com/dysjxiwrf/image/upload/v1713277206/book-covers/pvglcv6cfrki1l4xm6qr.png


        const coverFileSplits = book.coverImage.split('/')
        const coverImagePublicId = coverFileSplits.at(-2) + '/' + coverFileSplits.at(-1)?.split('.').at(0);
        
        const bookFileSplits = book.file.split('/')
        const bookImagePublicId = bookFileSplits.at(-2) + '/' + bookFileSplits.at(-1);

        // todo: add try error block
        await cloudinary.uploader.destroy(coverImagePublicId)
        await cloudinary.uploader.destroy(bookImagePublicId, { resource_type: 'raw' })

        await bookModel.deleteOne({_id: bookId})

        return res.sendStatus(204)
 }

export { createBook, updateBook, listBooks , getBook, deleteBook}