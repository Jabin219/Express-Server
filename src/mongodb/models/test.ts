import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const testSchema = new Schema(
  {
    partNumber: {
      type: String,
      required: true
    },
    year: {
      type: String,
      required: true
    },
    make: { type: String, required: true },
    model: { type: String, required: true },
    type: { type: String, required: true },
    engine: { type: String, required: true },
    application: { type: String },
    location: { type: String },
    brand: { type: String },
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
);

// 创建唯一索引，确保相同字段组合的记录不会重复
testSchema.index(
  {
    partNumber: 1,
    application: 1,
    supplier: 1,
    location: 1,
    brand: 1,
    year: 1,
    make: 1,
    model: 1,
    type: 1,
    engine: 1
  },
  { unique: true }
);

// 定义新的模型 `TestModel`，并确保它指向 MongoDB 中的 `test` 集合
const TestModel = mongoose.models.Test || mongoose.model('Test', testSchema);

export default TestModel;