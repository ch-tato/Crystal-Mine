/**
 * Session manager for the /math command.
 *
 * Tracks:
 * - Active sessions: prevents a user from starting a second challenge
 *   while one is already in progress.
 * - Cooldowns: enforces a 5-minute wait period that begins AFTER
 *   the challenge ends (correct, incorrect, or timeout).
 */

// ── Types ────────────────────────────────────────────────────────────

export interface MathSession {
    readonly userId: string;
    readonly answer: number;
    readonly startedAt: number;
}

// ── Session Manager ──────────────────────────────────────────────────

export class MathSessionManager {
    /** Active math challenges, keyed by user ID. */
    private readonly activeSessions = new Map<string, MathSession>();

    /** Cooldown timestamps (when the cooldown was SET), keyed by user ID. */
    private readonly cooldowns = new Map<string, number>();

    /** Duration of the cooldown in milliseconds. Default: 5 minutes. */
    private readonly cooldownMs: number;

    constructor(cooldownMs: number = 5 * 60 * 1000) {
        this.cooldownMs = cooldownMs;
    }

    // ── Active Session Management ────────────────────────────────────

    /** Returns true if the user currently has an active math challenge. */
    hasActiveSession(userId: string): boolean {
        return this.activeSessions.has(userId);
    }

    /** Registers a new active session for the user. */
    startSession(userId: string, answer: number): void {
        this.activeSessions.set(userId, {
            userId,
            answer,
            startedAt: Date.now(),
        });
    }

    /** Retrieves the active session for a user, or undefined. */
    getSession(userId: string): MathSession | undefined {
        return this.activeSessions.get(userId);
    }

    /** Removes the active session for a user. */
    endSession(userId: string): void {
        this.activeSessions.delete(userId);
    }

    // ── Cooldown Management ──────────────────────────────────────────

    /**
     * Checks if a user is currently on cooldown.
     * @returns An object with the cooldown state and remaining time.
     */
    checkCooldown(userId: string): { onCooldown: boolean; remainingMs: number } {
        const lastSet = this.cooldowns.get(userId);
        if (lastSet === undefined) {
            return { onCooldown: false, remainingMs: 0 };
        }

        const elapsed = Date.now() - lastSet;
        if (elapsed >= this.cooldownMs) {
            this.cooldowns.delete(userId);
            return { onCooldown: false, remainingMs: 0 };
        }

        return { onCooldown: true, remainingMs: this.cooldownMs - elapsed };
    }

    /** Sets the cooldown for a user (called after a challenge ends). */
    setCooldown(userId: string): void {
        this.cooldowns.set(userId, Date.now());
    }

    // ── Cleanup ──────────────────────────────────────────────────────

    /** Returns the number of currently active sessions (useful for tests). */
    get activeCount(): number {
        return this.activeSessions.size;
    }

    /** Clears all sessions and cooldowns (useful for tests). */
    reset(): void {
        this.activeSessions.clear();
        this.cooldowns.clear();
    }
}
