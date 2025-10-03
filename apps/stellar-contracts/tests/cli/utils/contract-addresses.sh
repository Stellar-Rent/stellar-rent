#!/bin/bash
# Contract address management for tests

CONTRACT_ADDRESSES_FILE="$TESTS_DIR/contract-addresses.json"

# Initialize contract addresses file if it doesn't exist
init_contract_addresses() {
    if [ ! -f "$CONTRACT_ADDRESSES_FILE" ]; then
        cat > "$CONTRACT_ADDRESSES_FILE" << 'JSON'
{
  "booking": null,
  "property-listing": null,
  "review-contract": null,
  "deployment_timestamp": null,
  "network": "testnet"
}
JSON
    fi
}

# Normalize contract key (convert underscores to hyphens)
normalize_contract_key() {
    echo "$1" | sed 's/_/-/g'
}

# Get contract address
get_contract_address() {
    local contract_name
    contract_name="$(normalize_contract_key "$1")"
    init_contract_addresses

    jq -r ".$contract_name" "$CONTRACT_ADDRESSES_FILE"
}

# Set contract address
set_contract_address() {
    local contract_name
    contract_name="$(normalize_contract_key "$1")"
    local address="$2"

    init_contract_addresses

    # Update the JSON file
    jq --arg name "$contract_name" --arg addr "$address" \
       '.($name) = $addr' "$CONTRACT_ADDRESSES_FILE" > "$CONTRACT_ADDRESSES_FILE.tmp" && \
    mv "$CONTRACT_ADDRESSES_FILE.tmp" "$CONTRACT_ADDRESSES_FILE"
}

# Update deployment timestamp
update_deployment_timestamp() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    init_contract_addresses
    
    jq --arg ts "$timestamp" '.deployment_timestamp = $ts' \
       "$CONTRACT_ADDRESSES_FILE" > "$CONTRACT_ADDRESSES_FILE.tmp" && \
    mv "$CONTRACT_ADDRESSES_FILE.tmp" "$CONTRACT_ADDRESSES_FILE"
}

# Check if all contracts are deployed
all_contracts_deployed() {
    init_contract_addresses

    local booking=$(get_contract_address "booking")
    local property=$(get_contract_address "property_listing")
    local review=$(get_contract_address "review_contract")

    if [ "$booking" != "null" ] && [ "$property" != "null" ] && [ "$review" != "null" ]; then
        return 0
    else
        return 1
    fi
}

# Print contract addresses
print_contract_addresses() {
    init_contract_addresses

    echo "Contract Addresses:"
    echo "==================="
    echo "Booking Contract: $(get_contract_address "booking")"
    echo "Property Listing Contract: $(get_contract_address "property_listing")"
    echo "Review Contract: $(get_contract_address "review_contract")"
    echo "Deployed: $(jq -r '.deployment_timestamp' "$CONTRACT_ADDRESSES_FILE")"
}
