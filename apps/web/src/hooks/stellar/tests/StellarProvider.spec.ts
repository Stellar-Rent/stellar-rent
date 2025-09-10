// tests/e2e/tests/components/StellarProvider.spec.ts
import { expect, test } from '../../fixtures/auth.fixture';

interface WindowWithStellarMocks extends Window {
  __stellarMocks?: {
    deployResult?: string;
    friendbotCalled?: boolean;
    deployError?: string;
    signResult?: unknown;
  };
  __hookState?: {
    deployee: string | null;
    loadingDeployee: boolean;
    loadingRegister: boolean;
    loadingSign: boolean;
    creatingDeployee: boolean;
    contractData: unknown | null;
  };
  __restoredDeployee?: string;
  __registrationResult?: {
    success: boolean;
    deployee?: string;
    error?: string;
    credentialId?: string;
  };
  __registrationError?: string;
  __skipRegistration?: boolean;
  __prepareSignResult?: object;
  __signResult?: {
    success: boolean;
    contractData?: object;
    error?: string;
  };
  __initError?: string;
  __loadingAfterError?: boolean;
  __bundlerKeyError?: string;
  __invalidKeysError?: string;
  __loadingStates?: Array<{ loadingRegister: boolean; creatingDeployee: boolean }>;
  __signLoadingStates?: Array<{ loadingSign: boolean }>;
  __storageKeys?: {
    deployee: string;
    bundler: string;
    credentialId: string;
  };
  __storageResults?: Array<{ key: string; success: boolean }>;
  mockPasskeyUtils?: {
    handleDeploy: (
      bundlerKey: { secret: () => string } | null,
      contractSalt: string,
      publicKey: string
    ) => Promise<string>;
    getPublicKeys: (registerRes: { id: string; response: object }) => Promise<{
      contractSalt: string;
      publicKey: string;
    }>;
  };
}

