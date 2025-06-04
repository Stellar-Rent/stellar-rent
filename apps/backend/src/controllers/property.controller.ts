import type { Request, Response } from 'express';
import propertyService from '../services/property.service';
export const getPropertyById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Property ID is required',
    });
  }

  try {
    const property = await propertyService.getPropertyById(id);
    res.status(200).json({ property });
  } catch (error: any) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message.includes('No property found')) {
      return res.status(404).json({
        error: 'Property not found',
        message: error.message,
      });
    } else if (message === 'Invalid property ID format.') {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message,
      });
    } else if (message.includes('Database error')) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    } else {
      console.error('Unhandled error in getPropertyById controller:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred.',
      });
    }
  }
};
