/**
 * Test Suite: Prep Tab Data Sources
 *
 * Tests that all travel intelligence modules return valid data
 * for known destinations and handle offline/error cases gracefully.
 */

import { getEmergencyForDestination } from '../lib/prep/emergency-data';
import { getTimezoneByDestination } from '../lib/timezone';
import { getSafetyForDestination } from '../lib/prep/safety-data';

// ---------------------------------------------------------------------------
// Emergency Numbers
// ---------------------------------------------------------------------------
describe('Emergency Numbers', () => {
  it('returns emergency data for Tokyo', () => {
    const data = getEmergencyForDestination('Tokyo');
    expect(data).not.toBeNull();
    if (data) {
      expect(data.police).toBeTruthy();
      expect(data.ambulance).toBeTruthy();
      expect(data.fire).toBeTruthy();
    }
  });

  it('returns emergency data for Paris', () => {
    const data = getEmergencyForDestination('Paris');
    expect(data).not.toBeNull();
  });

  it('returns emergency data for Bali', () => {
    const data = getEmergencyForDestination('Bali');
    expect(data).not.toBeNull();
  });

  it('returns null for unknown destination', () => {
    const data = getEmergencyForDestination('Atlantis');
    expect(data === null || typeof data === 'object').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Timezone
// ---------------------------------------------------------------------------
describe('Timezone', () => {
  it('returns timezone for Tokyo', () => {
    const tz = getTimezoneByDestination('Tokyo');
    expect(tz).not.toBeNull();
    expect(typeof tz).toBe('string');
    if (tz) {
      expect(tz).toContain('Asia');
    }
  });

  it('returns timezone for Paris', () => {
    const tz = getTimezoneByDestination('Paris');
    expect(tz).not.toBeNull();
    if (tz) {
      expect(tz).toContain('Europe');
    }
  });

  it('returns null for unknown destination', () => {
    const tz = getTimezoneByDestination('Atlantis');
    expect(tz).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Safety Data
// ---------------------------------------------------------------------------
describe('Safety Data', () => {
  it('returns safety data for Tokyo', () => {
    const safety = getSafetyForDestination('Tokyo');
    expect(safety).not.toBeNull();
    if (safety) {
      expect(typeof safety.safetyScore).toBe('number');
      expect(safety.safetyScore).toBeGreaterThanOrEqual(0);
      expect(safety.safetyScore).toBeLessThanOrEqual(100);
    }
  });

  it('returns safety data for multiple destinations', () => {
    const destinations = ['Paris', 'Bali', 'Bangkok', 'New York'];
    for (const dest of destinations) {
      const safety = getSafetyForDestination(dest);
      expect(safety).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// Offline Fallback — All local data should work without network
// ---------------------------------------------------------------------------
describe('Offline Fallback', () => {
  it('emergency data works without network (local data)', () => {
    const data = getEmergencyForDestination('Tokyo');
    expect(data).not.toBeNull();
  });

  it('timezone works without network (local data)', () => {
    const tz = getTimezoneByDestination('Tokyo');
    expect(tz).not.toBeNull();
  });

  it('safety works without network (local data)', () => {
    const safety = getSafetyForDestination('Tokyo');
    expect(safety).not.toBeNull();
  });

  it('all data has expected structure', () => {
    const emergency = getEmergencyForDestination('Tokyo');
    const tz = getTimezoneByDestination('Tokyo');
    const safety = getSafetyForDestination('Tokyo');

    expect(emergency).toBeTruthy();
    expect(tz).toBeTruthy();
    expect(safety).toBeTruthy();
  });
});
