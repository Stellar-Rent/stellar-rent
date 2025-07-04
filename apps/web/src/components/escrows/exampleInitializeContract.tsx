import { useInitializeContract } from '~/hooks/escrows/useInitializeContract';

export const exampleInitializeContract = () => {
  const { handleSubmit } = useInitializeContract();

  // Mock payload MultiRelease escrow
  const payload = {
    engagementId: 'xRentOnwner & xClient', // Unique identifier for the escrow

    title: 'House in Mexico City', // Name of the escrow

    description: 'House in Mexico City', // Description of the escrow

    platformFee: 3, // Commission that StellarRent will receive when the escrow is released or resolved. You must choose how much you want to receive.

    receiverMemo: 90909090, // optional! Field used to identify the recipient's address in transactions through an intermediary account. This value is included as a memo in the transaction and allows the funds to be correctly routed to the wallet of the specified recipient

    roles: {
      approver: 'GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD', // house owner
      serviceProvider: 'GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD', // tenant
      platformAddress: 'GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD', // StellarRent
      releaseSigner: 'GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD', // StellarRent
      disputeResolver: 'GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD', // Intermediario
      receiver: 'GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD', // tenant
    },
    trustline: {
      // This is USDC trustline
      address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
      decimals: 10000000,

      // you can use any trustline you want, but you need to have the address and decimals
    },
    // Milestones are the steps of the escrow
    milestones: [
      {
        description: 'Pay the rent',
        amount: 200,
      },
      {
        description: 'Pay the deposit',
        amount: 1000,
      },
      {
        description: 'Pay the utilities',
        amount: 300,
      },
    ],
    signer: 'GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD', // Address of the user signing the contract transaction
  };

  return (
    <div>
      <h1>Example Initialize Contract</h1>

      {/*
       * Create a form...
       *
       * @note:
       * - You can use our form component of the dApp and demo TW apps.
       *    - dApp: https://github.com/Trustless-Work/dApp-Trustless-Work/blob/develop/src/components/modules/escrow/ui/forms/multi-release/InitializeMultiEscrowForm.tsx
       *    - demo TW: https://github.com/Trustless-Work/demo-Trustless-Work/blob/develop/src/components/modules/escrows/ui/forms/multi-release/InitializeMultiEscrowForm.tsx
       *
       *
       * To consider: It's not necessary to pass the completed payload with the form, because you can adjust the data whatever you want. But when you sent the payload to the deployEscrow function, you need to pass the complete and exact payload.
       *
       *
       *
       */}
      <button type="button" onClick={() => handleSubmit(payload)}>
        Initialize Contract between client and freelancer
      </button>
    </div>
  );
};
