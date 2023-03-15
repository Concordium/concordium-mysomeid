/*
    The idea is to add some integration tests that will test functionality onchain to avoid
    relying solely on the unit tests.
*/

function add(a: number, b: number) {
    return a + b;
}

test('adds 1 + 2 to equal 3', () => {
    expect(add(1, 2)).toBe(3);
});
