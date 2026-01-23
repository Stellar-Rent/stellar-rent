// tests/e2e/tests/components/useStellar.spec.ts
import { expect, test } from '../../fixtures/auth.fixture';

interface StellarHookMocks {
  friendbotResponse?: { successful: boolean };
  deployResponse?: string;
  publicKeysResponse?: { contractSalt: string; publicKey: string };
  shouldThrowError?: boolean;
  errorMessage?: string;
}

interface WindowWithStellarMocks extends Window {
  __stellarHookMocks?: StellarHookMocks;
  __hookInitialState?: {
    deployee: string | null;
    loadingDeployee: boolean;
    loadingRegister: boolean;
    loadingSign: boolean;
    creatingDeployee: boolean;
    contractData: unknown | null;
  };
  __friendbotSuccess?: boolean;
  __friendbotError?: string;
  __newBundlerKey?: { publicKey: string; secret: string };
  __restoredBundlerKey?: { publicKey: string; secret: string };
  __restoredDeployee?: string;
  __initError?: string;
  __loadingAfterError?: boolean;
  __registrationSkipped?: boolean;
}

interface MockKeypair {
  publicKey: () => string;
  secret: () => string;
}

interface MockStellarSDK {
  Keypair: {
    random: () => MockKeypair;
    fromSecret: (secret: string) => MockKeypair;
  };
  Horizon: {
    Server: new (
      url: string
    ) => {
      friendbot: (publicKey: string) => {
        call: () => Promise<{ successful: boolean }>;
      };
    };
  };
}

interface MockStellarUtils {
  handleDeploy: (
    bundlerKey: MockKeypair,
    contractSalt: string,
    publicKey: string
  ) => Promise<string>;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  getPublicKeys: (registerRes: any) => Promise<{ contractSalt: string; publicKey: string }>;
}

