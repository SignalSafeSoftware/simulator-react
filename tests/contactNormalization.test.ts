import { describe, expect, it } from 'vitest';
import {
    namesMatch,
    normalizeEmailForMatch,
    normalizeNameForMatch,
    normalizePhoneForMatch,
    phoneDigitsOnly,
    phonesMatch,
} from '../src/utils/contactNormalization';

describe('contactNormalization', () => {
    it('covers string normalization fallbacks and matching helpers', () => {
        expect(normalizeNameForMatch('  Ada   Lovelace  ')).toBe('ada lovelace');
        expect(normalizeNameForMatch(null as never)).toBe('');

        expect(phoneDigitsOnly('+1 (555) 0100')).toBe('15550100');
        expect(phoneDigitsOnly(null as never)).toBe('');
        expect(normalizePhoneForMatch('+1 (555) 123-4567')).toBe('5551234567');

        expect(normalizeEmailForMatch('  USER@Example.test ')).toBe('user@example.test');
        expect(normalizeEmailForMatch(null as never)).toBe('');

        expect(phonesMatch('+1-555-123-4567', '5551234567')).toBe(true);
        expect(phonesMatch('5551234', '1234')).toBe(false);
        expect(phonesMatch('5551234567', '1234567')).toBe(true);

        expect(namesMatch('Ada Lovelace', 'Ada')).toBe(true);
        expect(namesMatch('', 'Ada')).toBe(false);
    });

    it('keeps non-us eleven-digit numbers intact when they do not start with 1', () => {
        expect(normalizePhoneForMatch('25551234567')).toBe('25551234567');
    });

    it('matches phones when the shorter normalized number is contained in the longer one', () => {
        expect(phonesMatch('1234567', '5551234567')).toBe(true);
    });

    it('does not match different long phone numbers that do not contain each other', () => {
        expect(phonesMatch('5551234567', '5557654321')).toBe(false);
    });

    it('matches names in reverse containment after trimming and lowercasing', () => {
        expect(namesMatch(' Ada ', 'Ada Lovelace')).toBe(true);
    });
});
