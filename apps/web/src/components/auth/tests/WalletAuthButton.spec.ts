import { expect, test } from '@playwright/test';

interface WindowWithTestMocks extends Window {
  __openedUrls?: string[];
  __successCalled?: boolean;
}

test.describe('WalletAuthButton Component', () => {
  test.beforeEach(async ({ walletAuthPage }) => {
    await walletAuthPage.goto();
  });

  test.describe('User Interactions', () => {
    test('should handle install Freighter click', async ({ page, walletAuthPage }) => {
      const mock = FreighterPresets.notInstalled();
      await mock.setup(page);
      await page.reload();

      // Track window.open calls
      await page.evaluate(() => {
        (window as WindowWithTestMocks).__openedUrls = [];
        window.open = (url: string) => {
          (window as WindowWithTestMocks).__openedUrls?.push(url);
          return null;
        };
      });

      await walletAuthPage.clickInstallFreighter();

      const openedUrls = await page.evaluate(() => (window as WindowWithTestMocks).__openedUrls);
      expect(openedUrls).toContain('https://freighter.app/');
    });
  });

  test.describe('Helper Text States', () => {
    test('should show appropriate helper text for each state', async ({ walletAuthPage }) => {
      // Idle state
      await walletAuthPage.expectHelperText('One-click authentication with your Stellar wallet');

      // Authenticating state
      await walletAuthPage.clickWalletAuth();
      await walletAuthPage.expectHelperText(
        'You may see 1-2 wallet popups for connection and signing'
      );

      // Wait for completion
      await walletAuthPage.waitForWalletAuthentication();
    });
  });

  test.describe('Visual Styling', () => {
    test('should apply correct button styles for each state', async ({ walletAuthPage }) => {
      // Idle state - default styling
      await expect(walletAuthPage.walletAuthButton).toHaveClass(/border-gray-300/);
      await expect(walletAuthPage.walletAuthButton).toHaveClass(/bg-white/);

      // Click to trigger authenticating state
      await walletAuthPage.clickWalletAuth();

      // Should maintain styling during authentication
      await expect(walletAuthPage.walletAuthButton).toBeVisible();
    });
  });

  test.describe('Component Integration', () => {
    test('should call success callback', async ({ walletAuthPage, page }) => {
      // Mock success callback tracking
      await page.evaluate(() => {
        (window as WindowWithTestMocks).__successCalled = false;
        const originalPush = window.history.pushState;
        window.history.pushState = function (state, title, url) {
          if (url?.includes('/dashboard')) {
            (window as WindowWithTestMocks).__successCalled = true;
          }
          return originalPush.call(this, state, title, url);
        };
      });

      await walletAuthPage.clickWalletAuth();
      await walletAuthPage.waitForWalletAuthentication();
      await walletAuthPage.waitForRedirect('/dashboard');

      const successCalled = await page.evaluate(
        () => (window as WindowWithTestMocks).__successCalled
      );
      expect(successCalled).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper button accessibility', async ({ walletAuthPage }) => {
      // Button should be focusable
      await walletAuthPage.walletAuthButton.focus();
      await expect(walletAuthPage.walletAuthButton).toBeFocused();

      // Should have proper button semantics
      await expect(walletAuthPage.walletAuthButton).toHaveAttribute('type', 'button');
    });
  });
});
