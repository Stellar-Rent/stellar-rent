import { createServer } from 'node:net';

/**
 * Checks if a port is available for binding
 * @param port - The port number to check
 * @returns Promise that resolves to true if port is available, false otherwise
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });

    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Finds an available port from a list of preferred ports
 * @param preferredPorts - Array of port numbers to try in order
 * @returns Promise that resolves to the first available port, or null if none are available
 */
export async function findAvailablePort(
  preferredPorts: number[]
): Promise<number | null> {
  for (const port of preferredPorts) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  return null;
}
