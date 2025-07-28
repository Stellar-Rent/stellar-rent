#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Env, Map, String, Symbol, Vec,
};

#[contracttype]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Review {
    pub id: Symbol,
    pub booking_id: Symbol,
    pub reviewer_did: Symbol,
    pub target_did: Symbol,
    pub rating: u32,
    pub comment: String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReputationScoresMap {
    pub reputation_scores: Map<Symbol, u32>,
}

#[contracttype]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReviewMap {
    pub reviews: Map<Symbol, Vec<Symbol>>,
}

#[contracttype]
pub enum StorageKey {
    Review(Symbol),
    ReputationScoresMap(Symbol),
    ReviewMap(Symbol),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ReviewError {
    InvalidRating = 1,
    DuplicateReview = 2,
    UnauthorizedReviewer = 3,
    InvalidInput = 4,
}

#[contract]
pub struct ReviewContract;

#[contractimpl]
impl ReviewContract {
    pub fn submit_review(
        env: &Env,
        booking_id: Symbol,
        reviewer_did: Symbol,
        target_did: Symbol,
        rating: u32,
        comment: String,
    ) -> Result<Symbol, ReviewError> {
        // Validate input
        (if rating < 1 || rating > 5 {
            return Err(ReviewError::InvalidRating);
        });
        // Validate comment length (e.g., max 500 characters)
        if comment.len() > 500 {
            return Err(ReviewError::InvalidInput);
        }
        let empty = Symbol::new(env, "");
        if booking_id == empty || reviewer_did == empty || target_did == empty {
            return Err(ReviewError::InvalidInput);
        }
        // Prevent duplicate review (same reviewer, booking, and target)
        let map_key = StorageKey::ReviewMap(target_did.clone());
        let mut reviews: Vec<Review> = env
            .storage()
            .persistent()
            .get(&map_key)
            .unwrap_or_else(|| Vec::new(env));
        for review in reviews.iter() {
            if review.booking_id == booking_id && review.reviewer_did == reviewer_did {
                return Err(ReviewError::DuplicateReview);
            }
        }
        let review = Review {
            id: symbol_short!("review"), // id is not used for lookup, keep placeholder
            booking_id: booking_id.clone(),
            reviewer_did: reviewer_did.clone(),
            target_did: target_did.clone(),
            rating,
            comment,
            timestamp: env.ledger().timestamp(),
        };
        reviews.push_back(review);
        env.storage().persistent().set(&map_key, &reviews);
        Ok(booking_id)
    }

    pub fn get_reviews_for_user(env: &Env, user_did: Symbol) -> Vec<Review> {
        let key = StorageKey::ReviewMap(user_did);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env))
    }

    pub fn get_reputation(env: &Env, user_did: Symbol) -> u32 {
        let key = StorageKey::ReputationScoresMap(user_did);
        env.storage().persistent().get(&key).unwrap_or(0)
    }
}

mod test;
