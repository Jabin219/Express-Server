import mongoose from 'mongoose'

const Schema = mongoose.Schema

export const partSchema = new Schema(
  {
    partNumber: {
      type: String,
      required: true
    },
    application: { type: String },
    year: {
      type: String,
      required: true
    },
    make: { type: String, required: true },
    model: { type: String, required: true },
    type: { type: String, required: true },
    engine: { type: String, required: true },
    supplier: {
      type: String,
      required: true
    },
    partType: {
      type: String,
      required: true
    },
    qty: {
      type: Number,
      required: true
    },
    othersByJson: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

partSchema.index(
  {
    partNumber: 1,
    application: 1,
    year: 1,
    make: 1,
    model: 1,
    type: 1,
    engine: 1
  },
  { unique: true }
)
const PartModel = mongoose.models.Part || mongoose.model('Part', partSchema)

export default PartModel
