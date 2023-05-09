import * as _ from "lodash";
const {escapeRegExp} = _;

type AllowedSubstitutions = Map<string, string[]>;

export function fuzzyMatchNames(
    aFirstName: string,
    aSurname: string,
    bFirstName: string,
    bSurname: string,
    allowedSubstitutions: AllowedSubstitutions = getAllowedSubstitutions()
): {fullNameMatch: boolean, firstNameMatch: boolean, lastNameMatch: boolean} {
    if (aFirstName === bFirstName && aSurname === bSurname) {
        return {fullNameMatch: true, firstNameMatch: true, lastNameMatch: true};
    }

    const aFirstNameTrimmed = aFirstName.trim();
    const aSurNameTrimmed = aSurname.trim();
    const bFirstnameTrimmed = bFirstName.trim();
    const bSurnameTrimmed = bSurname.trim();

    const aFullname = `${aFirstNameTrimmed} ${aSurNameTrimmed}`.toLowerCase();
    const bFullname = `${bFirstnameTrimmed} ${bSurnameTrimmed}`.toLowerCase();

    const firstNameMatch = canTransformString(aFirstNameTrimmed.toLowerCase(), bFirstnameTrimmed.toLowerCase(), allowedSubstitutions) || 
                        canTransformString(bFirstnameTrimmed.toLowerCase(), aFirstNameTrimmed.toLowerCase(), allowedSubstitutions);
    const lastNameMatch = canTransformString(aSurNameTrimmed.toLowerCase(), bSurnameTrimmed.toLowerCase(), allowedSubstitutions) || 
                        canTransformString(bSurnameTrimmed.toLowerCase(), aSurNameTrimmed.toLowerCase(), allowedSubstitutions);

    if (aFullname === bFullname) {
        return {fullNameMatch: true, firstNameMatch, lastNameMatch};
    }

    const fullNameMatch =
        canTransformString(aFullname, bFullname, allowedSubstitutions) ||
        canTransformString(bFullname, aFullname, allowedSubstitutions);

    return {
      fullNameMatch,
      firstNameMatch,
      lastNameMatch,
    };
}

function canTransformString(
    a: string,
    b: string,
    allowedSubstitutions: AllowedSubstitutions
): boolean {
    let aRegexString = "^";

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
    aRegexString += "$";

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
