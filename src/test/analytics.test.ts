import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analytics } from '@/lib/analytics';

describe('analytics', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('init', () => {
    it('initializes without error', () => {
      expect(() => analytics.init()).not.toThrow();
    });

    it('can be called multiple times without error (idempotent)', () => {
      expect(() => {
        analytics.init();
        analytics.init();
        analytics.init();
      }).not.toThrow();
    });

    it('logs initialization message on first call', () => {
      const freshAnalytics = new (analytics.constructor as new () => typeof analytics)();
      freshAnalytics.init();
      expect(infoSpy).toHaveBeenCalled();
    });
  });

  describe('track', () => {
    it('calls debug log with event name', () => {
      analytics.track('test_event');
      expect(debugSpy).toHaveBeenCalled();
      const call = debugSpy.mock.calls[0][0] as string;
      expect(call).toContain('test_event');
    });

    it('tracks event without properties', () => {
      expect(() => analytics.track('simple_event')).not.toThrow();
    });

    it('tracks event with properties', () => {
      const props = { category: 'food', amount: 500 };
      expect(() => analytics.track('transaction_added', props)).not.toThrow();
      expect(debugSpy).toHaveBeenCalledWith(expect.any(String), props);
    });

    it('tracks event with numeric properties', () => {
      expect(() => analytics.track('goal_milestone', { milestones: '25', target: 100000 })).not.toThrow();
    });

    it('tracks event with boolean properties', () => {
      expect(() => analytics.track('feature_used', { enabled: true })).not.toThrow();
    });

    it('tracks event with undefined property values', () => {
      expect(() => analytics.track('action', { value: undefined })).not.toThrow();
    });
  });

  describe('identify', () => {
    it('identifies user without error', () => {
      expect(() => analytics.identify('user-123')).not.toThrow();
    });

    it('identifies user with traits', () => {
      const traits = { plan: 'premium', signupDate: '2025-01-01' };
      expect(() => analytics.identify('user-456', traits)).not.toThrow();
      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('user-456'), traits);
    });

    it('identifies user without traits', () => {
      expect(() => analytics.identify('user-789')).not.toThrow();
    });
  });

  describe('page', () => {
    it('tracks page view without error', () => {
      expect(() => analytics.page('Dashboard')).not.toThrow();
    });

    it('tracks page view with properties', () => {
      const props = { referrer: '/login' };
      expect(() => analytics.page('Dashboard', props)).not.toThrow();
      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Dashboard'), props);
    });

    it('tracks page view without properties', () => {
      expect(() => analytics.page('Transactions')).not.toThrow();
    });
  });
});
