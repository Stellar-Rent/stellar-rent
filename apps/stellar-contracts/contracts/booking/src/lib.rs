#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, String, Symbol, Vec,
};

// Booking status enum
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum BookingStatus {
    Pending,
    Confirmed,
    Completed,
    Cancelled,
}

// Main booking data structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Booking {
    pub id: u64,  // Changed to u64 for simplicity
    pub property_id: String,
    pub user_id: String,
    pub start_date: u64,
    pub end_date: u64,
    pub total_price: i128,
    pub status: BookingStatus,
    pub escrow_id: Option<String>,
}

// Storage keys
const BOOKINGS: Symbol = symbol_short!("BOOKINGS");
const BOOK_COUNT: Symbol = symbol_short!("BOOKCOUNT");

#[contract]
pub struct BookingContract;

#[contractimpl]
impl BookingContract {
    /// Initialize the contract
    pub fn initialize(env: Env) {
        env.storage().persistent().set(&BOOK_COUNT, &0u64);
    }

    /// Check if a property is available for the given dates
    pub fn check_availability(
        env: Env,
        property_id: String,
        start_date: u64,
        end_date: u64,
    ) -> bool {
        // Validate dates
        if start_date >= end_date {
            return false;
        }

        // Get all bookings for this property
        let bookings = Self::get_property_bookings_internal(&env, property_id.clone());
        
        // Check for overlaps
        for booking in bookings.iter() {
            if booking.status != BookingStatus::Cancelled {
                // Check if dates overlap
                if !(end_date <= booking.start_date || start_date >= booking.end_date) {
                    return false;
                }
            }
        }
        
        true
    }

    /// Create a new booking
    pub fn create_booking(
        env: Env,
        property_id: String,
        user_id: String,
        start_date: u64,
        end_date: u64,
        total_price: i128,
    ) -> u64 {
        // Validate inputs
        if start_date >= end_date {
            panic!("Invalid dates: start date must be before end date");
        }
        
        if total_price <= 0 {
            panic!("Invalid price: price must be greater than zero");
        }

        // Get current timestamp for basic validation
        let current_time = env.ledger().timestamp();
        if start_date < current_time {
            panic!("Invalid dates: start date cannot be in the past");
        }

        // Check availability
        if !Self::check_availability(env.clone(), property_id.clone(), start_date, end_date) {
            panic!("Booking overlap: dates conflict with existing reservation");
        }

        // Generate unique booking ID
        let book_count: u64 = env
            .storage()
            .persistent()
            .get(&BOOK_COUNT)
            .unwrap_or(0);
        
        let booking_id = book_count;
        
        // Create booking
        let booking = Booking {
            id: booking_id,
            property_id: property_id.clone(),
            user_id: user_id.clone(),
            start_date,
            end_date,
            total_price,
            status: BookingStatus::Pending,
            escrow_id: None, // Will be set when escrow is initiated
        };

        // Store booking
        let mut bookings_map: Vec<(u64, Booking)> = env
            .storage()
            .persistent()
            .get(&BOOKINGS)
            .unwrap_or(vec![&env]);
        
        bookings_map.push_back((booking_id, booking.clone()));
        env.storage().persistent().set(&BOOKINGS, &bookings_map);

        // Update property bookings
        let mut prop_bookings = Self::get_property_bookings_internal(&env, property_id.clone());
        prop_bookings.push_back(booking.clone());
        
        // Store with property ID as key
        env.storage().persistent().set(&property_id, &prop_bookings);

        // Update booking counter
        env.storage().persistent().set(&BOOK_COUNT, &(book_count + 1));

        // TODO: Initiate escrow here
        // This would typically involve calling an external escrow contract
        
        booking_id
    }

    /// Cancel a booking
    pub fn cancel_booking(
        env: Env,
        booking_id: u64,
        user_id: String,
    ) -> bool {
        // Get the booking
        let mut bookings_map: Vec<(u64, Booking)> = env
            .storage()
            .persistent()
            .get(&BOOKINGS)
            .unwrap_or(vec![&env]);
        
        let mut booking_found = false;
        let mut updated_booking = None;
        
        for i in 0..bookings_map.len() {
            let (id, mut booking) = bookings_map.get(i).unwrap();
            if id == booking_id {
                // Verify user authorization
                if booking.user_id != user_id {
                    panic!("Unauthorized: only the booking owner can cancel");
                }
                
                // Check if booking can be cancelled
                if booking.status == BookingStatus::Completed || 
                   booking.status == BookingStatus::Cancelled {
                    panic!("Invalid status: booking cannot be cancelled");
                }
                
                // Update status
                booking.status = BookingStatus::Cancelled;
                bookings_map.set(i, (id, booking.clone()));
                updated_booking = Some(booking.clone());
                booking_found = true;
                break;
            }
        }
        
        if !booking_found {
            panic!("Booking not found");
        }
        
        // Update storage
        env.storage().persistent().set(&BOOKINGS, &bookings_map);
        
        // Update property bookings
        if let Some(booking) = updated_booking {
            let mut prop_bookings: Vec<Booking> = env
                .storage()
                .persistent()
                .get(&booking.property_id)
                .unwrap_or(vec![&env]);
            
            for i in 0..prop_bookings.len() {
                if prop_bookings.get(i).unwrap().id == booking_id {
                    prop_bookings.set(i, booking.clone());
                    break;
                }
            }
            
            env.storage().persistent().set(&booking.property_id, &prop_bookings);
        }
        
        // TODO: Trigger escrow refund
        
        true
    }

