/// <reference types="@types/jest" />;
import { stripTitlesAndEmojisFromName } from "../strip-titles-and-emojis";

describe('stripTitlesAndEmojisFromName', () => {
    it('returns an empty string when given an empty string', () => {
        expect(stripTitlesAndEmojisFromName('')).toBe('');
    });

    it('removes all titles from the name string', () => {
        const name = 'Dr. John Smith';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('Single letter stays in name', () => {
        const name = 'John F Kennedy';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John F Kennedy');
    });

    it('Single letter stays in name but puntuatio is removed', () => {
        const name = 'John F. Kennedy';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John F Kennedy');
    });

    it('removes all emojis from the name string', () => {
        const name = "🚀🏄🏽👨🏽‍🌾👳🏼‍♂️John 🚀 Smith👳🏼‍♂️🚀🏄🏽👨🏽‍🌾"
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('removes both titles and emojis from the name string', () => {
        const name = "Dr. John Smith 🚀";
        expect(stripTitlesAndEmojisFromName(name)).toBe("John Smith");
    });

    it('returns the name string unchanged if it contains no titles or emojis', () => {
        const name = 'John Smith';
        expect(stripTitlesAndEmojisFromName(name)).toBe(name);
    });

    it('removes leading and trailing spaces from the resulting name string', () => {
        const name = '  Dr. 🚀 John Smith 🚀 🚀';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('ignores titles (MD) that are part of the name string but not at the beginning', () => {
        const name = 'John Doe, MD';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Doe');
    });

    it('ignores titles (PHD) that are part of the name string but not at the beginning', () => {
        const name = 'John Doe, PHD';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Doe');
    });

    it('lower case phd is removed', () => {
        const name = 'John Doe, phd';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Doe');
    });

    it('removes "Medical Doctor" title from the name', () => {
        const name = 'John Smith, Medical Doctor';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('removes "MD" title from the name', () => {
        const name = 'Dr. John Smith, MD';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('removes "M.D." title from the name', () => {
        const name = 'John F. Smith, M.D.';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John F Smith');
    });

    it('removes "D.O." title from the name', () => {
        const name = 'Dr. John Smith, D.O.';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('removes "MBBS" title from the name', () => {
        const name = 'John Smith, MBBS';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('removes multiple titles from the name', () => {
        const name = 'Dr. John Smith, MD, MBBS';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });

    it('removes doctor emoji and titles from the name', () => {
        const name = 'Dr. John Smith, MD 👨‍⚕️';
        expect(stripTitlesAndEmojisFromName(name)).toBe('John Smith');
    });
});
