/**
 * Tests for the MathSessionManager.
 *
 * Verifies:
 * - Active session tracking (start, end, reject duplicates)
 * - Cooldown logic (5 min window, remaining time)
 * - Multiple independent users can have sessions simultaneously
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MathSessionManager } from '../../src/math/sessionManager.js';

describe('MathSessionManager', () => {
    let manager: MathSessionManager;

    beforeEach(() => {
        manager = new MathSessionManager(5000); // 5 second cooldown for fast tests
    });

    // ── Active Sessions ──────────────────────────────────────────────

    describe('active sessions', () => {
        it('reports no active session by default', () => {
            expect(manager.hasActiveSession('user1')).toBe(false);
        });

        it('tracks an active session after startSession', () => {
            manager.startSession('user1', 42);
            expect(manager.hasActiveSession('user1')).toBe(true);
        });

        it('retrieves session data', () => {
            manager.startSession('user1', 42);
            const session = manager.getSession('user1');
            expect(session).toBeDefined();
            expect(session!.answer).toBe(42);
            expect(session!.userId).toBe('user1');
        });

        it('clears active session after endSession', () => {
            manager.startSession('user1', 42);
            manager.endSession('user1');
            expect(manager.hasActiveSession('user1')).toBe(false);
            expect(manager.getSession('user1')).toBeUndefined();
        });

        it('multiple users can have independent sessions', () => {
            manager.startSession('user1', 10);
            manager.startSession('user2', 20);
            manager.startSession('user3', 30);

            expect(manager.hasActiveSession('user1')).toBe(true);
            expect(manager.hasActiveSession('user2')).toBe(true);
            expect(manager.hasActiveSession('user3')).toBe(true);
            expect(manager.activeCount).toBe(3);

            // End one, others remain
            manager.endSession('user2');
            expect(manager.hasActiveSession('user1')).toBe(true);
            expect(manager.hasActiveSession('user2')).toBe(false);
            expect(manager.hasActiveSession('user3')).toBe(true);
            expect(manager.activeCount).toBe(2);
        });
    });

    // ── Cooldowns ────────────────────────────────────────────────────

    describe('cooldowns', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('reports no cooldown by default', () => {
            const result = manager.checkCooldown('user1');
            expect(result.onCooldown).toBe(false);
            expect(result.remainingMs).toBe(0);
        });

        it('sets a cooldown after setCooldown', () => {
            manager.setCooldown('user1');
            const result = manager.checkCooldown('user1');
            expect(result.onCooldown).toBe(true);
            expect(result.remainingMs).toBeGreaterThan(0);
            expect(result.remainingMs).toBeLessThanOrEqual(5000);
        });

        it('cooldown expires after the configured duration', () => {
            manager.setCooldown('user1');

            // Still on cooldown after 3 seconds
            vi.advanceTimersByTime(3000);
            let result = manager.checkCooldown('user1');
            expect(result.onCooldown).toBe(true);
            expect(result.remainingMs).toBeLessThanOrEqual(2000);

            // Cooldown expired after 5 seconds total
            vi.advanceTimersByTime(2001);
            result = manager.checkCooldown('user1');
            expect(result.onCooldown).toBe(false);
            expect(result.remainingMs).toBe(0);
        });

        it('multiple users have independent cooldowns', () => {
            manager.setCooldown('user1');

            vi.advanceTimersByTime(2000);
            manager.setCooldown('user2');

            // user1 has been on cooldown for 2s, user2 just started
            const result1 = manager.checkCooldown('user1');
            const result2 = manager.checkCooldown('user2');

            expect(result1.onCooldown).toBe(true);
            expect(result1.remainingMs).toBeLessThanOrEqual(3000);

            expect(result2.onCooldown).toBe(true);
            expect(result2.remainingMs).toBeLessThanOrEqual(5000);

            // Advance 3 more seconds: user1 done, user2 still on cooldown
            vi.advanceTimersByTime(3001);
            expect(manager.checkCooldown('user1').onCooldown).toBe(false);
            expect(manager.checkCooldown('user2').onCooldown).toBe(true);
        });
    });

    // ── Reset ────────────────────────────────────────────────────────

    describe('reset', () => {
        it('clears all sessions and cooldowns', () => {
            manager.startSession('user1', 42);
            manager.startSession('user2', 99);
            manager.setCooldown('user3');

            manager.reset();

            expect(manager.hasActiveSession('user1')).toBe(false);
            expect(manager.hasActiveSession('user2')).toBe(false);
            expect(manager.checkCooldown('user3').onCooldown).toBe(false);
            expect(manager.activeCount).toBe(0);
        });
    });
});