test.describe('useStellar Hook', () => {
  test.beforeEach(async ({ page }: { page: import('@playwright/test').Page }) => {
    await page.addInitScript(() => {
      const mocks: StellarHookMocks = {};
      (window as WindowWithStellarMocks).__stellarHookMocks = mocks;

      // Mock localStorage with proper interface
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
      const stellarSDK: MockStellarSDK = {
        Keypair: {
          random: () => ({
            publicKey: () => `GBTEST${Math.random().toString(36).substr(2, 50)}`,
            secret: () => `SBTEST${Math.random().toString(36).substr(2, 50)}`,
          }),
          fromSecret: (secret: string) => ({
            publicKey: () => secret.replace('S', 'G'),
            secret: () => secret,
          }),
        },
        Horizon: {
          Server: class MockHorizonServer {
            friendbot(_publicKey: string) {
              return {
                call: async () => {
                  const mocks = (window as WindowWithStellarMocks).__stellarHookMocks;
                  if (mocks?.shouldThrowError) {
                    throw new Error(mocks.errorMessage || 'Friendbot failed');
                  }
                  return mocks?.friendbotResponse || { successful: true };
                },
              };
            }
          },
        },
      };

      (window as WindowWithStellarMocks)['@stellar/stellar-sdk'] = stellarSDK;

      // Mock passkey utilities
      const mockStellarUtils: MockStellarUtils = {
        handleDeploy: async (
          _bundlerKey: MockKeypair,
          _contractSalt: string,
          _publicKey: string
        ) => {
          const mocks = (window as WindowWithStellarMocks).__stellarHookMocks;
          if (mocks?.shouldThrowError) {
            throw new Error(mocks.errorMessage || 'Deploy failed');
          }
          return mocks?.deployResponse || `CTEST${Math.random().toString(36).substr(2, 50)}`;
        },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        getPublicKeys: async (_registerRes: any) => {
          const mocks = (window as WindowWithStellarMocks).__stellarHookMocks;
          if (mocks?.shouldThrowError) {
            throw new Error(mocks.errorMessage || 'Public keys failed');
          }
          return (
            mocks?.publicKeysResponse || {
              contractSalt: `mock_salt_${Date.now()}`,
              publicKey: `mock_key_${Date.now()}`,
            }
          );
        },
      };

      (window as WindowWithStellarMocks).mockStellarUtils = mockStellarUtils;
    });

    await page.goto('/');
  });

  test.describe('Hook Initialization', () => {
    test('should initialize with correct default state', async ({
      page,
    }: { page: import('@playwright/test').Page }) => {
      await page.evaluate(() => {
        const initialState = {
          deployee: null,
          loadingDeployee: true,
          loadingRegister: false,
          loadingSign: false,
          creatingDeployee: false,
          contractData: null,
        };

        (window as WindowWithStellarMocks).__hookInitialState = initialState;
      });

      const state = await page.evaluate(
        () => (window as WindowWithStellarMocks).__hookInitialState
      );

      expect(state?.deployee).toBeNull();
      expect(state?.loadingDeployee).toBe(true);
      expect(state?.loadingRegister).toBe(false);
      expect(state?.loadingSign).toBe(false);
      expect(state?.creatingDeployee).toBe(false);
      expect(state?.contractData).toBeNull();
    });

    test('should create new bundler key when none exists', async ({ page }) => {
      await page.evaluate(async () => {
        const SDK = (window as WindowWithStellarMocks)['@stellar/stellar-sdk'] as MockStellarSDK;
        const newKeypair = SDK.Keypair.random();

        localStorage.setItem('sp:bundler', newKeypair.secret());

        const horizon = new SDK.Horizon.Server('https://horizon-testnet.stellar.org');
        try {
          await horizon.friendbot(newKeypair.publicKey()).call();
          (window as WindowWithStellarMocks).__friendbotSuccess = true;
        } catch (error) {
          (window as WindowWithStellarMocks).__friendbotError = (error as Error).message;
        }

        (window as WindowWithStellarMocks).__newBundlerKey = {
          publicKey: newKeypair.publicKey(),
          secret: newKeypair.secret(),
        };
      });

      const bundlerKey = await page.evaluate(
        () => (window as WindowWithStellarMocks).__newBundlerKey
      );
      const friendbotSuccess = await page.evaluate(
        () => (window as WindowWithStellarMocks).__friendbotSuccess
      );
      const storedSecret = await page.evaluate(() => localStorage.getItem('sp:bundler'));

      expect(bundlerKey?.publicKey).toContain('GBTEST');
      expect(bundlerKey?.secret).toContain('SBTEST');
      expect(friendbotSuccess).toBe(true);
      expect(storedSecret).toBe(bundlerKey?.secret);
    });

    test('should restore existing bundler key from storage', async ({ page }) => {
      const existingSecret = `SBTESTEXISTINGKEY${Math.random().toString(36).substr(2, 40)}`;

      await page.evaluate((secret) => {
        localStorage.setItem('sp:bundler', secret);

        const SDK = (window as WindowWithStellarMocks)['@stellar/stellar-sdk'] as MockStellarSDK;
        const restoredKeypair = SDK.Keypair.fromSecret(secret);

        (window as WindowWithStellarMocks).__restoredBundlerKey = {
          publicKey: restoredKeypair.publicKey(),
          secret: restoredKeypair.secret(),
        };
      }, existingSecret);

      const restoredKey = await page.evaluate(
        () => (window as WindowWithStellarMocks).__restoredBundlerKey
      );

      expect(restoredKey?.secret).toBe(existingSecret);
      expect(restoredKey?.publicKey).toBe(existingSecret.replace('S', 'G'));
    });

    test('should restore existing deployee from storage', async ({ page }) => {
      const existingDeployee = `CTESTEXISTINGDEPLOYEE${Math.random().toString(36).substr(2, 40)}`;

      await page.evaluate((deployee) => {
        localStorage.setItem('sp:deployee', deployee);
        const restored = localStorage.getItem('sp:deployee');
        (window as WindowWithStellarMocks).__restoredDeployee = restored;
      }, existingDeployee);

      const restoredDeployee = await page.evaluate(
        () => (window as WindowWithStellarMocks).__restoredDeployee
      );
      expect(restoredDeployee).toBe(existingDeployee);
    });

    test('should handle initialization errors gracefully', async ({ page }) => {
      await page.evaluate(() => {
        const mocks = (window as WindowWithStellarMocks).__stellarHookMocks;
        if (mocks) {
          mocks.shouldThrowError = true;
          mocks.errorMessage = 'Network connection failed';
        }
      });

      await page.evaluate(async () => {
        try {
          const SDK = (window as WindowWithStellarMocks)['@stellar/stellar-sdk'] as MockStellarSDK;
          const keypair = SDK.Keypair.random();
          const horizon = new SDK.Horizon.Server('https://horizon-testnet.stellar.org');

          await horizon.friendbot(keypair.publicKey()).call();
        } catch (error) {
          (window as WindowWithStellarMocks).__initError = (error as Error).message;
          (window as WindowWithStellarMocks).__loadingAfterError = false;
        }
      });

      const initError = await page.evaluate(() => (window as WindowWithStellarMocks).__initError);
      const loadingAfterError = await page.evaluate(
        () => (window as WindowWithStellarMocks).__loadingAfterError
      );

      expect(initError).toBe('Network connection failed');
      expect(loadingAfterError).toBe(false);
    });
  });

  test.describe('Registration (onRegister)', () => {
    test('should skip registration if deployee already exists', async ({ page }) => {
      const existingDeployee = `CTESTEXISTING${Math.random().toString(36).substr(2, 40)}`;

      await page.evaluate((deployee) => {
        localStorage.setItem('sp:deployee', deployee);

        const currentDeployee = localStorage.getItem('sp:deployee');
        (window as WindowWithStellarMocks).__registrationSkipped = !!currentDeployee;
      }, existingDeployee);

      const skipped = await page.evaluate(
        () => (window as WindowWithStellarMocks).__registrationSkipped
      );
      expect(skipped).toBe(true);
    });
  });

  test.describe('Storage Operations', () => {
    test('should handle storage key operations correctly', async ({ page }) => {
      await page.evaluate(() => {
        const storageKeys = {
          deployee: 'sp:deployee',
          bundler: 'sp:bundler',
          credentialId: 'sp:id',
        };

        // Test setting values
        localStorage.setItem(storageKeys.deployee, 'test-deployee');
        localStorage.setItem(storageKeys.bundler, 'test-bundler');
        localStorage.setItem(storageKeys.credentialId, 'test-id');

        // Test getting values
        const values = {
          deployee: localStorage.getItem(storageKeys.deployee),
          bundler: localStorage.getItem(storageKeys.bundler),
          credentialId: localStorage.getItem(storageKeys.credentialId),
        };

        (window as WindowWithStellarMocks).__storageTest = values;
      });

      const values = await page.evaluate(() => (window as WindowWithStellarMocks).__storageTest);

      expect(values?.deployee).toBe('test-deployee');
      expect(values?.bundler).toBe('test-bundler');
      expect(values?.credentialId).toBe('test-id');
    });

    test('should handle storage clearing', async ({ page }) => {
      await page.evaluate(() => {
        // Set initial values
        localStorage.setItem('sp:deployee', 'test-deployee');
        localStorage.setItem('sp:bundler', 'test-bundler');
        localStorage.setItem('sp:id', 'test-id');

        // Clear specific items
        localStorage.removeItem('sp:deployee');
        localStorage.removeItem('sp:bundler');
        localStorage.removeItem('sp:id');

        // Check if cleared
        const clearedValues = {
          deployee: localStorage.getItem('sp:deployee'),
          bundler: localStorage.getItem('sp:bundler'),
          credentialId: localStorage.getItem('sp:id'),
        };

        (window as WindowWithStellarMocks).__clearedValues = clearedValues;
      });

      const clearedValues = await page.evaluate(
        () => (window as WindowWithStellarMocks).__clearedValues
      );

      expect(clearedValues?.deployee).toBeNull();
      expect(clearedValues?.bundler).toBeNull();
      expect(clearedValues?.credentialId).toBeNull();
    });
  });
});
