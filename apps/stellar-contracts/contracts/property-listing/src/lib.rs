#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, Symbol, Vec, String,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PropertyStatus {
    Available,
    Booked,
    Maintenance,
    Inactive,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PropertyListing {
    pub id: String,
    pub data_hash: String,
    pub owner: Address,
    pub status: PropertyStatus,
}

const LISTINGS: Symbol = symbol_short!("LISTINGS");

#[contract]
pub struct PropertyListingContract;

#[contractimpl]
impl PropertyListingContract {
    /// Create a new property listing
    pub fn create_listing(
        env: Env,
        id: String,
        data_hash: String,
        owner: Address,
    ) -> PropertyListing {
        // Verify the owner is the caller
        owner.require_auth();

        let key = (LISTINGS.clone(), id.clone());

        // Check if listing already exists
        if env.storage().persistent().has(&key) {
            panic!("Property listing already exists");
        }

        let listing = PropertyListing {
            id: id.clone(),
            data_hash,
            owner,
            status: PropertyStatus::Available,
        };

        // Store the listing
        env.storage().persistent().set(&key, &listing);

        listing
    }

    /// Update an existing property listing
    pub fn update_listing(
        env: Env,
        id: String,
        data_hash: String,
        owner: Address,
    ) -> PropertyListing {
        // Verify the owner is the caller
        owner.require_auth();

        let key = (LISTINGS.clone(), id.clone());
        
        // Get existing listing
        let mut listing: PropertyListing = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Property listing not found"));

        // Verify ownership
        if listing.owner != owner {
            panic!("Only the owner can update the listing");
        }

        // Update the data hash
        listing.data_hash = data_hash;

        // Store updated listing
        env.storage().persistent().set(&key, &listing);

        listing
    }

    /// Update property status
    pub fn update_status(
        env: Env,
        id: String,
        owner: Address,
        status: PropertyStatus,
    ) -> PropertyListing {
        // Verify the owner is the caller
        owner.require_auth();

        let key = (LISTINGS.clone(), id.clone());
        
        // Get existing listing
        let mut listing: PropertyListing = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Property listing not found"));

        // Verify ownership
        if listing.owner != owner {
            panic!("Only the owner can update the status");
        }

        // Update status
        listing.status = status;

        // Store updated listing
        env.storage().persistent().set(&key, &listing);

        listing
    }

    /// Get a property listing by ID
    pub fn get_listing(env: Env, id: String) -> Option<PropertyListing> {
        let key = (LISTINGS.clone(), id);
        env.storage().persistent().get(&key)
    }

    /// Get all listings (simplified implementation)
    pub fn get_all_listings(env: Env) -> Vec<PropertyListing> {
        // Note: This is a simplified implementation
        // In production, you'd want pagination and proper iteration
        vec![&env]
    }
}

mod test;
