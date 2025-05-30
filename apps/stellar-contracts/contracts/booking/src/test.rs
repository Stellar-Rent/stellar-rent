#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, String};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    // Verify initialization by attempting to create a booking
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let start_date = 1704067200u64; // Jan 1, 2024
    let end_date = 1704153600u64;   // Jan 2, 2024
    let total_price = 1000000000i128; // 100 USDC
    
    let booking_id = client.create_booking(&property_id, &user_id, &start_date, &end_date, &total_price);
    assert_eq!(booking_id, 0u64);
}

#[test]
fn test_check_availability_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let start_date = 1704067200u64;
    let end_date = 1704153600u64;
    
    // Should be available when no bookings exist
    assert!(client.check_availability(&property_id, &start_date, &end_date));
}

#[test]
fn test_create_booking_success() {
    let env = Env::default();
    env.mock_all_auths();
    
    // Set a mock timestamp
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800; // Dec 31, 2023
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let start_date = 1704067200u64; // Jan 1, 2024
    let end_date = 1704153600u64;   // Jan 2, 2024
    let total_price = 1000000000i128;
    
    let booking_id = client.create_booking(&property_id, &user_id, &start_date, &end_date, &total_price);
    assert_eq!(booking_id, 0u64);
    
    // Verify booking was created
    let booking = client.get_booking(&booking_id);
    assert_eq!(booking.property_id, property_id);
    assert_eq!(booking.user_id, user_id);
    assert_eq!(booking.start_date, start_date);
    assert_eq!(booking.end_date, end_date);
    assert_eq!(booking.total_price, total_price);
    assert_eq!(booking.status, BookingStatus::Pending);
}

#[test]
#[should_panic(expected = "Booking overlap")]
fn test_booking_overlap_prevention() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id1 = String::from_str(&env, "USER1");
    let user_id2 = String::from_str(&env, "USER2");
    
    // Create first booking
    let start_date1 = 1704067200u64; // Jan 1, 2024
    let end_date1 = 1704240000u64;   // Jan 3, 2024
    let total_price = 2000000000i128;
    
    client.create_booking(&property_id, &user_id1, &start_date1, &end_date1, &total_price);
    
    // Try to create overlapping booking (starts during first booking)
    let start_date2 = 1704153600u64; // Jan 2, 2024
    let end_date2 = 1704326400u64;   // Jan 4, 2024
    
    // This should panic
    client.create_booking(&property_id, &user_id2, &start_date2, &end_date2, &total_price);
}

#[test]
fn test_non_overlapping_bookings() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id1 = String::from_str(&env, "USER1");
    let user_id2 = String::from_str(&env, "USER2");
    let total_price = 1000000000i128;
    
    // Create first booking
    let start_date1 = 1704067200u64; // Jan 1, 2024
    let end_date1 = 1704153600u64;   // Jan 2, 2024
    
    let booking_id1 = client.create_booking(&property_id, &user_id1, &start_date1, &end_date1, &total_price);
    assert_eq!(booking_id1, 0u64);
    
    // Create non-overlapping booking (starts after first booking ends)
    let start_date2 = 1704153600u64; // Jan 2, 2024
    let end_date2 = 1704240000u64;   // Jan 3, 2024
    
    let booking_id2 = client.create_booking(&property_id, &user_id2, &start_date2, &end_date2, &total_price);
    assert_eq!(booking_id2, 1u64);
}

#[test]
fn test_cancel_booking_success() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let start_date = 1704067200u64;
    let end_date = 1704153600u64;
    let total_price = 1000000000i128;
    
    // Create booking
    let booking_id = client.create_booking(&property_id, &user_id, &start_date, &end_date, &total_price);
    
    // Cancel booking
    let result = client.cancel_booking(&booking_id, &user_id);
    assert!(result);
    
    // Verify booking status is cancelled
    let booking = client.get_booking(&booking_id);
    assert_eq!(booking.status, BookingStatus::Cancelled);
    
    // Should be able to book the same dates after cancellation
    let user_id2 = String::from_str(&env, "USER2");
    client.create_booking(&property_id, &user_id2, &start_date, &end_date, &total_price);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_cancel_booking_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id1 = String::from_str(&env, "USER1");
    let user_id2 = String::from_str(&env, "USER2");
    let start_date = 1704067200u64;
    let end_date = 1704153600u64;
    let total_price = 1000000000i128;
    
    // Create booking with user1
    let booking_id = client.create_booking(&property_id, &user_id1, &start_date, &end_date, &total_price);
    
    // Try to cancel with different user - should panic
    client.cancel_booking(&booking_id, &user_id2);
}

