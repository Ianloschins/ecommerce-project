const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// REGISTER
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const newUser = await prisma.user.create({
      data: { email, password }
    });

    res.status(201).json({ message: 'User registered', user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(5555, () => {
  console.log("🚀 Backend server running at http://localhost:5555");
});

// POST PRODUCT
app.post('/products', async (req, res) => {
  try {
    const { title, price, category, description, image } = req.body;

    const newProduct = await prisma.product.create({
      data: { title, price: parseFloat(price), category, description, image }
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// GET PRODUCTS
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});


// DELETE product by ID
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Product deleted", product: deleted });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});


// BULK UPLOAD PRODUCTS
app.post('/products/bulk', async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Expected an array of products' });
    }

    const created = await prisma.product.createMany({
      data: products.map(p => ({
        title: p.title,
        price: parseFloat(p.price),
        category: p.category,
        description: p.description,
        image: p.image
      })),
      skipDuplicates: true
    });

    res.status(201).json({ message: 'Bulk upload successful', count: created.count });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
