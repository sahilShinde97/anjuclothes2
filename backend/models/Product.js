import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 90,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Uncategorized',
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    sizes: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

const Product = mongoose.model('Product', productSchema)

export default Product