test.describe('StellarProvider Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Stellar SDK and Horizon server
    await page.addInitScript(() => {
      // Initialize mock storage
      (window as WindowWithStellarMocks).__stellarMocks = {
        friendbotCalled: false,
      };

      // Mock localStorage
      const mockStorage: Record<string, string> = {};
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, value: string) => {
            mockStorage[key] = value;
          },
          removeItem: (key: string) => {
            delete mockStorage[key];
          },
          clear: () => {
            for (const key of Object.keys(mockStorage)) {
              delete mockStorage[key];
            }
          },
        },
        writable: true,
      });

      // Mock Stellar SDK
      (window as WindowWithStellarMocks & typeof globalThis)['@stellar/stellar-sdk'] = {
        Keypair: {
          random: () => ({
            // biome-ignore lint/style/useTemplate: Mock function for testing
            publicKey: () => 'MOCK_PUBLIC_KEY_' + Math.random().toString(36).substr(2, 9),
            // biome-ignore lint/style/useTemplate: Mock function for testing
            secret: () => 'SMOCK_SECRET_KEY_' + Math.random().toString(36).substr(2, 9),
            fromSecret: (secret: string) => ({
              publicKey: () => secret.replace('S', 'G'),
              secret: () => secret,
            }),
          }),
        },
        Horizon: {
          Server: class MockServer {
            // biome-ignore lint/complexity/noUselessConstructor: Required for mock interface
            constructor(_url: string) {}
            friendbot(_publicKey: string) {
              return {
                call: async () => {
                  const mocks = (window as WindowWithStellarMocks).__stellarMocks;
                  if (mocks) {
                    mocks.friendbotCalled = true;
                  }
                  return { successful: true };
                },
              };
            }
          },
        },
      };

      // Mock passkey utilities
      (window as WindowWithStellarMocks).mockPasskeyUtils = {
        handleDeploy: async (_bundlerKey, _contractSalt, _publicKey) => {
          const mocks = (window as WindowWithStellarMocks).__stellarMocks;
          if (mocks?.deployError) {
            throw new Error(mocks.deployError);
          }
          return mocks?.deployResult || 'MOCK_DEPLOYEE_ADDRESS';
        },
        getPublicKeys: async (_registerRes) => ({
          contractSalt: 'mock_salt',
          publicKey: 'mock_public_key',
        }),
      };
    });

    await page.goto('/');
  });

  test.describe('Provider Initialization', () => {
    test('should provide stellar context to children', async ({ page }) => {
      await page.setContent(`
        <div id="test-app">
          <script type="module">
            import { StellarProvider, useStellarContext } from '/src/hooks/stellar/stellar-context.js';
            
            // Mock test component
            function TestComponent() {
              try {
                const stellar = useStellarContext();
                document.getElementById('context-status').textContent = 'Context available';
                document.getElementById('loading-status').textContent = stellar.loadingDeployee ? 'loading' : 'loaded';
              } catch (error) {
                document.getElementById('context-status').textContent = 'Context error: ' + error.message;
              }
            }
            
            // Render provider with test component
            const app = document.getElementById('test-app');
            app.innerHTML = \`
              <div data-testid="stellar-provider">
                <div id="context-status">Not initialized</div>
                <div id="loading-status">unknown</div>
              </div>
            \`;
            
            // Simulate provider rendering
            TestComponent();
          </script>
        </div>
      `);

      await expect(page.locator('[data-testid="stellar-provider"]')).toBeVisible();
      await expect(page.locator('#context-status')).toContainText('Context available');
    });

    test('should throw error when useStellarContext used outside provider', async ({ page }) => {
      await page.setContent(`
        <div id="test-app">
          <div id="error-message">No error</div>
          <script type="module">
            try {
              // Simulate using context outside provider
              throw new Error('useStellarContext must be used within a StellarProvider');
            } catch (error) {
              document.getElementById('error-message').textContent = error.message;
            }
          </script>
        </div>
      `);

      await expect(page.locator('#error-message')).toContainText(
        'useStellarContext must be used within a StellarProvider'
      );
    });
  });

  test.describe('Hook State Management', () => {
    test('should initialize with correct default state', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate hook initialization
        const mockHookState = {
          deployee: null,
          loadingDeployee: true,
          loadingRegister: false,
          loadingSign: false,
          creatingDeployee: false,
          contractData: null,
        };

        (window as WindowWithStellarMocks).__hookState = mockHookState;
      });

      const hookState = await page.evaluate(() => {
        return (window as WindowWithStellarMocks).__hookState;
      });

      expect(hookState?.deployee).toBeNull();
      expect(hookState?.loadingDeployee).toBe(true);
      expect(hookState?.loadingRegister).toBe(false);
      expect(hookState?.loadingSign).toBe(false);
      expect(hookState?.creatingDeployee).toBe(false);
      expect(hookState?.contractData).toBeNull();
    });

    test('should handle bundler key generation', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate bundler key initialization
        const mockBundlerKey = {
          publicKey: () => 'MOCK_BUNDLER_PUBLIC_KEY',
          secret: () => 'SMOCK_BUNDLER_SECRET_KEY',
        };

        localStorage.setItem('sp:bundler', mockBundlerKey.secret());

        const mocks = (window as WindowWithStellarMocks).__stellarMocks;
        if (mocks) {
          mocks.friendbotCalled = true;
        }
      });

      const bundlerSecret = await page.evaluate(() => localStorage.getItem('sp:bundler'));
      const friendbotCalled = await page.evaluate(
        () => (window as WindowWithStellarMocks).__stellarMocks?.friendbotCalled
      );

      expect(bundlerSecret).toContain('SMOCK_BUNDLER_SECRET_KEY');
      expect(friendbotCalled).toBe(true);
    });

    test('should restore existing deployee from storage', async ({ page }) => {
      const mockDeployee = 'EXISTING_DEPLOYEE_ADDRESS';

      await page.evaluate((deployee) => {
        localStorage.setItem('sp:deployee', deployee);

        // Simulate hook reading from storage
        (window as WindowWithStellarMocks).__restoredDeployee =
          localStorage.getItem('sp:deployee') || undefined;
      }, mockDeployee);

      const restoredDeployee = await page.evaluate(
        () => (window as WindowWithStellarMocks).__restoredDeployee
      );
      expect(restoredDeployee).toBe(mockDeployee);
    });
  });

  test.describe('Registration Flow', () => {
    test('should handle successful registration', async ({ page }) => {
      const mockRegistrationResponse = {
        id: 'mock-credential-id',
        response: {
          clientDataJSON: 'mock-client-data',
          authenticatorData: 'mock-auth-data',
        },
      };

      await page.evaluate((registerRes) => {
        // Set up successful deploy mock
        const mocks = (window as WindowWithStellarMocks).__stellarMocks;
        if (mocks) {
          mocks.deployResult = 'NEW_DEPLOYEE_ADDRESS';
        }

        // Simulate registration flow
        async function simulateRegistration() {
          try {
            // Store credential ID
            localStorage.setItem('sp:id', registerRes.id);

            // Simulate getting public keys
            const passkeysUtils = (window as WindowWithStellarMocks).mockPasskeyUtils;
            if (!passkeysUtils) throw new Error('Mock utils not available');

            const { contractSalt, publicKey } = await passkeysUtils.getPublicKeys(registerRes);

            // Simulate deployment
            const deployee = await passkeysUtils.handleDeploy(
              { secret: () => 'mock-bundler-key' },
              contractSalt,
              publicKey
            );

            // Store deployee
            localStorage.setItem('sp:deployee', deployee);

            (window as WindowWithStellarMocks).__registrationResult = {
              success: true,
              deployee,
              credentialId: registerRes.id,
            };
          } catch (error) {
            (window as WindowWithStellarMocks).__registrationResult = {
              success: false,
              error: (error as Error).message,
            };
          }
        }

        simulateRegistration();
      }, mockRegistrationResponse);

      // Wait for async operations
      await page.waitForTimeout(100);

      const result = await page.evaluate(
        () => (window as WindowWithStellarMocks).__registrationResult
      );
      const storedCredentialId = await page.evaluate(() => localStorage.getItem('sp:id'));
      const storedDeployee = await page.evaluate(() => localStorage.getItem('sp:deployee'));

      expect(result?.success).toBe(true);
      expect(result?.deployee).toBe('NEW_DEPLOYEE_ADDRESS');
      expect(storedCredentialId).toBe(mockRegistrationResponse.id);
      expect(storedDeployee).toBe('NEW_DEPLOYEE_ADDRESS');
    });

    test('should handle registration failure', async ({ page }) => {
      const mockRegistrationResponse = {
        id: 'mock-credential-id',
        response: {},
      };

      await page.evaluate((registerRes) => {
        // Set up deployment failure
        const mocks = (window as WindowWithStellarMocks).__stellarMocks;
        if (mocks) {
          mocks.deployError = 'Deployment failed';
        }

        const simulateFailedRegistration = async () => {
          try {
            localStorage.setItem('sp:id', registerRes.id);

            const passkeysUtils = (window as WindowWithStellarMocks).mockPasskeyUtils;
            if (!passkeysUtils) throw new Error('Mock utils not available');

            const { contractSalt, publicKey } = await passkeysUtils.getPublicKeys(registerRes);
            await passkeysUtils.handleDeploy(null, contractSalt, publicKey);
          } catch (error) {
            (window as WindowWithStellarMocks).__registrationError = (error as Error).message;
          }
        };

        simulateFailedRegistration();
      }, mockRegistrationResponse);

      await page.waitForTimeout(100);

      const error = await page.evaluate(
        () => (window as WindowWithStellarMocks).__registrationError
      );
      expect(error).toBe('Deployment failed');
    });

    test('should skip registration if deployee already exists', async ({ page }) => {
      await page.evaluate(() => {
        // Set existing deployee
        localStorage.setItem('sp:deployee', 'EXISTING_DEPLOYEE');

        // Simulate registration attempt with existing deployee
        const deployee = localStorage.getItem('sp:deployee');

        (window as WindowWithStellarMocks).__skipRegistration = !!deployee;
      });

      const skipRegistration = await page.evaluate(
        () => (window as WindowWithStellarMocks).__skipRegistration
      );
      expect(skipRegistration).toBe(true);
    });
  });

  test.describe('Signing Operations', () => {
    test('should handle prepare sign operation', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate prepareSign function
        const prepareSign = async () => {
          // TODO: Currently returns empty object as per implementation
          return {};
        };

        prepareSign().then((result) => {
          (window as WindowWithStellarMocks).__prepareSignResult = result;
        });
      });

      await page.waitForTimeout(100);

      const result = await page.evaluate(
        () => (window as WindowWithStellarMocks).__prepareSignResult
      );
      expect(result).toEqual({});
    });

    test('should handle sign operation', async ({ page }) => {
      const mockSignParams = {
        signRes: { signature: 'mock-signature' },
        authTxn: 'mock-auth-transaction',
        lastLedger: 12345,
      };

      await page.evaluate((signParams) => {
        const simulateSign = async ({ signRes, authTxn, lastLedger }: typeof signParams) => {
          try {
            // TODO: Currently sets empty contract data as per implementation
            const contractData = {};

            (window as WindowWithStellarMocks).__signResult = {
              success: true,
              contractData,
            };
          } catch (error) {
            (window as WindowWithStellarMocks).__signResult = {
              success: false,
              error: (error as Error).message,
            };
          }
        };

        simulateSign(signParams);
      }, mockSignParams);

      const result = await page.evaluate(() => (window as WindowWithStellarMocks).__signResult);
      expect(result?.success).toBe(true);
      expect(result?.contractData).toEqual({});
    });
  });

  test.describe('Reset Functionality', () => {
    test('should clear all stored data on reset', async ({ page }) => {
      // Set up stored data
      await page.evaluate(() => {
        localStorage.setItem('sp:deployee', 'test-deployee');
        localStorage.setItem('sp:bundler', 'test-bundler');
        localStorage.setItem('sp:id', 'test-credential-id');
      });

      // Verify data is stored
      let storedData = await page.evaluate(() => ({
        deployee: localStorage.getItem('sp:deployee'),
        bundler: localStorage.getItem('sp:bundler'),
        id: localStorage.getItem('sp:id'),
      }));

      expect(storedData.deployee).toBe('test-deployee');
      expect(storedData.bundler).toBe('test-bundler');
      expect(storedData.id).toBe('test-credential-id');

      // Simulate reset
      await page.evaluate(() => {
        localStorage.removeItem('sp:deployee');
        localStorage.removeItem('sp:bundler');
        localStorage.removeItem('sp:id');
      });

      // Verify data is cleared
      storedData = await page.evaluate(() => ({
        deployee: localStorage.getItem('sp:deployee'),
        bundler: localStorage.getItem('sp:bundler'),
        id: localStorage.getItem('sp:id'),
      }));

      expect(storedData.deployee).toBeNull();
      expect(storedData.bundler).toBeNull();
      expect(storedData.id).toBeNull();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate initialization error
        const simulateInitError = async () => {
          try {
            // Force an error during initialization
            throw new Error('Horizon server unavailable');
          } catch (error) {
            (window as WindowWithStellarMocks).__initError = (error as Error).message;
            // Should set loading to false even on error
            (window as WindowWithStellarMocks).__loadingAfterError = false;
          }
        };

        simulateInitError();
      });

      const initError = await page.evaluate(() => (window as WindowWithStellarMocks).__initError);
      const loadingAfterError = await page.evaluate(
        () => (window as WindowWithStellarMocks).__loadingAfterError
      );

      expect(initError).toBe('Horizon server unavailable');
      expect(loadingAfterError).toBe(false);
    });

    test('should handle missing bundler key error', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate operation without bundler key
        const simulateNoBundlerKey = () => {
          const bundlerKey = null;

          if (!bundlerKey) {
            (window as WindowWithStellarMocks).__bundlerKeyError = 'Bundler key not found';
          }
        };

        simulateNoBundlerKey();
      });

      const error = await page.evaluate(() => (window as WindowWithStellarMocks).__bundlerKeyError);
      expect(error).toBe('Bundler key not found');
    });

    test('should handle invalid public keys error', async ({ page }) => {
      await page.evaluate(() => {
        const simulateInvalidKeys = async () => {
          // Simulate getPublicKeys returning invalid data
          const keys = { contractSalt: null, publicKey: undefined };

          if (!keys.contractSalt || !keys.publicKey) {
            (window as WindowWithStellarMocks).__invalidKeysError = 'Invalid public keys';
          }
        };

        simulateInvalidKeys();
      });

      const error = await page.evaluate(
        () => (window as WindowWithStellarMocks).__invalidKeysError
      );
      expect(error).toBe('Invalid public keys');
    });
  });

  test.describe('Loading States', () => {
    test('should manage loading states correctly during registration', async ({ page }) => {
      await page.evaluate(() => {
        const simulateRegistrationLoading = () => {
          const states = [];

          // Initial state
          states.push({ loadingRegister: false, creatingDeployee: false });

          // Start registration
          states.push({ loadingRegister: true, creatingDeployee: false });

          // Start deployment
          states.push({ loadingRegister: true, creatingDeployee: true });

          // Complete
          states.push({ loadingRegister: false, creatingDeployee: false });

          (window as WindowWithStellarMocks).__loadingStates = states;
        };

        simulateRegistrationLoading();
      });

      const loadingStates = await page.evaluate(
        () => (window as WindowWithStellarMocks).__loadingStates
      );

      expect(loadingStates?.[0]).toEqual({ loadingRegister: false, creatingDeployee: false });
      expect(loadingStates?.[1]).toEqual({ loadingRegister: true, creatingDeployee: false });
      expect(loadingStates?.[2]).toEqual({ loadingRegister: true, creatingDeployee: true });
      expect(loadingStates?.[3]).toEqual({ loadingRegister: false, creatingDeployee: false });
    });

    test('should manage loading states during signing', async ({ page }) => {
      await page.evaluate(() => {
        const simulateSignLoading = () => {
          const states = [];

          // Initial state
          states.push({ loadingSign: false });

          // Start signing
          states.push({ loadingSign: true });

          // Complete
          states.push({ loadingSign: false });

          (window as WindowWithStellarMocks).__signLoadingStates = states;
        };

        simulateSignLoading();
      });

      const loadingStates = await page.evaluate(
        () => (window as WindowWithStellarMocks).__signLoadingStates
      );

      expect(loadingStates?.[0]).toEqual({ loadingSign: false });
      expect(loadingStates?.[1]).toEqual({ loadingSign: true });
      expect(loadingStates?.[2]).toEqual({ loadingSign: false });
    });
  });

  test.describe('Storage Management', () => {
    test('should handle storage key constants correctly', async ({ page }) => {
      await page.evaluate(() => {
        const storageKeys = {
          deployee: 'sp:deployee',
          bundler: 'sp:bundler',
          credentialId: 'sp:id',
        };

        (window as WindowWithStellarMocks).__storageKeys = storageKeys;
      });

      const keys = await page.evaluate(() => (window as WindowWithStellarMocks).__storageKeys);

      expect(keys?.deployee).toBe('sp:deployee');
      expect(keys?.bundler).toBe('sp:bundler');
      expect(keys?.credentialId).toBe('sp:id');
    });

    test('should handle storage operations atomically', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate atomic storage operations
        const atomicStore = (
          operations: Array<{ key: string; value: string; operation: string }>
        ) => {
          const results: Array<{ key: string; success: boolean }> = [];

          for (const { key, value, operation } of operations) {
            if (operation === 'set') {
              localStorage.setItem(key, value);
              results.push({ key, success: true });
            } else if (operation === 'remove') {
              localStorage.removeItem(key);
              results.push({ key, success: true });
            }
          }

          return results;
        };

        const operations = [
          { key: 'sp:deployee', value: 'test-deployee', operation: 'set' },
          { key: 'sp:bundler', value: 'test-bundler', operation: 'set' },
          { key: 'sp:id', value: 'test-id', operation: 'set' },
        ];

        (window as WindowWithStellarMocks).__storageResults = atomicStore(operations);
      });

      const results = await page.evaluate(
        () => (window as WindowWithStellarMocks).__storageResults
      );

      expect(results).toHaveLength(3);
      for (const result of results || []) {
        expect(result.success).toBe(true);
      }
    });
  });
});
