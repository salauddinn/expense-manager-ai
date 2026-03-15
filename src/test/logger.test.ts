import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug', () => {
    it('calls console.debug with formatted message', () => {
      logger.debug('test debug message');
      expect(consoleSpy.debug).toHaveBeenCalledOnce();
      const call = consoleSpy.debug.mock.calls[0][0] as string;
      expect(call).toContain('[DEBUG]');
      expect(call).toContain('test debug message');
    });

    it('includes timestamp in message', () => {
      logger.debug('timestamp test');
      const call = consoleSpy.debug.mock.calls[0][0] as string;
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('passes additional args to console.debug', () => {
      const extra = { key: 'value' };
      logger.debug('msg', extra);
      expect(consoleSpy.debug).toHaveBeenCalledWith(expect.any(String), extra);
    });
  });

  describe('info', () => {
    it('calls console.info with formatted message', () => {
      logger.info('test info message');
      expect(consoleSpy.info).toHaveBeenCalledOnce();
      const call = consoleSpy.info.mock.calls[0][0] as string;
      expect(call).toContain('[INFO]');
      expect(call).toContain('test info message');
    });

    it('passes multiple args', () => {
      logger.info('multi', 'arg1', 'arg2');
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.any(String), 'arg1', 'arg2');
    });
  });

  describe('warn', () => {
    it('calls console.warn with formatted message', () => {
      logger.warn('test warn message');
      expect(consoleSpy.warn).toHaveBeenCalledOnce();
      const call = consoleSpy.warn.mock.calls[0][0] as string;
      expect(call).toContain('[WARN]');
      expect(call).toContain('test warn message');
    });
  });

  describe('error', () => {
    it('calls console.error with formatted message', () => {
      logger.error('test error message');
      expect(consoleSpy.error).toHaveBeenCalledOnce();
      const call = consoleSpy.error.mock.calls[0][0] as string;
      expect(call).toContain('[ERROR]');
      expect(call).toContain('test error message');
    });

    it('passes error objects as additional args', () => {
      const err = new Error('something failed');
      logger.error('error occurred', err);
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.any(String), err);
    });
  });

  describe('log level format', () => {
    it('debug message format includes level in brackets', () => {
      logger.debug('format test');
      const msg = consoleSpy.debug.mock.calls[0][0] as string;
      expect(msg).toMatch(/^\[.+\] \[DEBUG\] format test$/);
    });

    it('info message format is consistent', () => {
      logger.info('info format');
      const msg = consoleSpy.info.mock.calls[0][0] as string;
      expect(msg).toMatch(/^\[.+\] \[INFO\] info format$/);
    });

    it('warn message format is consistent', () => {
      logger.warn('warn format');
      const msg = consoleSpy.warn.mock.calls[0][0] as string;
      expect(msg).toMatch(/^\[.+\] \[WARN\] warn format$/);
    });

    it('error message format is consistent', () => {
      logger.error('error format');
      const msg = consoleSpy.error.mock.calls[0][0] as string;
      expect(msg).toMatch(/^\[.+\] \[ERROR\] error format$/);
    });
  });
});
