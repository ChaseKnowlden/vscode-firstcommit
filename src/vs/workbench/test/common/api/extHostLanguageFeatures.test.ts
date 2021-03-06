/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import {setUnexpectedErrorHandler, errorHandler} from 'vs/base/common/errors';
import {create} from 'vs/base/common/types';
import URI from 'vs/base/common/uri';
import {URL} from 'vs/base/common/network';
import {TPromise} from 'vs/base/common/winjs.base';
import {PluginHostDocument} from 'vs/workbench/api/common/pluginHostDocuments';
import * as types from 'vs/workbench/api/common/pluginHostTypes';
import {Range as CodeEditorRange} from 'vs/editor/common/core/range';
import * as EditorCommon from 'vs/editor/common/editorCommon';
import {Model as EditorModel} from 'vs/editor/common/model/model';
import threadService from './testThreadService'
import {create as createInstantiationService} from 'vs/platform/instantiation/common/instantiationService';
import {MarkerService} from 'vs/platform/markers/common/markerService';
import {IMarkerService} from 'vs/platform/markers/common/markers';
import {IThreadService} from 'vs/platform/thread/common/thread';
import {ExtHostLanguageFeatures, MainThreadLanguageFeatures} from 'vs/workbench/api/common/extHostLanguageFeatures';
import {PluginHostCommands, MainThreadCommands} from 'vs/workbench/api/common/pluginHostCommands';
import {PluginHostModelService} from 'vs/workbench/api/common/pluginHostDocuments';
import {SyncDescriptor0} from 'vs/platform/instantiation/common/descriptors';
import {LanguageSelector, ModelLike} from 'vs/editor/common/modes/languageSelector';
import {OutlineRegistry, getOutlineEntries} from 'vs/editor/contrib/quickOpen/common/quickOpen';
import {CodeLensRegistry, getCodeLensData} from 'vs/editor/contrib/codelens/common/codelens';
import {DeclarationRegistry, getDeclarationsAtPosition} from 'vs/editor/contrib/goToDeclaration/common/goToDeclaration';
import {ExtraInfoRegistry, getExtraInfoAtPosition} from 'vs/editor/contrib/hover/common/hover';
import {OccurrencesRegistry, getOccurrencesAtPosition} from 'vs/editor/contrib/wordHighlighter/common/wordHighlighter';
import {ReferenceRegistry, findReferences} from 'vs/editor/contrib/referenceSearch/common/referenceSearch';
import {getQuickFixes} from 'vs/editor/contrib/quickFix/common/quickFix';
import {getNavigateToItems} from 'vs/workbench/parts/search/common/search';
import {getParameterHints} from 'vs/editor/contrib/parameterHints/common/parameterHints';

const defaultSelector = { scheme: 'far' };
const model: EditorCommon.IModel = new EditorModel(
	[
		'This is the first line',
		'This is the second line',
		'This is the third line',
	].join('\n'),
	undefined,
	URL.fromUri(URI.parse('far://testing/file.a')));

let extHost: ExtHostLanguageFeatures;
let mainThread: MainThreadLanguageFeatures;
let disposables: vscode.Disposable[] = [];
let originalErrorHandler: (e: any) => any;

