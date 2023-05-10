import * as _ from "lodash";
const { escapeRegExp } = _;

type AllowedSubstitutions = Map<string, string[]>;

export function fuzzyMatchNames(
    aFirstName: string,
    aSurname: string,
    bFirstName: string,
    bSurname: string,
    allowedSubstitutions: AllowedSubstitutions = getAllowedSubstitutions()
): boolean {
    const aFirstNameTrimmed = aFirstName.trim();
    const aSurNameTrimmed = aSurname.trim();
    const bFirstnameTrimmed = bFirstName.trim();
    const bSurnameTrimmed = bSurname.trim();

    const aFullname = `${aFirstNameTrimmed} ${aSurNameTrimmed}`.toLowerCase();
    const bFullname = `${bFirstnameTrimmed} ${bSurnameTrimmed}`.toLowerCase();

    if (aFullname === bFullname && aFullname.split(' ').length >= 2) {
        return true;
    }

    return findInclusion(aFullname, bFullname, allowedSubstitutions);
}

function findInclusion(a: string, b: string, allowedSubstitutions: AllowedSubstitutions): boolean {
    let wa = a.split(' ');
    let words = new Map<string, number>();
    for (let word of b.split(' ')) {
        if (word.trim() !== '') {
            let entry = words.get(word) || 0;
            words.set(word, entry + 1);
        }
    }
    if (words.size > 50) {
        return false;
    }
    let count = 0;
    for (let aWord of wa) {
        if (count > 50) {
            return false;
        }
        if (aWord.trim() !== '') {
            count += 1;
            let found = false;
            for (let [bWord, mult] of words.entries()) {
                if (canTransformString(aWord, bWord, allowedSubstitutions) && mult > 0) {
                    words.set(bWord, mult - 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
    }
    return count >= 2;
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
