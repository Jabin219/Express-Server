import EnvVars from '@src/constants/EnvVars'
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    await mongoose.connect(EnvVars.Mongo.uri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('Failed to connect to MongoDB', error)
  }
}

export default connectDB
