const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const axios = require('axios');
const asyncHandler = require('express-async-handler');

// Get all products with pagination
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find()
    .populate('category')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments();

  res.json({
    products,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalProducts: total
  });
}));

// Get products by category
router.get('/category/:categoryId', asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const products = await Product.find({ category: categoryId }).populate('category');
  res.json(products);
}));

// Add product from barcode
router.post('/scan', asyncHandler(async (req, res) => {
  const { barcode } = req.body;
  
  // Check if product already exists
  const existingProduct = await Product.findOne({ barcode });
  if (existingProduct) {
    return res.status(400).json({ message: 'Product already exists' });
  }

  // Fetch product details from external API
  const response = await axios.get(`${process.env.PRODUCT_API_URL}/${barcode}`);
  const productData = response.data.product;

  // Get Uncategorized category (create if doesn't exist)
  let uncategorizedCategory = await Category.findOne({ name: 'Uncategorized' });
  if (!uncategorizedCategory) {
    uncategorizedCategory = await Category.create({ name: 'Uncategorized' });
  }

  // Create new product
  const product = new Product({
    material: productData.material,
    barcode: productData.barcode,
    description: productData.description,
    category: uncategorizedCategory._id
  });

  await product.save();
  
  // Populate category before sending response
  await product.populate('category');
  res.status(201).json(product);
}));

// Update product category
router.patch('/:id/category', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { categoryId } = req.body;

  const product = await Product.findByIdAndUpdate(
    id,
    { category: categoryId },
    { new: true }
  ).populate('category');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
}));

module.exports = router; 