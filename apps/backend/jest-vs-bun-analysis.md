# Análisis Jest vs Bun - Tests Backend

## Resumen Ejecutivo

**Total de archivos de test: 13**

### Distribución por Framework:
- **Bun: 9 archivos (69.2%)**
- **Jest: 3 archivos (23.1%)**
- **Mixto (Jest + Bun): 1 archivo (7.7%)**

## Análisis Detallado por Archivo

### ✅ **BUN (9 archivos - 69.2%)**

1. **`tests/integration/booking-integration.test.ts`** ✅
   - Importa: `{ describe, it, expect, beforeEach, afterEach, beforeAll } from 'bun:test'`
   - Usa: `mock.module()` y `mock()`
   - **Estado**: Completo Bun, pero con problemas de supertest

2. **`tests/integration/wallet-auth.test.ts`** ✅
   - Importa: `{ afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'`
   - **Estado**: ✅ **FUNCIONA PERFECTAMENTE**

3. **`tests/integration/confirm-payment.test.ts`** ✅
   - Importa: `{ beforeEach, describe, expect, it, mock } from 'bun:test'`
   - Usa: `mock.module()` y `mock()`
   - **Estado**: ✅ **20 pass, 8 fail** (parcialmente funcional)

4. **`tests/integration/booking-controllers.test.ts`** ✅
   - Importa: `{ beforeEach, describe, expect, it, mock } from 'bun:test'`
   - Usa: `mock.module()` y `mock()`
   - **Estado**: ✅ **Bun completo**

5. **`tests/unit/location.test.ts`** ✅
   - Importa: `{ afterAll, beforeAll, describe, expect, it } from 'bun:test'`
   - **Estado**: ✅ **Bun completo**

6. **`tests/unit/booking.service.test.ts`** ✅
   - Importa: `{ beforeEach, describe, expect, it, mock } from 'bun:test'`
   - Usa: `mock.module()` y `mock()`
   - **Estado**: ✅ **Bun completo**

7. **`src/tests/unit/propertyBlockchain.test.ts`** ✅
   - Importa: `{ beforeEach, describe, expect, test } from 'bun:test'`
   - **Estado**: ✅ **Bun completo**

8. **`src/tests/booking.test.ts`** ✅
   - Importa: `{ beforeEach, describe, expect, it, mock } from 'bun:test'`
   - Usa: `mock.module()` y `mock()`
   - **Estado**: ✅ **Bun completo**

9. **`tests/integration/booking-flow.int.test.ts`** ✅
   - No importa framework específico (usa globals)
   - **Estado**: ✅ **Scaffold simple**

### ❌ **JEST (3 archivos - 23.1%)**

1. **`src/tests/sync.service.test.ts`** ❌
   - Importa: `{ afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'`
   - Usa: `jest.mock()`, `jest.fn()`, `jest.spyOn()`
   - **Estado**: ❌ **Jest puro**

2. **`src/tests/property.test.ts`** ❌
   - No importa framework (usa globals de Jest)
   - Usa: `jest.restoreAllMocks()`, `jest.spyOn()`
   - **Estado**: ❌ **Jest puro**

3. **`tests/integration/booking.test.ts`** ❌
   - No importa framework (usa globals de Jest)
   - Usa: `jest.restoreAllMocks()`
   - **Estado**: ❌ **Jest puro**

### ⚠️ **MIXTO (1 archivo - 7.7%)**

1. **`tests/integration/location.test.ts`** ⚠️
   - No importa framework específico
   - Usa: `jest.Mock` en interfaces pero no importa Jest
   - **Estado**: ⚠️ **Mezcla inconsistente**

## Problemas Identificados

### 1. **Supertest Incompatibilidad**
- **Archivos afectados**: `booking-integration.test.ts`, `location.test.ts`, `booking.test.ts`, `property.test.ts`
- **Problema**: `app.address()` es undefined en Bun
- **Solución**: Reemplazar supertest con fetch nativo

### 2. **Jest Globals**
- **Archivos afectados**: `property.test.ts`, `booking.test.ts`
- **Problema**: Usan `jest.restoreAllMocks()` sin importar Jest
- **Solución**: Migrar a Bun o importar Jest explícitamente

### 3. **Mocks Inconsistentes**
- **Archivos afectados**: `location.test.ts`
- **Problema**: Usa `jest.Mock` en tipos pero no importa Jest
- **Solución**: Unificar a Bun mocks

## Recomendaciones de Migración

### Prioridad Alta
1. **Migrar `sync.service.test.ts`** - Jest → Bun
2. **Migrar `property.test.ts`** - Jest → Bun  
3. **Migrar `booking.test.ts`** - Jest → Bun

### Prioridad Media
4. **Arreglar `location.test.ts`** - Unificar mocks
5. **Reemplazar supertest** en todos los archivos

### Prioridad Baja
6. **Optimizar tests existentes** de Bun

## Estado Actual por Categoría

### ✅ **Tests Funcionales (Bun)**
- `wallet-auth.test.ts` - ✅ **100% funcional**
- `booking-controllers.test.ts` - ✅ **Bun completo**
- `location.test.ts` (unit) - ✅ **Bun completo**
- `booking.service.test.ts` - ✅ **Bun completo**
- `propertyBlockchain.test.ts` - ✅ **Bun completo**
- `booking.test.ts` (src) - ✅ **Bun completo**

### ⚠️ **Tests Parcialmente Funcionales**
- `confirm-payment.test.ts` - ⚠️ **20 pass, 8 fail**
- `booking-integration.test.ts` - ⚠️ **Bun pero supertest issues**

### ❌ **Tests No Funcionales (Jest)**
- `sync.service.test.ts` - ❌ **Jest puro**
- `property.test.ts` - ❌ **Jest puro**
- `booking.test.ts` (integration) - ❌ **Jest puro**

## Conclusión

**69.2% de los tests ya están en Bun**, lo que es un buen progreso. Los principales problemas son:

1. **3 archivos Jest puros** que necesitan migración
2. **Problemas de supertest** que afectan múltiples archivos
3. **1 archivo mixto** que necesita unificación

Con la migración de los 3 archivos Jest restantes, se lograría **100% Bun** en el backend.

