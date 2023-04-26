import * as _ from "lodash";
const {escapeRegExp} = _;

type AllowedSubstitutions = Map<string, string[]>;

export function fuzzyMatchNames(
    a1: string,
    a2: string,
    b1: string,
    b2: string,
    allowedSubstitutions: AllowedSubstitutions = getAllowedSubstitutions()
): {match: boolean, a: boolean, b: boolean} {
    if (a1 === b1 && a2 === b2) {
        return {match: true, a: true, b: true};
    }

    const a1Trimmed = a1.trim();
    const a2Trimmed = a2.trim();
    const b1Trimmed = b1.trim();
    const b2Trimmed = b2.trim();

    const a = `${a1Trimmed} ${a2Trimmed}`.toLowerCase();
    const b = `${b1Trimmed} ${b2Trimmed}`.toLowerCase();

    if (a === b) {
        return {match: true, a: true, b: true};
    }

    const transformable =
        canTransformString(a, b, allowedSubstitutions) ||
        canTransformString(b, a, allowedSubstitutions);

    return {
      match: transformable,
      a: canTransformString(a, b, allowedSubstitutions),
      b: canTransformString(b, a, allowedSubstitutions),      
    };
}

function canTransformString(
    a: string,
    b: string,
    allowedSubstitutions: AllowedSubstitutions
): boolean {
    let aRegexString = "";

    for (const c of a) {
        const cEscaped = escapeRegExp(c);
        const sub = allowedSubstitutions.get(c);

        if (sub) {
            let subExp = "(";
            subExp += cEscaped;

            for (const s of sub) {
                subExp += "|" + escapeRegExp(s);
            }

            subExp += ")";
            aRegexString += subExp;
        } else {
            aRegexString += cEscaped;
        }
    }

    const aRegex = new RegExp(aRegexString);
    return aRegex.test(b);
}

export function getAllowedSubstitutions(): AllowedSubstitutions {
    return new Map([
        ["å", ["aa", "a"]],
        ["æ", ["ae"]],
        ["ø", ["oe", "o"]],
        ["ä", ["ae", "a"]],
        ["ü", ["ue", "u"]],
        ["ö", ["oe", "o"]],
        ["ß", ["ss", "s"]],
        ["ç", ["c"]],
        ["é", ["e"]],
        ["à", ["a"]],
        ["è", ["e"]],
        ["ì", ["i"]],
        ["ò", ["o"]],
        ["ù", ["u"]],
        ["â", ["a"]],
        ["ê", ["e"]],
        ["î", ["i"]],
        ["ô", ["o"]],
        ["û", ["u"]],
        ["ë", ["e"]],
        ["ï", ["i"]],
        ["œ", ["oe"]],
        ["č", ["c"]],
        ["š", ["s"]],
        ["ž", ["z"]],
    ]);
}
