import mongoose from 'mongoose'

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in backend/.env')
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`)
  }
}

export default connectDB