#[test]
fn test_update_status() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let start_date = 1704067200u64;
    let end_date = 1704153600u64;
    let total_price = 1000000000i128;
    
    // Create booking
    let booking_id = client.create_booking(&property_id, &user_id, &start_date, &end_date, &total_price);
    
    // Update to confirmed
    let host = Address::generate(&env);
    let updated_booking = client.update_status(&booking_id, &BookingStatus::Confirmed, &host);
    assert_eq!(updated_booking.status, BookingStatus::Confirmed);
    
    // Update to completed
    let updated_booking = client.update_status(&booking_id, &BookingStatus::Completed, &host);
    assert_eq!(updated_booking.status, BookingStatus::Completed);
}

#[test]
#[should_panic(expected = "Invalid status transition")]
fn test_invalid_status_transition() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let start_date = 1704067200u64;
    let end_date = 1704153600u64;
    let total_price = 1000000000i128;
    
    // Create booking
    let booking_id = client.create_booking(&property_id, &user_id, &start_date, &end_date, &total_price);
    
    // Try invalid transition: Pending -> Completed - should panic
    let host = Address::generate(&env);
    client.update_status(&booking_id, &BookingStatus::Completed, &host);
}

#[test]
fn test_get_property_bookings() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id1 = String::from_str(&env, "USER1");
    let user_id2 = String::from_str(&env, "USER2");
    let total_price = 1000000000i128;
    
    // Create multiple bookings for the same property
    let start_date1 = 1704067200u64; // Jan 1, 2024
    let end_date1 = 1704153600u64;   // Jan 2, 2024
    client.create_booking(&property_id, &user_id1, &start_date1, &end_date1, &total_price);
    
    let start_date2 = 1704240000u64; // Jan 3, 2024
    let end_date2 = 1704326400u64;   // Jan 4, 2024
    client.create_booking(&property_id, &user_id2, &start_date2, &end_date2, &total_price);
    
    // Get all bookings for the property
    let bookings = client.get_property_bookings(&property_id);
    assert_eq!(bookings.len(), 2);
    
    // Verify both bookings are present
    assert_eq!(bookings.get(0).unwrap().user_id, user_id1);
    assert_eq!(bookings.get(1).unwrap().user_id, user_id2);
}

#[test]
#[should_panic(expected = "Invalid dates")]
fn test_invalid_dates() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1704067200; // Jan 1, 2024
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let total_price = 1000000000i128;
    
    // Test: end date before start date - should panic
    let start_date = 1704153600u64; // Jan 2, 2024
    let end_date = 1704067200u64;   // Jan 1, 2024
    
    client.create_booking(&property_id, &user_id, &start_date, &end_date, &total_price);
}

#[test]
#[should_panic(expected = "Invalid price")]
fn test_invalid_price() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let start_date = 1704067200u64;
    let end_date = 1704153600u64;
    
    // Test: zero price - should panic
    client.create_booking(&property_id, &user_id, &start_date, &end_date, &0i128);
}

#[test]
fn test_set_escrow_id() {
    let env = Env::default();
    env.mock_all_auths();
    
    env.ledger().with_mut(|li| {
        li.timestamp = 1703980800;
    });
    
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let property_id = String::from_str(&env, "PROP1");
    let user_id = String::from_str(&env, "USER1");
    let start_date = 1704067200u64;
    let end_date = 1704153600u64;
    let total_price = 1000000000i128;
    
    // Create booking
    let booking_id = client.create_booking(&property_id, &user_id, &start_date, &end_date, &total_price);
    
    // Set escrow ID
    let escrow_id = String::from_str(&env, "ESCROW123");
    let escrow_contract = Address::generate(&env);
    
    let result = client.set_escrow_id(&booking_id, &escrow_id, &escrow_contract);
    assert!(result);
    
    // Verify escrow ID was set
    let booking = client.get_booking(&booking_id);
    assert_eq!(booking.escrow_id, Some(escrow_id));
}

#[test]
#[should_panic(expected = "Booking not found")]
fn test_booking_not_found() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BookingContract);
    let client = BookingContractClient::new(&env, &contract_id);

    client.initialize();
    
    let booking_id = 999u64;
    
    // Test get_booking - should panic
    client.get_booking(&booking_id);
} 