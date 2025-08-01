# StellarRent Stellar SDK Project Configuration

This project utilizes the Stellar SDK to interact with the Stellar blockchain, supporting both Testnet and Mainnet environments. To ensure flexibility and proper operation across different deployment stages (development, staging, production), environment variables are used for network configuration.

## Environment Variables for stellar config

The following environment variables are crucial for determining which Stellar network (Testnet or Mainnet) the application connects to, and for specifying the correct asset issuers for each network.

### `NEXT_PUBLIC_STELLAR_NETWORK`

*   **Purpose**: This variable acts as a primary switch to select the active Stellar network.
*   **Values**:
    *   `testnet`: Connects the application to the Stellar Testnet. This is typically used for local development and testing.
    *   `mainnet`: Connects the application to the Stellar Mainnet. This should be used for production deployments.
*   **Usage**: The application reads this variable to dynamically set the Horizon server URL, network passphrase, and the appropriate USDC asset issuer.

### `NEXT_PUBLIC_USDC_ISSUER_TESTNET`

*   **Purpose**: Specifies the issuer account ID for the USDC asset on the Stellar **Testnet**.
*   **Importance**: Different networks (Testnet vs. Mainnet) have different asset issuers. Using the correct issuer is vital for interacting with the right asset.

### `NEXT_PUBLIC_USDC_ISSUER_MAINNET`

*   **Purpose**: Specifies the issuer account ID for the USDC asset on the Stellar **Mainnet**.
*   **Importance**: Ensures that the application correctly identifies and interacts with the USDC asset on the live Stellar network.

## Why Environment Variables?

Using environment variables for these configurations offers several benefits:

1.  **Flexibility**: Easily switch between Testnet and Mainnet without modifying the codebase. This is essential for development, testing, and production workflows.
2.  **Security**: Sensitive information (though asset issuers are public, this principle applies to other potential keys) is not hardcoded into the application, reducing the risk of accidental exposure.
3.  **Deployment Management**: Platforms like Vercel allow you to manage environment variables per deployment environment (e.g., development, preview, production), ensuring the correct network is used automatically based on the deployment target.

## Local Development Setup

For local development, create a `.env.local` file in the root of your project and populate it with the `testnet` configurations:

```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_USDC_ISSUER_TESTNET=GBBD4763773737373737373737373737373737373737373737373737373737373737 # Example Testnet USDC Issuer
NEXT_PUBLIC_USDC_ISSUER_MAINNET=GA5ZSEJYB37JRC5AVCIA5MOP4RHTHC335L2MIVJOE5GQLNBMYDFV6FUPE # Example Mainnet USDC Issuer
```

**Note**: Replace the example issuer addresses with the actual USDC issuer addresses for Testnet and Mainnet as needed.
