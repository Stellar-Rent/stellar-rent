# ReviewContract Smart Contract Documentation

## Overview

**StellarRent** is a decentralized, peer-to-peer rental platform built on the Stellar blockchain. It aims to provide secure, transparent, and cost-efficient rentals for everyone, eliminating high fees, slow payments, and lack of transparency found in traditional rental platforms.

The **ReviewContract** enables transparent and immutable recording of reviews and reputation scores on the StellarRent platform. It allows tenants and hosts to leave reviews after a stay, stores reviews on-chain to prevent tampering, and provides reputation tracking. This contract is written in Rust using Soroban and is deployed on the Stellar network.

---

## What Does the ReviewContract Do?

- **Review Submission**: Allows tenants and hosts to submit reviews (rating 1-5 and comment) after a booking is completed.
- **Review Retrieval**: Enables users to retrieve all reviews for any user on the platform.
- **Duplicate Prevention**: Prevents the same reviewer from submitting multiple reviews for the same booking.
- **Input Validation**: Validates ratings (1-5 only) and ensures all required fields are provided.
- **Reputation Tracking**: Provides reputation score retrieval (currently returns default values).

---

## Why "review-contract"?

The contract is named `review-contract` because its main purpose is to manage reviews and reputation scores for StellarRent users.

---

## How Does It Work?

### Data Model (On-Chain)

Each review stored on-chain contains:
- **ID**: Unique identifier (currently placeholder, not used for lookup).
- **Booking ID**: Reference to the booking being reviewed.
- **Reviewer DID**: The decentralized identity of the person leaving the review.
- **Target DID**: The decentralized identity of the person being reviewed.
- **Rating**: Numeric rating from 1 to 5.
- **Comment**: Text comment describing the experience.
- **Timestamp**: When the review was submitted.

### Storage Structure

- **ReviewMap**: Maps each user's DID to a vector of `Review` structs containing all reviews for that user.
- **ReputationScoresMap**: Maps user DIDs to reputation scores (currently returns default values).

---

## Core Functions

### 1. Submit Review

**Purpose:** Submit a review for a user after a booking is completed.

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source alice \
  -- submit_review \
  --booking_id booking123 \
  --reviewer_did alice \
  --target_did bob \
  --rating 5 \
  --comment "Great experience"
```

**Parameters:**
- `booking_id`: Unique identifier for the booking being reviewed.
- `reviewer_did`: DID of the person leaving the review (use simple identifier without `did:stellar:` prefix).
- `target_did`: DID of the person being reviewed (use simple identifier without `did:stellar:` prefix).
- `rating`: Numeric rating from 1 to 5.
- `comment`: Text comment describing the experience.

**Result:**  
Returns the booking ID on success. Fails if:
- Rating is not between 1-5 (Error #1)
- Any required field is empty
- Same reviewer has already reviewed this booking for this target (Error #2)

---

### 2. Get Reviews for User

**Purpose:** Retrieve all reviews for a specific user.

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source alice \
  -- get_reviews_for_user \
  --user_did bob
```

**Parameters:**
- `user_did`: DID of the user whose reviews to retrieve (use simple identifier without `did:stellar:` prefix).

**Result:**  
Returns a vector of all `Review` structs for the specified user. Returns empty vector if no reviews exist.

---

### 3. Get Reputation

**Purpose:** Retrieve the reputation score for a user.

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source alice \
  -- get_reputation \
  --user_did bob
```

**Parameters:**
- `user_did`: DID of the user whose reputation to retrieve (use simple identifier without `did:stellar:` prefix).

**Result:**  
Returns the reputation score (currently returns 0 as default).

---

## Error Handling

The contract defines the following error types:

- **InvalidRating**: Rating must be between 1 and 5.
- **DuplicateReview**: Same reviewer cannot review the same booking twice.
- **UnauthorizedReviewer**: Used for input validation errors (empty fields).

---

## How Does It Integrate with the Backend/Frontend?

### Backend (Node.js/Express + Supabase)

- **Submit Review:**
  1. User submits review via frontend after booking completion.
  2. Backend validates the booking exists and is completed.
  3. Backend invokes `submit_review` on the contract with booking details.
  4. Backend stores additional metadata in Supabase if needed.

- **Retrieve Reviews:**
  1. Frontend requests reviews for a user.
  2. Backend invokes `get_reviews_for_user` on the contract.
  3. Backend returns the reviews to the frontend.

- **Display Reputation:**
  1. Frontend requests user reputation.
  2. Backend invokes `get_reputation` on the contract.
  3. Backend returns the reputation score.

### Frontend (Next.js)

- Displays review forms after booking completion.
- Shows user reviews and ratings on profile pages.
- Displays reputation scores for users.
- Handles error messages from contract failures.

---

## Security & Trust

- **Duplicate Prevention**: Prevents spam reviews by the same reviewer for the same booking.
- **Input Validation**: Ensures ratings are valid and all fields are provided.
- **Immutable Storage**: Reviews are stored on-chain and cannot be tampered with.
- **DID Integration**: Uses decentralized identities for user identification.

---

## Example Workflow

1. **Booking Completion:**  
   - Tenant completes stay at host's property.
   - Booking is marked as completed in the system.

2. **Review Submission:**  
   - Tenant submits review via frontend.
   - Backend validates booking completion.
   - Contract stores review on-chain.

3. **Review Retrieval:**  
   - Other users can view reviews for the host.
   - Reviews are displayed on host's profile page.

4. **Reputation Display:**  
   - Host's reputation score is calculated and displayed.
   - Helps future tenants make informed decisions.

---

## Testing

The contract includes comprehensive tests covering:

- ✅ Valid review submission and retrieval
- ✅ Invalid rating validation (0, 6, etc.)
- ✅ Duplicate review prevention
- ✅ Multiple users with isolated reviews
- ✅ Empty review retrieval
- ✅ Reputation default values
- ✅ Various rating values (1-5)

Run tests with:
```bash
cd contracts/review-contract
cargo test
```

---

## Resources

- [Stellar CLI Docs](https://developers.stellar.org/docs/tools/cli/stellar-cli)
- [Soroban Smart Contracts](https://developers.stellar.org/docs/build/smart-contracts)
- [StellarRent GitBook](https://stellar-rent.gitbook.io/stellar-rent)

---

## TL;DR

- The `review-contract` manages user reviews and reputation on StellarRent.
- Users can submit reviews (1-5 rating + comment) after booking completion.
- Reviews are stored on-chain and cannot be tampered with.
- Duplicate reviews are prevented automatically.
- All reviews for a user can be retrieved via their DID.
- The contract integrates with idOS for decentralized identity verification.
- Comprehensive test coverage ensures reliability.

---

**Let's build a fairer, more transparent rental ecosystem together! 🌟**
