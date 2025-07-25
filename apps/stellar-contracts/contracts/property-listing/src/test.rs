#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_listing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let id = String::from_str(&env, "PROP1");
    let data_hash = String::from_str(&env, "hash123");

    env.mock_all_auths();

    let listing = client.create_listing(&id, &data_hash, &owner);
    
    assert_eq!(listing.id, id);
    assert_eq!(listing.data_hash, data_hash);
    assert_eq!(listing.owner, owner);
    assert_eq!(listing.status, PropertyStatus::Available);
}

#[test]
#[should_panic(expected = "Property listing already exists")]
fn test_create_duplicate_listing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let id = String::from_str(&env, "PROP1");
    let data_hash = String::from_str(&env, "hash123");

    env.mock_all_auths();

    // Create first listing
    client.create_listing(&id, &data_hash, &owner);

    // Try to create duplicate - should panic
    client.create_listing(&id, &data_hash, &owner);
}

#[test]
fn test_update_listing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let id = String::from_str(&env, "PROP1");
    let data_hash = String::from_str(&env, "hash123");
    let new_hash = String::from_str(&env, "newhash456");

    env.mock_all_auths();

    // Create listing
    client.create_listing(&id, &data_hash, &owner);

    // Update listing
    let updated_listing = client.update_listing(&id, &new_hash, &owner);
    
    assert_eq!(updated_listing.id, id);
    assert_eq!(updated_listing.data_hash, new_hash);
    assert_eq!(updated_listing.owner, owner);
    assert_eq!(updated_listing.status, PropertyStatus::Available);
}

#[test]
#[should_panic(expected = "Only the owner can update the listing")]
fn test_update_listing_unauthorized() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let id = String::from_str(&env, "PROP1");
    let data_hash = String::from_str(&env, "hash123");
    let new_hash = String::from_str(&env, "newhash456");

    env.mock_all_auths();

    // Create listing
    client.create_listing(&id, &data_hash, &owner);

    // Try to update with unauthorized user - should panic
    client.update_listing(&id, &new_hash, &unauthorized);
}

#[test]
fn test_update_status() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let id = String::from_str(&env, "PROP1");
    let data_hash = String::from_str(&env, "hash123");

    env.mock_all_auths();

    // Create listing
    client.create_listing(&id, &data_hash, &owner);

    // Update status
    let updated_listing = client.update_status(&id, &owner, &PropertyStatus::Booked);
    
    assert_eq!(updated_listing.id, id);
    assert_eq!(updated_listing.data_hash, data_hash);
    assert_eq!(updated_listing.owner, owner);
    assert_eq!(updated_listing.status, PropertyStatus::Booked);
}

#[test]
#[should_panic(expected = "Only the owner can update the status")]
fn test_update_status_unauthorized() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let id = String::from_str(&env, "PROP1");
    let data_hash = String::from_str(&env, "hash123");

    env.mock_all_auths();

    // Create listing
    client.create_listing(&id, &data_hash, &owner);

    // Try to update status with unauthorized user - should panic
    client.update_status(&id, &unauthorized, &PropertyStatus::Booked);
}

#[test]
fn test_get_listing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let id = String::from_str(&env, "PROP1");
    let data_hash = String::from_str(&env, "hash123");

    env.mock_all_auths();

    // Create listing
    client.create_listing(&id, &data_hash, &owner);

    // Get listing
    let listing = client.get_listing(&id);
    assert!(listing.is_some());

    let listing = listing.unwrap();
    assert_eq!(listing.id, id);
    assert_eq!(listing.data_hash, data_hash);
    assert_eq!(listing.owner, owner);
    assert_eq!(listing.status, PropertyStatus::Available);
}

#[test]
fn test_get_nonexistent_listing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let id = String::from_str(&env, "NONEXISTENT");
    let listing = client.get_listing(&id);
    assert!(listing.is_none());
}

#[test]
fn test_multiple_listings() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PropertyListingContract);
    let client = PropertyListingContractClient::new(&env, &contract_id);

    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    
    let id1 = String::from_str(&env, "PROP1");
    let id2 = String::from_str(&env, "PROP2");
    
    let hash1 = String::from_str(&env, "hash123");
    let hash2 = String::from_str(&env, "hash456");

    env.mock_all_auths();

    // Create multiple listings
    let listing1 = client.create_listing(&id1, &hash1, &owner1);
    let listing2 = client.create_listing(&id2, &hash2, &owner2);

    // Verify both listings exist and are independent
    assert_eq!(listing1.id, id1);
    assert_eq!(listing1.owner, owner1);
    
    assert_eq!(listing2.id, id2);
    assert_eq!(listing2.owner, owner2);

    // Verify we can retrieve both
    let retrieved1 = client.get_listing(&id1).unwrap();
    let retrieved2 = client.get_listing(&id2).unwrap();

    assert_eq!(retrieved1.id, id1);
    assert_eq!(retrieved2.id, id2);
}
