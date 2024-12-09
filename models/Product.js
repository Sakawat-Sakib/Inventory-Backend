const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  material: {
    type: Number,
    required: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);