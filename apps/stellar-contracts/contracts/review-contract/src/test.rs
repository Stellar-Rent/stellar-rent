#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String, Symbol};

#[test]
fn test_submit_review_success() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let booking_id = Symbol::new(&env, "booking1");
    let reviewer_did = Symbol::new(&env, "reviewer1");
    let target_did = Symbol::new(&env, "target1");
    let comment = String::from_str(&env, "Great experience!");

    let result = client.submit_review(&booking_id, &reviewer_did, &target_did, &5, &comment);
    assert_eq!(result, booking_id);
    let reviews = client.get_reviews_for_user(&target_did);
    assert_eq!(reviews.len(), 1);
    assert_eq!(reviews.get(0).unwrap().rating, 5);
    assert_eq!(reviews.get(0).unwrap().comment, comment);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_submit_review_invalid_rating_zero() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let booking_id = Symbol::new(&env, "booking1");
    let reviewer_did = Symbol::new(&env, "reviewer1");
    let target_did = Symbol::new(&env, "target1");
    let comment = String::from_str(&env, "Great experience!");

    client.submit_review(&booking_id, &reviewer_did, &target_did, &0, &comment);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_submit_review_invalid_rating_six() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let booking_id = Symbol::new(&env, "booking1");
    let reviewer_did = Symbol::new(&env, "reviewer1");
    let target_did = Symbol::new(&env, "target1");
    let comment = String::from_str(&env, "Great experience!");

    client.submit_review(&booking_id, &reviewer_did, &target_did, &6, &comment);
}

#[test]
fn test_get_reviews_for_user() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let target_did = Symbol::new(&env, "target1");
    let reviewer1 = Symbol::new(&env, "reviewer1");
    let reviewer2 = Symbol::new(&env, "reviewer2");
    let booking1 = Symbol::new(&env, "booking1");
    let booking2 = Symbol::new(&env, "booking2");
    let comment1 = String::from_str(&env, "Great experience!");
    let comment2 = String::from_str(&env, "Good service");

    let _ = client.submit_review(&booking1, &reviewer1, &target_did, &5, &comment1);
    let _ = client.submit_review(&booking2, &reviewer2, &target_did, &4, &comment2);

    let reviews = client.get_reviews_for_user(&target_did);
    assert_eq!(reviews.len(), 2);
    assert_eq!(reviews.get(0).unwrap().target_did, target_did);
    assert_eq!(reviews.get(1).unwrap().target_did, target_did);
}

#[test]
fn test_get_reviews_for_user_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let user_did = Symbol::new(&env, "user_with_no_reviews");
    let reviews = client.get_reviews_for_user(&user_did);
    assert_eq!(reviews.len(), 0);
}

#[test]
fn test_get_reputation_default() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let user_did = Symbol::new(&env, "user_with_no_reputation");
    let reputation = client.get_reputation(&user_did);
    assert_eq!(reputation, 0);
}

#[test]
fn test_multiple_users_isolated() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let user1 = Symbol::new(&env, "user1");
    let user2 = Symbol::new(&env, "user2");
    let reviewer = Symbol::new(&env, "reviewer");
    let booking1 = Symbol::new(&env, "booking1");
    let booking2 = Symbol::new(&env, "booking2");
    let comment = String::from_str(&env, "Good experience");

    let _ = client.submit_review(&booking1, &reviewer, &user1, &5, &comment);
    let _ = client.submit_review(&booking2, &reviewer, &user2, &4, &comment);

    let user1_reviews = client.get_reviews_for_user(&user1);
    let user2_reviews = client.get_reviews_for_user(&user2);

    assert_eq!(user1_reviews.len(), 1);
    assert_eq!(user2_reviews.len(), 1);
    assert_eq!(user1_reviews.get(0).unwrap().target_did, user1);
    assert_eq!(user2_reviews.get(0).unwrap().target_did, user2);
}

#[test]
fn test_review_rating_values() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let target_did = Symbol::new(&env, "target");
    let reviewer = Symbol::new(&env, "reviewer");
    let comment = String::from_str(&env, "Test comment");

    let booking_ids = [
        Symbol::new(&env, "booking1"),
        Symbol::new(&env, "booking2"),
        Symbol::new(&env, "booking3"),
        Symbol::new(&env, "booking4"),
        Symbol::new(&env, "booking5"),
    ];
    for (i, rating) in (1..=5).enumerate() {
        let booking_id = &booking_ids[i];
        let result = client.submit_review(booking_id, &reviewer, &target_did, &rating, &comment);
        assert_eq!(result, *booking_id);
    }
    let reviews = client.get_reviews_for_user(&target_did);
    assert_eq!(reviews.len(), 5);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_duplicate_review_prevention() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReviewContract);
    let client = ReviewContractClient::new(&env, &contract_id);

    let booking_id = Symbol::new(&env, "booking1");
    let reviewer_did = Symbol::new(&env, "reviewer1");
    let target_did = Symbol::new(&env, "target1");
    let comment = String::from_str(&env, "Great experience!");

    let result1 = client.submit_review(&booking_id, &reviewer_did, &target_did, &5, &comment);
    assert_eq!(result1, booking_id);
    // Second submission with same booking_id and reviewer should panic
    client.submit_review(&booking_id, &reviewer_did, &target_did, &4, &comment);
}