suite('ExtHostLanguageFeatures', function() {

	suiteSetup(() => {

		let instantiationService = createInstantiationService();
		threadService.setInstantiationService(instantiationService);
		instantiationService.addSingleton(IMarkerService, new MarkerService(threadService));
		instantiationService.addSingleton(IThreadService, threadService);

		originalErrorHandler = errorHandler.getUnexpectedErrorHandler();
		setUnexpectedErrorHandler(() => { });

		threadService.getRemotable(PluginHostModelService)._acceptModelAdd({
			isDirty: false,
			versionId: model.getVersionId(),
			modeId: model.getModeId(),
			url: model.getAssociatedResource(),
			value: {
				EOL: model.getEOL(),
				lines: model.getValue().split(model.getEOL()),
				BOM: '',
				length: -1
			},
		});

		threadService.getRemotable(PluginHostCommands);
		threadService.getRemotable(MainThreadCommands);
		mainThread = threadService.getRemotable(MainThreadLanguageFeatures);
		extHost = threadService.getRemotable(ExtHostLanguageFeatures);
	});

	suiteTeardown(() => {
		setUnexpectedErrorHandler(originalErrorHandler);
	});

	teardown(function(done) {
		while (disposables.length) {
			disposables.pop().dispose();
		}
		threadService.sync()
			.then(() => done(), err => done(err));
	});

	// --- outline

	test('DocumentSymbols, register/deregister', function(done) {
		assert.equal(OutlineRegistry.all(model).length, 0);
		let d1 = extHost.registerDocumentSymbolProvider(defaultSelector, <vscode.DocumentSymbolProvider>{
			provideDocumentSymbols() {
				return [];
			}
		});

		threadService.sync().then(() => {
			assert.equal(OutlineRegistry.all(model).length, 1);
			d1.dispose();
			threadService.sync().then(() => {
				done();
			});
		});

	});

	test('DocumentSymbols, evil provider', function(done) {
		disposables.push(extHost.registerDocumentSymbolProvider(defaultSelector, <vscode.DocumentSymbolProvider>{
			provideDocumentSymbols(): any {
				throw new Error('evil document symbol provider');
			}
		}));
		disposables.push(extHost.registerDocumentSymbolProvider(defaultSelector, <vscode.DocumentSymbolProvider>{
			provideDocumentSymbols(): any {
				return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
			}
		}));

		threadService.sync().then(() => {

			getOutlineEntries(model).then(value => {
				assert.equal(value.entries.length, 1);
				done();
			}, err => {
				done(err);
			});
		});
	});

	test('DocumentSymbols, data conversion', function(done) {
		disposables.push(extHost.registerDocumentSymbolProvider(defaultSelector, <vscode.DocumentSymbolProvider>{
			provideDocumentSymbols(): any {
				return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
			}
		}));

		threadService.sync().then(() => {

			getOutlineEntries(model).then(value => {
				assert.equal(value.entries.length, 1);

				let entry = value.entries[0];
				assert.equal(entry.label, 'test');
				assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
				done();

			}, err => {
				done(err);
			});
		});
	});

	// --- code lens

	test('CodeLens, evil provider', function(done) {

		disposables.push(extHost.registerCodeLensProvider(defaultSelector, <vscode.CodeLensProvider>{
			provideCodeLenses():any {
				throw new Error('evil')
			}
		}));
		disposables.push(extHost.registerCodeLensProvider(defaultSelector, <vscode.CodeLensProvider>{
			provideCodeLenses() {
				return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
			}
		}));

		threadService.sync().then(() => {
			getCodeLensData(model).then(value => {
				assert.equal(value.length, 1);
				done();
			});
		});
	});

	test('CodeLens, do not resolve a resolved lens', function(done) {

		disposables.push(extHost.registerCodeLensProvider(defaultSelector, <vscode.CodeLensProvider>{
			provideCodeLenses():any {
				return [new types.CodeLens(
					new types.Range(0, 0, 0, 0),
					{ command: 'id', title: 'Title' })];
			},
			resolveCodeLens():any {
				assert.ok(false, 'do not resolve');
			}
		}));

		threadService.sync().then(() => {

			getCodeLensData(model).then(value => {
				assert.equal(value.length, 1);
				let data = value[0];

				data.support.resolveCodeLensSymbol(model.getAssociatedResource(), data.symbol).then(command => {
					assert.equal(command.id, 'id');
					assert.equal(command.title, 'Title');
					done();
				});
			});
		});
	});

	test('CodeLens, missing command', function(done) {

		disposables.push(extHost.registerCodeLensProvider(defaultSelector, <vscode.CodeLensProvider>{
			provideCodeLenses() {
				return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
			}
		}));

		threadService.sync().then(() => {

			getCodeLensData(model).then(value => {
				assert.equal(value.length, 1);

				let data = value[0];
				data.support.resolveCodeLensSymbol(model.getAssociatedResource(), data.symbol).then(command => {

					assert.equal(command.id, 'missing');
					assert.equal(command.title, '<<MISSING COMMAND>>');
					done();
				});
			});
		});
	});

	// --- definition

	test('Definition, data conversion', function(done) {

		disposables.push(extHost.registerDefinitionProvider(defaultSelector, <vscode.DefinitionProvider>{
			provideDefinition(): any {
				return [new types.Location(model.getAssociatedResource(), new types.Range(1, 2, 3, 4))];
			}
		}));

		threadService.sync().then(() => {

			getDeclarationsAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {
				assert.equal(value.length, 1);
				let [entry] = value;
				assert.deepEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
				assert.equal(entry.resource.toString(), model.getAssociatedResource().toString());
				done();
			}, err => {
				done(err);
			});
		});
	});

	test('Definition, one or many', function(done) {

		disposables.push(extHost.registerDefinitionProvider(defaultSelector, <vscode.DefinitionProvider>{
			provideDefinition(): any {
				return [new types.Location(model.getAssociatedResource(), new types.Range(1, 1, 1, 1))];
			}
		}));
		disposables.push(extHost.registerDefinitionProvider(defaultSelector, <vscode.DefinitionProvider>{
			provideDefinition(): any {
				return new types.Location(model.getAssociatedResource(), new types.Range(1, 1, 1, 1));
			}
		}));

		threadService.sync().then(() => {

			getDeclarationsAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {
				assert.equal(value.length, 2);
				done();
			}, err => {
				done(err);
			});
		});
	});

	test('Definition, registration order', function(done) {

		disposables.push(extHost.registerDefinitionProvider(defaultSelector, <vscode.DefinitionProvider>{
			provideDefinition(): any {
				return [new types.Location(URI.parse('far://first'), new types.Range(2, 3, 4, 5))];
			}
		}));

		setTimeout(function() { // registration time matters
			disposables.push(extHost.registerDefinitionProvider(defaultSelector, <vscode.DefinitionProvider>{
				provideDefinition(): any {
					return new types.Location(URI.parse('far://second'), new types.Range(1, 2, 3, 4));
				}
			}));

			threadService.sync().then(() => {

				getDeclarationsAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {
					assert.equal(value.length, 2);
					// let [first, second] = value;

					assert.equal(value[0].resource.authority, 'second');
					assert.equal(value[1].resource.authority, 'first');
					done();

				}, err => {
					done(err);
				});
			});
		}, 5);
	});

	test('Definition, evil provider', function(done) {

		disposables.push(extHost.registerDefinitionProvider(defaultSelector, <vscode.DefinitionProvider>{
			provideDefinition(): any {
				throw new Error('evil provider')
			}
		}));
		disposables.push(extHost.registerDefinitionProvider(defaultSelector, <vscode.DefinitionProvider>{
			provideDefinition(): any {
				return new types.Location(model.getAssociatedResource(), new types.Range(1, 1, 1, 1));
			}
		}));

		threadService.sync().then(() => {

			getDeclarationsAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {
				assert.equal(value.length, 1);
				done();
			}, err => {
				done(err);
			});
		});
	});

	// --- extra info

	test('ExtraInfo, word range at pos', function(done) {

		disposables.push(extHost.registerHoverProvider(defaultSelector, <vscode.HoverProvider>{
			provideHover(): any {
				return new types.Hover('Hello')
			}
		}));

		threadService.sync().then(() => {

			getExtraInfoAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {

				assert.equal(value.length, 1);
				let [entry] = value;
				assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
				done();
			});
		});
	});

	test('ExtraInfo, given range', function(done) {

		disposables.push(extHost.registerHoverProvider(defaultSelector, <vscode.HoverProvider>{
			provideHover(): any {
				return new types.Hover('Hello', new types.Range(3, 0, 8, 7));
			}
		}));

		threadService.sync().then(() => {

			getExtraInfoAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {
				assert.equal(value.length, 1);
				let [entry] = value;
				assert.deepEqual(entry.range, { startLineNumber: 4, startColumn: 1, endLineNumber: 9, endColumn: 8 });
				done();
			});
		});
	});

	test('ExtraInfo, registration order', function(done) {

		disposables.push(extHost.registerHoverProvider(defaultSelector, <vscode.HoverProvider>{
			provideHover(): any {
				return new types.Hover('registered first');
			}
		}));

		setTimeout(function() {
			disposables.push(extHost.registerHoverProvider(defaultSelector, <vscode.HoverProvider>{
				provideHover(): any {
					return new types.Hover('registered second');
				}
			}));

			threadService.sync().then(() => {

				getExtraInfoAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {
					assert.equal(value.length, 2);
					let [first, second] = value;
					assert.equal(first.htmlContent[0].formattedText, 'registered second');
					assert.equal(second.htmlContent[0].formattedText, 'registered first');
					done();
				});
			});

		}, 5);

	});

	test('ExtraInfo, evil provider', function(done) {

		disposables.push(extHost.registerHoverProvider(defaultSelector, <vscode.HoverProvider>{
			provideHover(): any {
				throw new Error('evil')
			}
		}));
		disposables.push(extHost.registerHoverProvider(defaultSelector, <vscode.HoverProvider>{
			provideHover(): any {
				return new types.Hover('Hello')
			}
		}));

		threadService.sync().then(() => {

			getExtraInfoAtPosition(model, { lineNumber: 1, column: 1 }).then(value => {

				assert.equal(value.length, 1);
				done();
			});
		});
	});

	// --- occurrences

	test('Occurrences, data conversion', function(done) {

		disposables.push(extHost.registerDocumentHighlightProvider(defaultSelector, <vscode.DocumentHighlightProvider>{
			provideDocumentHighlights(): any {
				return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))]
			}
		}));

		threadService.sync().then(() => {

			getOccurrencesAtPosition(model, { lineNumber: 1, column: 2 }).then(value => {
				assert.equal(value.length, 1);
				let [entry] = value;
				assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
				assert.equal(entry.kind, 'text');
				done();
			});
		});
	});

	test('Occurrences, order 1/2', function(done) {

		disposables.push(extHost.registerDocumentHighlightProvider(defaultSelector, <vscode.DocumentHighlightProvider>{
			provideDocumentHighlights(): any {
				return []
			}
		}));
		disposables.push(extHost.registerDocumentHighlightProvider('*', <vscode.DocumentHighlightProvider>{
			provideDocumentHighlights(): any {
				return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))]
			}
		}));

		threadService.sync().then(() => {

			getOccurrencesAtPosition(model, { lineNumber: 1, column: 2 }).then(value => {
				assert.equal(value.length, 1);
				let [entry] = value;
				assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
				assert.equal(entry.kind, 'text');
				done();
			});
		});
	});

	test('Occurrences, order 2/2', function(done) {

		disposables.push(extHost.registerDocumentHighlightProvider(defaultSelector, <vscode.DocumentHighlightProvider>{
			provideDocumentHighlights(): any {
				return [new types.DocumentHighlight(new types.Range(0, 0, 0, 2))]
			}
		}));
		disposables.push(extHost.registerDocumentHighlightProvider('*', <vscode.DocumentHighlightProvider>{
			provideDocumentHighlights(): any {
				return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))]
			}
		}));

		threadService.sync().then(() => {

			getOccurrencesAtPosition(model, { lineNumber: 1, column: 2 }).then(value => {
				assert.equal(value.length, 1);
				let [entry] = value;
				assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 3 });
				assert.equal(entry.kind, 'text');
				done();
			});
		});
	});

	test('Occurrences, evil provider', function(done) {

		disposables.push(extHost.registerDocumentHighlightProvider(defaultSelector, <vscode.DocumentHighlightProvider>{
			provideDocumentHighlights(): any {
				throw new Error('evil');
			}
		}));

		disposables.push(extHost.registerDocumentHighlightProvider(defaultSelector, <vscode.DocumentHighlightProvider>{
			provideDocumentHighlights(): any {
				return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))]
			}
		}));

		threadService.sync().then(() => {

			getOccurrencesAtPosition(model, { lineNumber: 1, column: 2 }).then(value => {
				assert.equal(value.length, 1);
				done();
			});
		});
	});

	// --- references

	test('References, registration order', function(done) {

		disposables.push(extHost.registerReferenceProvider(defaultSelector, <vscode.ReferenceProvider>{
			provideReferences(): any {
				return [new types.Location(URI.parse('far://register/first'), new types.Range(0, 0, 0, 0))];
			}
		}));

		setTimeout(function() {
			disposables.push(extHost.registerReferenceProvider(defaultSelector, <vscode.ReferenceProvider>{
				provideReferences(): any {
					return [new types.Location(URI.parse('far://register/second'), new types.Range(0, 0, 0, 0))];
				}
			}));

			threadService.sync().then(() => {

				findReferences(model, { lineNumber: 1, column: 2 }).then(value => {
					assert.equal(value.length, 2);

					let [first, second] = value;
					assert.equal(first.resource.path, '/second');
					assert.equal(second.resource.path, '/first');
					done();
				});
			});
		}, 5);
	});

	test('References, data conversion', function(done) {

		disposables.push(extHost.registerReferenceProvider(defaultSelector, <vscode.ReferenceProvider>{
			provideReferences(): any {
				return [new types.Location(model.getAssociatedResource(), new types.Position(0, 0))];
			}
		}));

		threadService.sync().then(() => {

			findReferences(model, { lineNumber: 1, column: 2 }).then(value => {
				assert.equal(value.length, 1);

				let [item] = value;
				assert.deepEqual(item.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
				assert.equal(item.resource.toString(), model.getAssociatedResource().toString());
				done();
			});

		});
	});

	test('References, evil provider', function(done) {

		disposables.push(extHost.registerReferenceProvider(defaultSelector, <vscode.ReferenceProvider>{
			provideReferences(): any {
				throw new Error('evil');
			}
		}));
		disposables.push(extHost.registerReferenceProvider(defaultSelector, <vscode.ReferenceProvider>{
			provideReferences(): any {
				return [new types.Location(model.getAssociatedResource(), new types.Range(0, 0, 0, 0))];
			}
		}));

		threadService.sync().then(() => {

			findReferences(model, { lineNumber: 1, column: 2 }).then(value => {
				assert.equal(value.length, 1);
				done();
			});

		});
	});

	// --- quick fix

	test('Quick Fix, data conversion', function(done) {

		disposables.push(extHost.registerCodeActionProvider(defaultSelector, <vscode.CodeActionProvider>{
			provideCodeActions(): any {
				return [
					<vscode.Command>{ command: 'test', title: 'Testing1' },
					<vscode.Command>{ command: 'test', title: 'Testing2' }
				];
			}
		}));

		threadService.sync().then(() => {
			getQuickFixes(model, model.getFullModelRange()).then(value => {
				assert.equal(value.length, 2);

				let [first, second] = value;
				assert.equal(first.label, 'Testing1');
				assert.equal(first.id, String(0));
				assert.equal(second.label, 'Testing2');
				assert.equal(second.id, String(1));
				done();
			});
		});
	});

	test('Quick Fix, invoke command+args', function(done) {
		let actualArgs: any;
		let commands = threadService.getRemotable(PluginHostCommands);
		disposables.push(commands.registerCommand('test1', function(...args: any[]) {
			actualArgs = args;
		}));

		disposables.push(extHost.registerCodeActionProvider(defaultSelector, <vscode.CodeActionProvider>{
			provideCodeActions(): any {
				return [<vscode.Command>{ command: 'test1', title: 'Testing', arguments: [true, 1, { bar: 'boo', foo: 'far' }, null] }];
			}
		}));

		threadService.sync().then(() => {
			getQuickFixes(model, model.getFullModelRange()).then(value => {
				assert.equal(value.length, 1);

				let [entry] = value;
				entry.support.runQuickFixAction(model.getAssociatedResource(), model.getFullModelRange(), entry.id).then(value => {
					assert.equal(value, undefined);

					assert.equal(actualArgs.length, 4);
					assert.equal(actualArgs[0], true)
					assert.equal(actualArgs[1], 1)
					assert.deepEqual(actualArgs[2], { bar: 'boo', foo: 'far' });
					assert.equal(actualArgs[3], null)
					done();
				});
			});
		});
	});

	test('Quick Fix, evil provider', function(done) {

		disposables.push(extHost.registerCodeActionProvider(defaultSelector, <vscode.CodeActionProvider>{
			provideCodeActions(): any {
				throw new Error('evil');
			}
		}));
		disposables.push(extHost.registerCodeActionProvider(defaultSelector, <vscode.CodeActionProvider>{
			provideCodeActions(): any {
				return [<vscode.Command>{ command: 'test', title: 'Testing' }];
			}
		}));

		threadService.sync().then(() => {
			getQuickFixes(model, model.getFullModelRange()).then(value => {
				assert.equal(value.length, 1);
				done();
			});
		});
	});

	// --- navigate types

	test('Navigate types, evil provider', function(done) {

		disposables.push(extHost.registerWorkspaceSymbolProvider(<vscode.WorkspaceSymbolProvider>{
			provideWorkspaceSymbols(): any {
				throw new Error('evil');
			}
		}));

		disposables.push(extHost.registerWorkspaceSymbolProvider(<vscode.WorkspaceSymbolProvider>{
			provideWorkspaceSymbols(): any {
				return [new types.SymbolInformation('testing', types.SymbolKind.Array, new types.Range(0, 0, 1, 1))]
			}
		}));

		threadService.sync().then(() => {

			getNavigateToItems('').then(value => {
				assert.equal(value.length, 1);
				done();
			});
		});
	});

	// --- parameter hints

	test('Parameter Hints, evil provider', function(done) {

		disposables.push(extHost.registerSignatureHelpProvider(defaultSelector, <vscode.SignatureHelpProvider>{
			provideSignatureHelp(): any {
				throw new Error('evil');
			}
		}, []));

		threadService.sync().then(() => {

			getParameterHints(model, { lineNumber: 1, column: 1 }, '(').then(value => {
				done(new Error('error expeted'));
			}, err => {
				assert.equal(err.message, 'evil');
				done();
			})
		});
	})
});