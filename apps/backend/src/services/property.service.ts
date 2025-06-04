import { supabase } from '../config/supabase';
import type { PropertyResponse } from '../types/property.types';

async function getPropertyById(id: string): Promise<PropertyResponse> {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid property ID format.');
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select(
        `
          id,
          title,
          description,
          price,
          location_address,
          location_city,
          location_country,
          location_coordinates,
          amenities,
          images,
          bedrooms,
          bathrooms,
          max_guests,
          owner_id,
          status,
          availability,
          security_deposit,
          cancellation_policy,
          created_at,
          updated_at
        `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error fetching property:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error(`No property found with ID ${id}`);
    }

    const property: PropertyResponse = {
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      location: {
        address: data.location_address,
        city: data.location_city,
        country: data.location_country,
        coordinates: data.location_coordinates || undefined,
      },
      amenities: data.amenities,
      images: data.images,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      maxGuests: data.max_guests,
      ownerId: data.owner_id,
      status: data.status,
      availability: data.availability,
      securityDeposit: data.security_deposit,
      cancellationPolicy: data.cancellation_policy || undefined,
      createdAt: new Date(data.created_at).toISOString(),
      updatedAt: new Date(data.updated_at).toISOString(),
    };

    return property;
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    console.error('Unexpected error in getPropertyById:', error);
    throw new Error(
      'An unexpected error occurred while retrieving the property.'
    );
  }
}

export default { getPropertyById };
