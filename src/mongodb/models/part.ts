import mongoose from 'mongoose'

const Schema = mongoose.Schema

export const partSchema = new Schema(
  {
    partNumber: {
      type: String,
      required: true,
      unique: true
    },
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
const PartModel = mongoose.models.Part || mongoose.model('Part', partSchema)

export default PartModel
