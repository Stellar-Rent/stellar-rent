/**
 *
 * Trustless Work Documentation: https://docs.trustlesswork.com/
 * Library: https://docs.trustlesswork.com/trustless-work/developer-resources/react-library/getting-started
 *
 * MultiRelease Escrow: It's based on milestone, it means that the amount and flags is in each milestone
 * SingleRelease Escrow: It's based on the escrow, it means that the amount and flags is in the escrow
 * -> If you have any doubts, please check the documentation or even send us a DM
 *
 */

import {
  type InitializeMultiReleaseEscrowPayload,
  type InitializeSingleReleaseEscrowPayload,
  useInitializeEscrow,
  useSendTransaction,
} from '@trustless-work/escrow';

/**
 * When you want to create a contract between house owner and tenant, you need to deploy an escrow contract by using this hook. You just need to pass the payload.
 */
export const useInitializeContract = () => {
  const { deployEscrow } = useInitializeEscrow();
  const { sendTransaction } = useSendTransaction();

  // todo: get your private key from your wallet (like @creit.tech/stellar-wallets-kit) or passkey in order to set as the signer

  const handleSubmit = async (
    /**
     * @Note:
     * - You can choose the type of escrow contract you want to deploy.
     * - The type of escrow contract you want to deploy is based on the payload you pass to the function.
     * - If you pass a payload of type InitializeMultiReleaseEscrowPayload, you will deploy a multi-release escrow contract.
     * - If you pass a payload of type InitializeSingleReleaseEscrowPayload, you will deploy a single-release escrow contract.
     */
    payload: InitializeMultiReleaseEscrowPayload
    // | InitializeSingleReleaseEscrowPayload
  ) => {
    /**
     * API call by using the trustless work hooks
     * @Note:
     * - We need to pass the payload to the deployEscrow function
     * - The result will be an unsigned transaction
     */
    const { unsignedTransaction } = await deployEscrow(
      payload,

      /**
       * You should choose the type of escrow contract you want to deploy.
       */
      'multi-release'
      // "single-release",
    );

    if (!unsignedTransaction) {
      throw new Error('Unsigned transaction is missing from deployEscrow response.');
    }

    /**
     * @Note:
     * - We need to sign the transaction using your private key, such as @creit.tech/stellar-wallets-kit or passkey
     * - The result will be a signed transaction
     */
    // const signedXdr = await signTransaction({
    //   unsignedTransaction,
    //   address: walletAddress || "",
    // });

    const signedXdr = 'signedXdr';

    if (!signedXdr) {
      throw new Error('Signed transaction is missing.');
    }

    /**
     * @Note:
     * - We need to send the signed transaction to the API
     * - The data will be an SendTransactionResponse
     */
    const data = await sendTransaction(signedXdr);

    /**
     * @Responses:
     * data.status === "SUCCESS"
     * - Escrow created successfully
     *
     * data.status == "ERROR"
     * - The escrow was not created
     */
    if (data && data.status === 'SUCCESS') {
      /**
       * - Here you can save the escrow in your database as the contract between house owner and tenant
       * - You can also save in your global state
       * - You can also show a success toast or something like that
       */
    }
  };

  return { handleSubmit };
};
