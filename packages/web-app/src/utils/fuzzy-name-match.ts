import * as _ from "lodash";
const {escapeRegExp} = _;

type AllowedSubstitutions = Map<string, string[]>;

export function fuzzyMatchNames(
    aFirstName: string,
    aSurname: string,
    bFirstName: string,
    bSurname: string,
    allowedSubstitutions: AllowedSubstitutions = getAllowedSubstitutions()
): {match: boolean, a: boolean, b: boolean, firstNameMatch: boolean, lastNameMatch: boolean} {
    let firstNameMatch = true; // nameMatch;
    let lastNameMatch = true; // nameMatch;

    if (aFirstName === bFirstName && aSurname === bSurname) {
        return {match: true, a: true, b: true, firstNameMatch, lastNameMatch};
    }

    const aFirstNameTrimmed = aFirstName.trim();
    const aSurNameTrimmed = aSurname.trim();
    const bFirstnameTrimmed = bFirstName.trim();
    const bSurnameTrimmed = bSurname.trim();

    const a = `${aFirstNameTrimmed} ${aSurNameTrimmed}`.toLowerCase();
    const b = `${bFirstnameTrimmed} ${bSurnameTrimmed}`.toLowerCase();

    firstNameMatch = canTransformString(aFirstNameTrimmed.toLowerCase(), bFirstnameTrimmed.toLowerCase(), allowedSubstitutions) || 
                        canTransformString(bFirstnameTrimmed.toLowerCase(), aFirstNameTrimmed.toLowerCase(), allowedSubstitutions);
    lastNameMatch = canTransformString(aSurNameTrimmed.toLowerCase(), bSurnameTrimmed.toLowerCase(), allowedSubstitutions) || 
                        canTransformString(bSurnameTrimmed.toLowerCase(), aSurNameTrimmed.toLowerCase(), allowedSubstitutions);

    if (a === b) {
        return {match: true, a: true, b: true, firstNameMatch, lastNameMatch};
    }

    const transformable =
        canTransformString(a, b, allowedSubstitutions) ||
        canTransformString(b, a, allowedSubstitutions);

    return {
      match: transformable,
      a: canTransformString(a, b, allowedSubstitutions),
      b: canTransformString(b, a, allowedSubstitutions),
      firstNameMatch,
      lastNameMatch,
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
