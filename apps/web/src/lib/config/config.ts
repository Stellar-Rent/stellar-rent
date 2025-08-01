import { Networks } from "stellar-sdk"

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet"

export const HORIZON_URL =
  STELLAR_NETWORK === "mainnet" ? "https://horizon.stellar.org" : "https://horizon-testnet.stellar.org"

export const NETWORK_PASSPHRASE = STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

export const USDC_ISSUER =
  STELLAR_NETWORK === "mainnet"
    ? process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET
    : process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET

if (!USDC_ISSUER) {
  throw new Error(`USDC_ISSUER for ${STELLAR_NETWORK} is not defined. Please check your environment variables.`)
}
