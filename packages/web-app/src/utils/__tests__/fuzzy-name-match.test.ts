import { fuzzyMatchNames } from "../fuzzy-name-match";

describe('fuzzyMatchNames', () => {
    test('returns true for exact match', () => {
        expect(fuzzyMatchNames("Kristian", "Mortensen", "Kristian", "Mortensen")).toBe(true);
    });

    test('returns true for valid fuzzy match', () => {
        // expect(fuzzyMatchNames("Kristian", "Mortensen Jr.", "Kristan", "Mortensen")).toBe(true);
        expect(fuzzyMatchNames("kRiStIaN", "mortensen", "Kristian", "Mortensen")).toBe(true);
        // expect(fuzzyMatchNames("Kristian", "Mortensen 🚀", "Kristian", "Mortensen")).toBe(true);
        // expect(fuzzyMatchNames('Kristian', 'Mortensen, PHD', 'Kristian', 'Mortensen')).toBe(true);
        expect(fuzzyMatchNames("Mortensen", "Kristian", "Kristian", "Mortensen")).toBe(true);
        expect(fuzzyMatchNames("Lars", "Seier", "Lars", "Seier Christensen")).toBe(true);
        expect(fuzzyMatchNames("Ole", "Starr", "Ole", "Van Der Starr")).toBe(true);
        // expect(fuzzyMatchNames("Starr,", "Ole", "Ole", "Van Der Starr")).toBe(true);
        // expect(fuzzyMatchNames("Starr,", "Ole Van Der", "Ole", "Van Der Starr")).toBe(true);
        expect(fuzzyMatchNames("Van Der Starr", "Ole", "Ole", "Van Der Starr")).toBe(true);
        expect(fuzzyMatchNames("foo", "bar", "foo", "bar baz")).toBe(true);
        expect(fuzzyMatchNames("foo", "baz", "foo", "bar baz")).toBe(true);
        expect(fuzzyMatchNames("bar", "baz", "foo", "bar baz")).toBe(true);
        expect(fuzzyMatchNames("foo", "bar baz", "foo", "bar baz")).toBe(true);
        expect(fuzzyMatchNames("Shashi", "Ranjan", "Shashi Ranjan", "Ranjan")).toBe(true);
    });

    test('returns false for invalid fuzzy match', () => {
        expect(fuzzyMatchNames("Kristian", "Von Mortensen", "Kristian", "Mortensen")).toBe(false);
        expect(fuzzyMatchNames("Kristian", "Johnson", "Kristian", "Mortensen")).toBe(false);
        expect(fuzzyMatchNames("Kristiann", "Mortensen", "Kristian", "Mortensen")).toBe(false);
        expect(fuzzyMatchNames("Kristian", "Morten🚀sen", "Kristian", "Mortensen")).toBe(false);
        expect(fuzzyMatchNames("Dr.", "Mortensen", "Kristian", "Mortensen")).toBe(false);
        expect(fuzzyMatchNames("Prof. Hans", "Gersbach John Kennedy", "John", "Kennedy")).toBe(false);
        expect(fuzzyMatchNames("Peter", "", "Peter", "Hansen")).toBe(false);
        expect(fuzzyMatchNames("", "", "foo", "bar baz")).toBe(false);
        expect(fuzzyMatchNames("foo", "", "foo", "bar baz")).toBe(false);
        expect(fuzzyMatchNames("bar", "", "foo", "bar baz")).toBe(false);
        expect(fuzzyMatchNames("baz", "", "foo", "bar baz")).toBe(false);
        expect(fuzzyMatchNames("foo", "foo foo foo", "foo", "bar baz")).toBe(false);
        expect(fuzzyMatchNames("John", "\"Cryptofan\" Johnson", "John", "Johnson")).toBe(false);
    });
});
