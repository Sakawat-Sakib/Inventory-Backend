const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json(categories);
}));

// Create new category
router.post('/', asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json({ message: 'Category already exists' });
  }

  const category = new Category({ name });
  await category.save();
  res.status(201).json(category);
}));

// Get products count by category
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $group: {
        _id: '$category',
        name: { $first: '$categoryInfo.name' },
        count: { $sum: 1 }
      }
    }
  ]);
  res.json(stats);
}));

module.exports = router; 