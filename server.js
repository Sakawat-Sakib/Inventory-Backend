const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const Category = require('./models/Category');
const Product = require('./models/Product');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allows all origins (not recommended for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.delete('/api/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // First check if the category exists
    const categoryToDelete = await Category.findById(categoryId);
    if (!categoryToDelete) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Don't allow deletion of Uncategorized category
    if (categoryToDelete.name === 'Uncategorized') {
      return res.status(400).json({ message: 'Cannot delete the Uncategorized category' });
    }
    
    // Find the Uncategorized category
    const uncategorizedCategory = await Category.findOne({ name: 'Uncategorized' });
    
    if (!uncategorizedCategory) {
      return res.status(500).json({ message: 'Uncategorized category not found' });
    }

    // Move all products from the deleted category to Uncategorized
    await Product.updateMany(
      { category: categoryId },
      { category: uncategorizedCategory._id }
    );

    // Delete the category
    await Category.findByIdAndDelete(categoryId);

    res.json({ 
      message: 'Category deleted successfully',
      uncategorizedId: uncategorizedCategory._id 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      message: 'Failed to delete category',
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 