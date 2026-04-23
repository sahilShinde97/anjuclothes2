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
    groupId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    colorName: {
      type: String,
      trim: true,
      default: '',
    },
    colorHex: {
      type: String,
      trim: true,
      uppercase: true,
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
    reviews: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          name: {
            type: String,
            required: true,
            trim: true,
          },
          rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
          },
          comment: {
            type: String,
            trim: true,
            default: '',
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
)

const Product = mongoose.model('Product', productSchema)

export default Product
