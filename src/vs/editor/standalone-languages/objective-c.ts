/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import {ILanguage} from './types';

export var language = <ILanguage> {
	displayName: 'Objective-C',
	name: 'objective-c',
	defaultToken: '',

	lineComment: '//',
	blockCommentStart: '/*',
	blockCommentEnd: '*/',

	keywords: [
		'#import',
		'#include',
		'#define',
		'#else',
		'#endif',
		'#if',
		'#ifdef',
		'#ifndef',
		'#ident',
		'#undef',

		'@class',
		'@defs',
		'@dynamic',
		'@encode',
		'@end',
		'@implementation',
		'@interface',
		'@package',
		'@private',
		'@protected',
		'@property',
		'@protocol',
		'@public',
		'@selector',
		'@synthesize',

<<<<<<< HEAD
		'__declspec',
=======
 		'__declspec',
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d

		'assign',
		'auto',

		'BOOL',
		'break',
		'bycopy',
		'byref',

		'case',
		'char',
		'Class',
		'const',
		'copy',
		'continue',

		'default',
		'do',
		'double',

		'else',
		'enum',
		'extern',

		'FALSE',
		'false',
		'float',
		'for',

		'goto',

		'if',
		'in',
		'int',
		'id',
		'inout',
		'IMP',

		'long',

		'nil',
		'nonatomic',
		'NULL',

		'oneway',
		'out',

		'private',
		'public',
		'protected',

		'readwrite',
		'readonly',
		'register',
		'return',

		'SEL',
		'self',
		'short',
		'signed',
		'sizeof',
		'static',
		'struct',
		'super',
		'switch',

		'typedef',
		'TRUE',
		'true',

		'union',
		'unsigned',

		'volatile',
		'void',

		'while',
	],

	decpart: /\d(_?\d)*/,
	decimal: /0|@decpart/,

	tokenizer: {
	root: [
			{ include: '@comments' },
			{ include: '@whitespace' },
			{ include: '@numbers' },
			{ include: '@strings' },

			[/[,:;]/, 'delimiter'],
			[/[{}\[\]()<>]/, '@brackets'],

			[/[a-zA-Z@#]\w*/, { cases: { '@keywords': 'keyword',
<<<<<<< HEAD
										'@default': 'identifier' } }],
=======
									   '@default': 'identifier' } }],
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d

			[/[<>=\\+\\-\\*\\/\\^\\|\\~,]|and\\b|or\\b|not\\b]/, 'operator'],
	],

	whitespace: [
		[/\s+/, 'white'],
	],

	comments: [
			['\\/\\*','comment','@comment' ],
			['\\/\\/+.*','comment' ],
		],

	comment: [
			['\\*\\/','comment','@pop' ],
			['.', 'comment', ],
		],

	numbers: [
<<<<<<< HEAD
			[/0[xX][0-9a-fA-F]*(_?[0-9a-fA-F])*/, 'number.hex'],
			[/@decimal((\.@decpart)?([eE][\-+]?@decpart)?)[fF]*/, {
				cases: {  	'(\\d)*': 'number',
							'$0':'number.float' }} ]
		],
=======
		    [/0[xX][0-9a-fA-F]*(_?[0-9a-fA-F])*/, 'number.hex'],
			[/@decimal((\.@decpart)?([eE][\-+]?@decpart)?)[fF]*/, {
				cases: {  	'(\\d)*': 'number',
							'$0':'number.float' }} ]
	  	],
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d

	// Recognize strings, including those broken across lines with \ (but not without)
	strings: [
		[/'$/, 'string.escape', '@popall'],
		[/'/, 'string.escape', '@stringBody'],
		[/"$/, 'string.escape', '@popall'],
		[/"/, 'string.escape', '@dblStringBody']
	],
	stringBody: [
		[/\\./, 'string'],
		[/'/, 'string.escape', '@popall'],
		[/.(?=.*')/, 'string'],
		[/.*\\$/, 'string'],
		[/.*$/, 'string', '@popall']
	],
	dblStringBody: [
		[/\\./, 'string'],
		[/"/, 'string.escape', '@popall'],
		[/.(?=.*")/, 'string'],
		[/.*\\$/, 'string'],
		[/.*$/, 'string', '@popall']
	]
	}
};