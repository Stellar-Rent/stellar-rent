# BookingContract Smart Contract Documentation

## Overview

The **BookingContract** is a critical component of the StellarRent platform, designed to manage property reservations on the Stellar blockchain using Soroban. It ensures secure, transparent, and efficient booking management by verifying property availability, preventing double bookings, generating unique reservation identifiers, and integrating with escrow services for payment handling.

---

## Deployment Info
Contract ID: CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E
Contract Link: https://stellar.expert/explorer/testnet/contract/CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E
Network: testnet

---

## What Does the BookingContract Do?

- **Verifies property availability**: Checks against existing bookings to ensure no overlapping reservations.
- **Creates secure bookings**: Generates unique booking IDs and stores essential reservation data on-chain.
- **Prevents double bookings**: Implements strict overlap detection to maintain booking integrity.
- **Manages booking lifecycle**: Handles booking creation, confirmation, completion, and cancellation.
- **Integrates with escrow**: Works with Trustless Work to securely handle payments until booking conditions are met.
- **Maintains booking history**: Provides an immutable record of all bookings for transparency and dispute resolution.

---

## Why "booking"?

The contract is named `booking` because its primary purpose is to manage the entire lifecycle of property bookings within the StellarRent ecosystem. It handles reservation creation, availability management, payment escrow integration, and booking status tracking, making it the single source of truth for all reservation-related operations.

---

## How Does It Work?

### Data Model (On-Chain)

Each booking stored on-chain contains:
- **ID**: Unique identifier (UUID) for the booking.
- **Property ID**: Reference to the property being booked.
- **User ID**: Identifier of the user making the booking.
- **Start Date**: Beginning of the reservation period (Unix timestamp).
- **End Date**: End of the reservation period (Unix timestamp).
- **Total Price**: Total cost in USDC (as i128).
- **Status**: Current state of the booking (`Pending`, `Confirmed`, `Completed`, `Cancelled`).
- **Escrow ID**: Reference to the associated escrow transaction (when applicable).

### Data Model (Off-Chain)

- **Guest details**: Full user information stored in Supabase.
- **Property details**: Retrieved from PropertyListing contract and Supabase.
- **Payment metadata**: Additional payment information stored in backend.
- **Communication logs**: Host-guest messages stored off-chain.

---

## Core Functions

### 1. Check Availability

**Purpose:** Verify if a property is available for the requested dates.

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source-account alice \
  -- check_availability \
  --property_id PROP1 \
  --start_date 1704067200 \
  --end_date 1704153600
```
- `PROP1`: Property ID to check.
- `1704067200`: Start date (Unix timestamp - Jan 1, 2024).
- `1704153600`: End date (Unix timestamp - Jan 2, 2024).

**Result:**  
Returns `true` if available, `false` if there are overlapping bookings.

---

### 2. Create Booking

**Purpose:** Create a new reservation with escrow integration.

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source-account bob \
  -- create_booking \
  --property_id PROP1 \
  --user_id USER123 \
  --start_date 1704067200 \
  --end_date 1704153600 \
  --total_price 1000000000
```
- `PROP1`: Property being booked.
- `USER123`: User making the booking.
- `1704067200`: Check-in date.
- `1704153600`: Check-out date.
- `1000000000`: Total price in USDC (100 USDC with 7 decimals).

**Result:**  
Returns the unique booking ID. Initiates escrow for payment. Fails if dates overlap with existing bookings.

---

### 3. Cancel Booking

**Purpose:** Cancel an existing booking (subject to cancellation policy).

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source-account bob \
  -- cancel_booking \
  --booking_id BOOK123 \
  --user_id USER123
```
- `BOOK123`: Booking ID to cancel.
- `USER123`: User requesting cancellation (must match booking user).

**Result:**  
Returns `true` if cancelled successfully. Triggers escrow refund if applicable. Fails if cancellation policy prohibits it.

---

### 4. Get Booking

**Purpose:** Retrieve booking details.

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source-account alice \
  -- get_booking \
  --booking_id BOOK123
```

**Result:**  
Returns the complete booking record including all fields.

---

### 5. Update Booking Status

**Purpose:** Update the status of a booking (for hosts or system).

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source-account alice \
  -- update_status \
  --booking_id BOOK123 \
  --new_status Confirmed \
  --caller <HOST_ADDRESS>
