import { Router, Request, Response } from 'express';
import { Customer } from '../models/Customer';

const router = Router();

/**
 * @route   GET /customers/:id
 * @desc    Get customer by ID
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /customers
 * @desc    Get all customers (optional - for testing)
 * @access  Public
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const customers = await Customer.find().select('-__v');

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;