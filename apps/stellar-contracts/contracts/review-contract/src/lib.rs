#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Map, String, Symbol, Vec};

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
    ) -> Symbol {
        let timestamp = env.ledger().timestamp();
        let sequence = env.ledger().sequence();

        let review_id = Symbol::new(env, "review");

        let review = Review {
            id: review_id.clone(),
            booking_id,
            reviewer_did,
            target_did,
            rating,
            comment,
            timestamp,
        };

        let key = StorageKey::Review(review_id.clone());
        env.storage().persistent().set(&key, &review);

        review_id
    }
    pub fn get_reviews_for_user(env: &Env, user_did: Symbol) -> Vec<Review> {
        let key = StorageKey::ReviewMap(user_did.clone());
        let mut user_reviews: Vec<Review> = Vec::new(env);
        let reviews: Map<Symbol, Vec<Symbol>> = env.storage().persistent().get(&key).unwrap();

        reviews.iter().for_each(|(_, review_ids)| {
            review_ids.iter().for_each(|review_id| {
                let key = StorageKey::Review(review_id.clone());
                if let Some(review) = env.storage().persistent().get::<_, Review>(&key) {
                    if review.target_did == user_did {
                        user_reviews.push_back(review);
                    }
                }
            });
        });

        user_reviews
    }
    pub fn get_reputation(env: &Env, user_did: Symbol) -> u32 {
        let key = StorageKey::ReputationScoresMap(user_did);
        env.storage().persistent().get(&key).unwrap()
    }
}

mod test;
