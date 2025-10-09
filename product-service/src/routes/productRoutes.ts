import { Router, Request, Response } from "express";
import { Product } from "../models/Product";

const router = Router();

/**
 * @route   GET /products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Check if product is active
    if (!product.isActive) {
      res.status(404).json({
        success: false,
        message: "Product is not available",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);

    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @route   GET /products
 * @desc    Get all products with optional filters
 * @access  Public
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, minPrice, maxPrice, inStock } = req.query;

    // Build filter object
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    const products = await Product.find(filter).select("-__v");

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @route   GET /products/sku/:sku
 * @desc    Get product by SKU
 * @access  Public
 */
router.get("/sku/:sku", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku } = req.params;

    const product = await Product.findOne({
      sku: sku.toUpperCase(),
      isActive: true,
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error fetching product by SKU:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
