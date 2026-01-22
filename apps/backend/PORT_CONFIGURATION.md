# Automatic Port Configuration

This document describes the automatic port detection and configuration system implemented for the StellarRent backend.

## Overview

The backend now automatically detects and uses an available port, eliminating port conflicts when running frontend and backend services simultaneously in local development environments.

## Features

###  Automatic Port Detection

- **Default Behavior**: The backend tries port 3000 first, then automatically falls back to port 3001 if 3000 is occupied
- **Environment Override**: You can still specify a custom port using the `PORT` environment variable
- **Port Availability Check**: The system verifies port availability before attempting to bind

###  CORS Configuration

- The backend accepts requests from both `http://localhost:3000` and `http://localhost:3001`
- This ensures the frontend can connect regardless of which port the backend uses

###  Clear Error Messages

- Informative console messages indicate which port is being used
- Helpful error messages if no ports are available

## Implementation Details

### Port Utility Functions

Located in `src/utils/port.util.ts`:

- **`isPortAvailable(port: number)`**: Checks if a specific port is available for binding
- **`findAvailablePort(preferredPorts: number[])`**: Finds the first available port from a list of preferred ports

### Server Startup Logic

The server startup process in `src/index.ts`:

1. Checks if `PORT` environment variable is set (uses it if available)
2. If not set, tries ports in order: `[3000, 3001]`
3. Verifies port availability before binding
4. Displays clear messages about which port is being used
5. Handles errors gracefully with helpful error messages

## Usage

### Basic Usage

Simply start the backend as usual:

```bash
bun run dev
```

The backend will automatically:
- Try port 3000 first
- Use port 3001 if 3000 is occupied
- Display which port it's using in the console

### Custom Port

To use a specific port, set the `PORT` environment variable:

```bash
PORT=4000 bun run dev
```

### Running Frontend and Backend Simultaneously

**Recommended Startup Order:**

1. **Start Backend First** (from `apps/backend/`):
   ```bash
   bun run dev
   ```
   - Backend will try port 3000 first
   - If 3000 is occupied, it automatically uses port 3001
   - Check the console output to see which port is being used

2. **Start Frontend** (from `apps/web/`):
   ```bash
   bun run dev
   ```
   - Frontend typically uses port 3000
   - If backend is on 3001, frontend can use 3000 without conflicts

## Console Output Examples

### When Port 3000 is Available:
```
 Server running on http://localhost:3000
 Redis connection established
 Blockchain synchronization service started
 All services initialized successfully
```

### When Port 3000 is Occupied:
```
 Server running on http://localhost:3001
ℹ  Port 3000 was occupied, using port 3001 instead
 Redis connection established
 Blockchain synchronization service started
 All services initialized successfully
```

### When No Ports are Available:
```
 None of the preferred ports (3000, 3001) are available. Please free up a port or set PORT environment variable.
 Failed to start server: Error: ...
```

## Troubleshooting

### Check Which Ports Are In Use

**Windows:**
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

**Linux/Mac:**
```bash
lsof -i :3000
lsof -i :3001
```

### Free Up a Port

If you need to free up a port:

**Windows:**
```bash
# Find the process ID (PID) using the port
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find the process using the port
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

## Technical Details

### Port Detection Algorithm

1. If `PORT` environment variable is set and valid, use it
2. Otherwise, iterate through preferred ports `[3000, 3001]`
3. For each port:
   - Create a temporary server socket
   - Attempt to bind to the port
   - If successful, close the socket and return the port
   - If failed (EADDRINUSE), try the next port
4. If no ports are available, throw an error

### Error Handling

The implementation includes comprehensive error handling:

- **Port Already in Use**: Clear error message with instructions
- **Invalid Port**: Validation of environment variable port value
- **No Available Ports**: Helpful error message suggesting solutions

## Files Modified

- `src/index.ts`: Updated server startup logic with automatic port detection
- `src/utils/port.util.ts`: New utility functions for port availability checking

## Benefits

1. **No Manual Configuration**: Developers don't need to manually configure ports
2. **Conflict Resolution**: Automatically handles port conflicts
3. **Better Developer Experience**: Clear messages and error handling
4. **Flexibility**: Still supports custom ports via environment variables
5. **CORS Compatibility**: Works seamlessly with frontend on either port

## Acceptance Criteria Met

 Backend can successfully start even if port 3000 is occupied  
 CORS configuration supports both ports  
 Clear documentation provided for developers  
 Automatic port detection implemented  
 Startup check verifies port availability before binding
