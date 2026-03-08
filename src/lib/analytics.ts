/**
 * Analytics abstraction layer.
 *
 * Currently a no-op stub. When you integrate a real analytics provider
 * (e.g. Mixpanel, PostHog, Google Analytics), implement the methods here.
 * All call sites remain unchanged.
 *
 * Usage:
 *   import { analytics } from '@/lib/analytics';
 *   analytics.track('transaction_added', { category: 'food', amount: 500 });
 */

import { logger } from './logger';

export interface AnalyticsEvent {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private initialized = false;

  /**
   * Initialize analytics provider. Call once at app startup.
   * Replace the body with your real provider's init code.
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
    logger.info('Analytics initialized (stub)');
  }

  /**
   * Track a named event with optional properties.
   */
  track(event: string, properties?: AnalyticsEvent) {
    logger.debug(`[Analytics] ${event}`, properties);
    // TODO: Replace with real provider call
    // e.g. posthog.capture(event, properties);
    // e.g. mixpanel.track(event, properties);
  }

  /**
   * Identify a user (for when you add auth).
   */
  identify(userId: string, traits?: AnalyticsEvent) {
    logger.debug(`[Analytics] identify: ${userId}`, traits);
    // TODO: Replace with real provider call
  }

  /**
   * Track a page view.
   */
  page(name: string, properties?: AnalyticsEvent) {
    logger.debug(`[Analytics] page: ${name}`, properties);
    // TODO: Replace with real provider call
  }
}

export const analytics = new Analytics();
