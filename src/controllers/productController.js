import * as productService from '../services/productService.js';

export const getProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productService.getProductById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = async (req, res) => {
  const { name, price, points, image_url, description, precio_puntos, category, sub_category, is_active } = req.body;
  if (!name || price == null)
    return res.status(400).json({ message: 'name and price are required' });
  try {
    const product = await productService.createProduct({ name, price, points, image_url, description, precio_puntos, category, sub_category, is_active });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, points, image_url, description, precio_puntos, category, sub_category, is_active } = req.body;
  try {
    const updated = await productService.updateProduct(id, { name, price, points, image_url, description, precio_puntos, category, sub_category, is_active });
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await productService.deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