```
- `--new_status` can be `Pending`, `Confirmed`, `Completed`, or `Cancelled`.

**Result:**  
Returns the updated booking. May trigger escrow actions based on status change.

---

### 6. Get Property Bookings

**Purpose:** Retrieve all bookings for a specific property.

**CLI Example:**
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source-account alice \
  -- get_property_bookings \
  --property_id PROP1
```

**Result:**  
Returns a vector of all bookings for the specified property.

---

## Integration Architecture

### Backend Integration (Node.js/Express + Supabase)

- **Booking Creation Flow:**
  1. Frontend sends booking request to backend.
  2. Backend validates user authentication and payment details.
  3. Backend calls `check_availability` on the contract.
  4. If available, backend initiates payment processing.
  5. Backend calls `create_booking` with escrow details.
  6. Backend stores additional metadata in Supabase.

- **Availability Check:**
  1. Frontend requests available dates.
  2. Backend queries `get_property_bookings` from contract.
  3. Backend calculates available date ranges.
  4. Returns calendar data to frontend.

- **Booking Management:**
  1. Status updates trigger contract calls.
  2. Escrow releases happen on check-in confirmation.
  3. Cancellations process refunds through escrow.

### Frontend Integration (Next.js)

- Displays real-time availability from contract data.
- Shows booking status and escrow information.
- Handles booking creation and cancellation flows.
- Provides booking history and management interface.

### Escrow Integration (Trustless Work)

- **Payment Lock:** Funds are locked when booking is created.
- **Release Conditions:** Funds released on successful check-in or completion.
- **Refund Logic:** Handles cancellations based on policy.
- **Dispute Resolution:** Provides mechanism for conflict resolution.

---

## Security Considerations

- **Double-Booking Prevention:** Atomic availability checks prevent race conditions.
- **User Authentication:** All actions require proper Stellar account signatures.
- **Escrow Security:** Payments are protected until conditions are met.
- **Date Validation:** Ensures end date is after start date and dates are in the future.
- **Authorization Checks:** Only booking owner can cancel, only host can update status.
- **Price Validation:** Ensures positive values and proper decimal handling.

---

## Error Handling

The contract handles various error conditions:
- `BookingOverlap`: Attempted booking conflicts with existing reservation.
- `InvalidDates`: Start date is after end date or dates are in the past.
- `PropertyNotFound`: Referenced property doesn't exist.
- `UnauthorizedAction`: User attempting action they don't have permission for.
- `InvalidPrice`: Negative or zero price provided.
- `BookingNotFound`: Referenced booking ID doesn't exist.
- `InvalidStatus`: Attempted invalid status transition.

---

## Example Workflow

1. **Guest searches for property:**
   - Frontend shows available dates from contract.
   - Guest selects check-in/check-out dates.

2. **Guest creates booking:**
   - Backend verifies availability via contract.
   - Payment processed and locked in escrow.
   - Booking created on-chain with unique ID.
   - Confirmation sent to guest and host.

3. **Check-in process:**
   - Host confirms guest arrival.
   - Status updated to `Confirmed`.
   - Escrow prepares for release.

4. **Booking completion:**
   - Check-out confirmed.
   - Status updated to `Completed`.
   - Escrow releases payment to host.
   - Reviews can be submitted.

5. **Cancellation (if needed):**
   - Guest/host initiates cancellation.
   - Contract checks cancellation policy.
   - Refund processed through escrow.
   - Status updated to `Cancelled`.

---

## Testing Strategy

- **Unit Tests:** Test each function in isolation.
- **Integration Tests:** Test escrow integration and contract interactions.
- **Overlap Tests:** Verify booking conflict detection.
- **Edge Cases:** Test boundary conditions and error scenarios.
- **Load Tests:** Ensure contract handles multiple concurrent bookings.

---

## Resources

- [Stellar CLI Documentation](https://developers.stellar.org/docs/tools/cli/stellar-cli)
- [Soroban Smart Contracts Guide](https://developers.stellar.org/docs/build/smart-contracts)
- [Trustless Work API](https://trustlesswork.com/docs)
- [StellarRent Documentation](https://stellar-rent.gitbook.io/stellar-rent)

---

**Building the future of decentralized property rentals on Stellar! 🏠✨** 