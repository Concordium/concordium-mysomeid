import {emojis} from './emojis';

const titles = [
	'Mr',
	'Mrs',
	'Miss',
	'Ms',
	'Dr',
	'PhD',
	'MD',
	'DDS',
	'DVM',
	'DO',
	'Prof',
	'Rev',
	'Hon',
	'Capt',
	'Col',
	'Major',
	'Sir',
	'Madam',
	'M.D.',
	'Medical',
	'Doctor',
	'D.O.',
	'MBBS',
];



const emojiPattern = emojis.map(emoji => emoji.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')).join('|');
const regexPattern = new RegExp(emojiPattern, 'gu');

const removeEmojis = (s: string): string => s.replace(regexPattern, '');

const titleFilter = (x: string) => titles.findIndex(y => y.toLowerCase() === x.toLowerCase()) === -1;

export const stripTitlesAndEmojisFromName = (name: string): string => 
	removeEmojis(name)
		.split(/[ ,]+/)
		.filter(titleFilter)
		.join(' ')
		.split(/[ .]+/)
		.filter(titleFilter)
		.filter(x => !!x.trim())
		.join(' ');
