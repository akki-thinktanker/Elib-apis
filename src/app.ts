import express, { Request, NextFunction, Response } from 'express'
import { stat } from 'fs'

import globalErrorHandler from './middlewares/globalErrorHandler'
import userRouter from './user/userRouter'
import bookRouter from './book/bookRouter'

const app = express()

app.use(express.json())

// Routes
// HTTP methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
app.get('/', (req, res, next) => {
   
    res.json({ message: 'Welcome to elib apis' })
})

app.use('/api/users',userRouter)
app.use('/api/books',bookRouter)

// Global error handler 
app.use(globalErrorHandler)

export default app;