    /// Get a specific booking by ID
    pub fn get_booking(env: Env, booking_id: u64) -> Booking {
        let bookings_map: Vec<(u64, Booking)> = env
            .storage()
            .persistent()
            .get(&BOOKINGS)
            .unwrap_or(vec![&env]);
        
        for (id, booking) in bookings_map.iter() {
            if id == booking_id {
                return booking;
            }
        }
        
        panic!("Booking not found");
    }

    /// Update booking status
    pub fn update_status(
        env: Env,
        booking_id: u64,
        new_status: BookingStatus,
        caller: Address,
    ) -> Booking {
        // TODO: Add proper authorization check for host/system
        caller.require_auth();
        
        let mut bookings_map: Vec<(u64, Booking)> = env
            .storage()
            .persistent()
            .get(&BOOKINGS)
            .unwrap_or(vec![&env]);
        
        let mut booking_found = false;
        let mut updated_booking = None;
        
        for i in 0..bookings_map.len() {
            let (id, mut booking) = bookings_map.get(i).unwrap();
            if id == booking_id {
                // Validate status transition
                match (booking.status, new_status) {
                    (BookingStatus::Pending, BookingStatus::Confirmed) |
                    (BookingStatus::Confirmed, BookingStatus::Completed) |
                    (BookingStatus::Pending, BookingStatus::Cancelled) |
                    (BookingStatus::Confirmed, BookingStatus::Cancelled) => {
                        booking.status = new_status;
                        bookings_map.set(i, (id.clone(), booking.clone()));
                        updated_booking = Some(booking.clone());
                        booking_found = true;
                    }
                    _ => panic!("Invalid status transition"),
                }
                break;
            }
        }
        
        if !booking_found {
            panic!("Booking not found");
        }
        
        // Update storage
        env.storage().persistent().set(&BOOKINGS, &bookings_map);
        
        // Update property bookings
        if let Some(booking) = &updated_booking {
            let mut prop_bookings: Vec<Booking> = env
                .storage()
                .persistent()
                .get(&booking.property_id)
                .unwrap_or(vec![&env]);
            
            for i in 0..prop_bookings.len() {
                if prop_bookings.get(i).unwrap().id == booking_id {
                    prop_bookings.set(i, booking.clone());
                    break;
                }
            }
            
            env.storage().persistent().set(&booking.property_id, &prop_bookings);
        }
        
        // TODO: Trigger escrow actions based on status change
        
        updated_booking.unwrap()
    }

    /// Get all bookings for a specific property
    pub fn get_property_bookings(env: Env, property_id: String) -> Vec<Booking> {
        Self::get_property_bookings_internal(&env, property_id)
    }

    /// Internal helper to get property bookings
    fn get_property_bookings_internal(env: &Env, property_id: String) -> Vec<Booking> {
        env.storage()
            .persistent()
            .get(&property_id)
            .unwrap_or(vec![env])
    }

    /// Set escrow ID for a booking (called by escrow system)
    pub fn set_escrow_id(
        env: Env,
        booking_id: u64,
        escrow_id: String,
        _caller: Address, // TODO: Verify this is the escrow contract
    ) -> bool {
        let mut bookings_map: Vec<(u64, Booking)> = env
            .storage()
            .persistent()
            .get(&BOOKINGS)
            .unwrap_or(vec![&env]);
        
        for i in 0..bookings_map.len() {
            let (id, mut booking) = bookings_map.get(i).unwrap();
            if id == booking_id {
                booking.escrow_id = Some(escrow_id);
                bookings_map.set(i, (id, booking));
                env.storage().persistent().set(&BOOKINGS, &bookings_map);
                return true;
            }
        }
        
        panic!("Booking not found");
    }
}

#[cfg(test)]
mod test; 