import { Router } from 'express';
import {
  createPropertyController,
  deletePropertyController,
  getAllowedAmenitiesController,
  getPropertiesByOwnerController,
  getPropertyByIdController,
  searchPropertiesController,
  updatePropertyAvailabilityController,
  updatePropertyController,
  updatePropertyStatusController,
} from '../controllers/property.controller';
import { processImageUploads, upload } from '../middleware/upload.middleware';
import {
  authenticateToken,
  validateOwnerId,
  validatePropertyId,
} from '../validators/property.validator';

const router = Router();

// Public routes (NO auth required)
router.get('/amenities', getAllowedAmenitiesController);
router.get('/', searchPropertiesController);
router.get('/:id', validatePropertyId, getPropertyByIdController);

// Protected routes (require token)
router.post(
  '/',
  authenticateToken,
  upload.array('images', 10),
  processImageUploads,
  createPropertyController
);

router.put(
  '/:id',
  authenticateToken,
  validatePropertyId,
  upload.array('images', 10),
  processImageUploads,
  updatePropertyController
);

router.delete('/:id', authenticateToken, validatePropertyId, deletePropertyController);

router.get('/owner/:ownerId', authenticateToken, validateOwnerId, getPropertiesByOwnerController);

router.patch(
  '/:id/availability',
  authenticateToken,
  validatePropertyId,
  updatePropertyAvailabilityController
);

router.patch('/:id/status', authenticateToken, validatePropertyId, updatePropertyStatusController);

export default router;
