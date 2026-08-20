/*
	Unit tests for Pict-Section-MarkdownEditor
*/

const libBrowserEnv = require('browser-env');
libBrowserEnv();

const Chai = require('chai');
const Expect = Chai.expect;

const libPict = require('pict');

const configureTestPict = (pPict) =>
{
	let tmpPict = (typeof (pPict) == 'undefined') ? new libPict() : pPict;
	tmpPict.TestData = (
		{
			Reads: [],
			Assignments: [],
			Appends: [],
			Gets: []
		});
	tmpPict.ContentAssignment.customReadFunction = (pAddress, pContentType) =>
	{
		tmpPict.TestData.Reads.push(pAddress);
		tmpPict.log.info(`Mocking a read of type ${pContentType} from Address: ${pAddress}`);
		return '';
	};
	tmpPict.ContentAssignment.customGetElementFunction = (pAddress) =>
	{
		tmpPict.TestData.Gets.push(pAddress);
		tmpPict.log.info(`Mocking a get of Address: ${pAddress}`);
		return '';
	};
	tmpPict.ContentAssignment.customAppendElementFunction = (pAddress, pContent) =>
	{
		tmpPict.TestData.Appends.push(pAddress);
		tmpPict.log.info(`Mocking an append of Address: ${pAddress}`, { Content: pContent });
		return '';
	};
	tmpPict.ContentAssignment.customAssignFunction = (pAddress, pContent) =>
	{
		tmpPict.TestData.Assignments.push(pAddress);
		tmpPict.log.info(`Mocking an assignment of Address: ${pAddress}`, { Content: pContent });
		return '';
	};

	return tmpPict;
};

const libPictSectionMarkdownEditor = require('../source/Pict-Section-MarkdownEditor.js');

suite
(
	'PictSectionMarkdownEditor',
	() =>
	{
		setup(() => { });

		suite
		(
			'Module Exports',
			() =>
			{
				test
				(
					'Main class should be exported',
					(fDone) =>
					{
						Expect(libPictSectionMarkdownEditor).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'Default configuration should be exported',
					(fDone) =>
					{
						Expect(libPictSectionMarkdownEditor.default_configuration).to.be.an('object');
						Expect(libPictSectionMarkdownEditor.default_configuration).to.have.property('DefaultRenderable');
						Expect(libPictSectionMarkdownEditor.default_configuration).to.have.property('TargetElementAddress');
						Expect(libPictSectionMarkdownEditor.default_configuration).to.have.property('CSS');
						Expect(libPictSectionMarkdownEditor.default_configuration).to.have.property('ContentDataAddress');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Basic Initialization',
			() =>
			{
				test
				(
					'Should create a view instance with default options',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE', {}, libPictSectionMarkdownEditor);
						Expect(tmpView).to.be.an('object');
						Expect(tmpView._segmentEditors).to.be.an('object');
						Expect(tmpView._segmentCounter).to.equal(0);
						Expect(tmpView.initialRenderComplete).to.equal(false);
						return fDone();
					}
				);
				test
				(
					'Should create a view instance with custom content data address',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestMDE-Address',
							{
								ContentDataAddress: 'AppData.Document.Segments'
							},
							libPictSectionMarkdownEditor
						);
						Expect(tmpView).to.be.an('object');
						Expect(tmpView.options.ContentDataAddress).to.equal('AppData.Document.Segments');
						return fDone();
					}
				);
				test
				(
					'Should create a view instance with read-only option',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestMDE-ReadOnly',
							{
								ReadOnly: true
							},
							libPictSectionMarkdownEditor
						);
						Expect(tmpView).to.be.an('object');
						Expect(tmpView.options.ReadOnly).to.equal(true);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'CodeMirror Module Connection',
			() =>
			{
				test
				(
					'connectCodeMirrorModules should accept valid modules',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CM', {}, libPictSectionMarkdownEditor);

						// Mock CodeMirror modules
						let tmpMockModules =
						{
							EditorView: function() {},
							EditorState: function() {},
							extensions: []
						};

						tmpView.connectCodeMirrorModules(tmpMockModules);
						Expect(tmpView._codeMirrorModules).to.equal(tmpMockModules);
						return fDone();
					}
				);
				test
				(
					'connectCodeMirrorModules should reject invalid modules',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CM2', {}, libPictSectionMarkdownEditor);

						let tmpResult = tmpView.connectCodeMirrorModules({ foo: 'bar' });
						Expect(tmpResult).to.equal(false);
						Expect(tmpView._codeMirrorModules).to.equal(null);
						return fDone();
					}
				);
				test
				(
					'connectCodeMirrorModules should reject non-object input',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CM3', {}, libPictSectionMarkdownEditor);

						let tmpResult = tmpView.connectCodeMirrorModules('not an object');
						Expect(tmpResult).to.equal(false);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Public API (pre-initialization)',
			() =>
			{
				test
				(
					'getSegmentCount should return 0 before initialization',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-API1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.getSegmentCount()).to.equal(0);
						return fDone();
					}
				);
				test
				(
					'getAllContent should return empty string before initialization',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-API2', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.getAllContent()).to.equal('');
						return fDone();
					}
				);
				test
				(
					'getSegmentContent should return empty string for out-of-range index',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-API3', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.getSegmentContent(0)).to.equal('');
						Expect(tmpView.getSegmentContent(-1)).to.equal('');
						return fDone();
					}
				);
				test
				(
					'destroy should not throw before initialization',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Destroy', {}, libPictSectionMarkdownEditor);
						tmpView.destroy();
						Expect(Object.keys(tmpView._segmentEditors).length).to.equal(0);
						return fDone();
					}
				);
				test
				(
					'setReadOnly should update the option',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RO', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.options.ReadOnly).to.equal(false);
						tmpView.setReadOnly(true);
						Expect(tmpView.options.ReadOnly).to.equal(true);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Data Management',
			() =>
			{
				test
				(
					'Should read segments from configured data address',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						tmpPict.AppData.Document = {
							Segments: [
								{ Content: '# Hello' },
								{ Content: 'World' }
							]
						};
						let tmpView = tmpPict.addView(
							'Pict-View-TestMDE-Data1',
							{ ContentDataAddress: 'AppData.Document.Segments' },
							libPictSectionMarkdownEditor
						);

						let tmpSegments = tmpView._getSegmentsFromData();
						Expect(tmpSegments).to.be.an('array');
						Expect(tmpSegments.length).to.equal(2);
						Expect(tmpSegments[0].Content).to.equal('# Hello');
						Expect(tmpSegments[1].Content).to.equal('World');
						return fDone();
					}
				);
				test
				(
					'Should return null when no data address is configured',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestMDE-Data2',
							{},
							libPictSectionMarkdownEditor
						);

						let tmpSegments = tmpView._getSegmentsFromData();
						Expect(tmpSegments).to.equal(null);
						return fDone();
					}
				);
				test
				(
					'Should write segments to configured data address',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						tmpPict.AppData.Document = {};
						let tmpView = tmpPict.addView(
							'Pict-View-TestMDE-Data3',
							{ ContentDataAddress: 'AppData.Document.Segments' },
							libPictSectionMarkdownEditor
						);

						let tmpNewSegments = [{ Content: 'Test content' }];
						tmpView._setSegmentsToData(tmpNewSegments);

						Expect(tmpPict.AppData.Document.Segments).to.be.an('array');
						Expect(tmpPict.AppData.Document.Segments.length).to.equal(1);
						Expect(tmpPict.AppData.Document.Segments[0].Content).to.equal('Test content');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Template Configuration',
			() =>
			{
				test
				(
					'Should have required templates in default configuration',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpTemplates = tmpConfig.Templates;
						Expect(tmpTemplates).to.be.an('array');

						let tmpTemplateHashes = tmpTemplates.map((t) => t.Hash);
						Expect(tmpTemplateHashes).to.include('MarkdownEditor-Container');
						Expect(tmpTemplateHashes).to.include('MarkdownEditor-Segment');
						Expect(tmpTemplateHashes).to.include('MarkdownEditor-AddSegment');
						return fDone();
					}
				);
				test
				(
					'Should have renderables in default configuration',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.Renderables).to.be.an('array');
						Expect(tmpConfig.Renderables.length).to.be.greaterThan(0);
						Expect(tmpConfig.Renderables[0].RenderableHash).to.equal('MarkdownEditor-Wrap');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Hook Methods',
			() =>
			{
				test
				(
					'customConfigureExtensions should return extensions unchanged by default',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Hooks1', {}, libPictSectionMarkdownEditor);

						let tmpExtensions = ['ext1', 'ext2'];
						let tmpResult = tmpView.customConfigureExtensions(tmpExtensions, 0);
						Expect(tmpResult).to.deep.equal(['ext1', 'ext2']);
						return fDone();
					}
				);
				test
				(
					'onContentChange should be callable without error',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Hooks2', {}, libPictSectionMarkdownEditor);

						// Should not throw
						tmpView.onContentChange(0, 'test content');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Active Segment Management',
			() =>
			{
				test
				(
					'Should initialize with no active segment',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Active1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._activeSegmentIndex).to.equal(-1);
						return fDone();
					}
				);
				test
				(
					'Should initialize with drag source at -1',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Active2', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._dragSourceIndex).to.equal(-1);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Formatting',
			() =>
			{
				test
				(
					'applyFormatting should not throw without editor',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Fmt1', {}, libPictSectionMarkdownEditor);
						// Should not throw; just warns
						tmpView.applyFormatting(99, 'bold');
						return fDone();
					}
				);
				test
				(
					'applyFormatting should not throw for unknown format type',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Fmt2', {}, libPictSectionMarkdownEditor);
						// Add a mock editor
						tmpView._segmentEditors[0] = { state: { selection: { main: { from: 0, to: 0 } }, doc: { toString: () => '' } } };
						// Should not throw; just warns
						tmpView.applyFormatting(0, 'nonexistent');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Image Handling',
			() =>
			{
				test
				(
					'openImagePicker should be a callable method',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Img1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.openImagePicker).to.be.a('function');
						// Should not throw when called without a matching input element
						tmpView.openImagePicker(999);
						return fDone();
					}
				);
				test
				(
					'onImageUpload hook should exist and return false by default',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Img2', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.onImageUpload).to.be.a('function');
						let tmpResult = tmpView.onImageUpload({}, 0, () => {});
						Expect(tmpResult).to.equal(false);
						return fDone();
					}
				);
				test
				(
					'_isEmbeddableFile accepts images and videos, and nothing else',
					(fDone) =>
					{
						// One test behind every entry point, so a file that can be dropped can also be
						// pasted. A dropped PDF is ignored because markdown has nothing to show for it.
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Embeddable', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._isEmbeddableFile({ type: 'image/png' })).to.equal(true);
						Expect(tmpView._isEmbeddableFile({ type: 'video/mp4' })).to.equal(true);
						Expect(tmpView._isEmbeddableFile({ type: 'video/quicktime' })).to.equal(true);
						Expect(tmpView._isEmbeddableFile({ type: 'application/pdf' })).to.equal(false);
						Expect(tmpView._isEmbeddableFile({})).to.equal(false);
						Expect(tmpView._isEmbeddableFile(null)).to.equal(false);
						return fDone();
					}
				);
				test
				(
					'_insertVideoMarkdown writes a video fence, not an image',
					(fDone) =>
					{
						// The fence rather than ![](): an uploaded recording is addressed by a blob route
						// with no extension, and the renderer can only read "video" off an extension.
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Vid1', {}, libPictSectionMarkdownEditor);
						let tmpInserted = '';
						tmpView._segmentEditors[0] =
						{
							state: { selection: { main: { head: 0 } } },
							dispatch: (pTransaction) => { tmpInserted = pTransaction.changes.insert; },
							focus: () => { }
						};
						tmpView._insertVideoMarkdown(0, '/1.0/Media/42/Blob', 'A walkthrough');
						Expect(tmpInserted).to.contain('```video');
						Expect(tmpInserted).to.contain('/1.0/Media/42/Blob');
						Expect(tmpInserted).to.contain('title: A walkthrough');
						Expect(tmpInserted.indexOf('!['), 'not the image form').to.equal(-1);
						// A fence only opens at the start of a line.
						Expect(tmpInserted.charAt(0)).to.equal('\n');
						return fDone();
					}
				);
				test
				(
					'a dropped video goes to the fence and an image to the image form',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Vid2', {}, libPictSectionMarkdownEditor);
						let tmpInserted = '';
						tmpView._segmentEditors[0] =
						{
							state: { selection: { main: { head: 0 } } },
							dispatch: (pTransaction) => { tmpInserted = pTransaction.changes.insert; },
							focus: () => { }
						};
						// Stand in for a consumer upload handler: hand back a URL the way a real one would.
						tmpView.onImageUpload = (pFile, pSegmentIndex, fCallback) =>
						{
							fCallback(null, '/1.0/Media/7/Blob');
							return true;
						};
						tmpView._processImageFile({ type: 'video/mp4', name: 'deploy-run.mp4' }, 0);
						Expect(tmpInserted, 'a video becomes a fence').to.contain('```video');
						Expect(tmpInserted).to.contain('title: deploy-run');
						tmpView._processImageFile({ type: 'image/png', name: 'shot.png' }, 0);
						Expect(tmpInserted, 'an image is unchanged').to.contain('![shot](/1.0/Media/7/Blob)');
						return fDone();
					}
				);
				test
				(
					'a video with no upload handler is refused rather than inlined as base64',
					(fDone) =>
					{
						// A data URI of a recording is megabytes of text pasted into the document, which
						// every later save and read pays for. There is nowhere to put it, so it says so.
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Vid3', {}, libPictSectionMarkdownEditor);
						let tmpInserted = '';
						tmpView._segmentEditors[0] =
						{
							state: { selection: { main: { head: 0 } } },
							dispatch: (pTransaction) => { tmpInserted = pTransaction.changes.insert; },
							focus: () => { }
						};
						tmpView._processImageFile({ type: 'video/mp4', name: 'huge.mp4' }, 0);
						Expect(tmpInserted, 'nothing was written into the document').to.equal('');
						return fDone();
					}
				);
				test
				(
					'_insertImageMarkdown should be a callable method',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Img3', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._insertImageMarkdown).to.be.a('function');
						// Should not throw when called without an editor
						tmpView._insertImageMarkdown(999, 'http://example.com/img.png', 'test');
						return fDone();
					}
				);
				test
				(
					'_processImageFile should be a callable method',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Img4', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._processImageFile).to.be.a('function');
						// Should not throw with a non-image file
						tmpView._processImageFile({ type: 'text/plain', name: 'test.txt' }, 0);
						return fDone();
					}
				);
				test
				(
					'_processImageFile should reject null input',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Img5', {}, libPictSectionMarkdownEditor);
						// Should not throw with null input
						tmpView._processImageFile(null, 0);
						return fDone();
					}
				);
				test
				(
					'_processImageFile should use onImageUpload hook when it returns true',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Img6', {}, libPictSectionMarkdownEditor);

						let tmpUploadCalled = false;
						let tmpReceivedFile = null;

						// Override the hook to capture the call
						tmpView.onImageUpload = (pFile, pSegmentIndex, fCallback) =>
						{
							tmpUploadCalled = true;
							tmpReceivedFile = pFile;
							return true;
						};

						let tmpMockFile = { type: 'image/png', name: 'test.png' };
						tmpView._processImageFile(tmpMockFile, 0);

						Expect(tmpUploadCalled).to.equal(true);
						Expect(tmpReceivedFile).to.equal(tmpMockFile);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Segment Template Structure',
			() =>
			{
				test
				(
					'Segment template should contain drag handle',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpSegTemplate = tmpConfig.Templates.find((t) => t.Hash === 'MarkdownEditor-Segment');
						Expect(tmpSegTemplate).to.be.an('object');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-drag-handle');
						return fDone();
					}
				);
				test
				(
					'Segment template should contain sidebar with quadrant containers',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpSegTemplate = tmpConfig.Templates.find((t) => t.Hash === 'MarkdownEditor-Segment');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-sidebar');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-quadrant-tl');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-quadrant-bl');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-quadrant-tr');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-quadrant-br');
						return fDone();
					}
				);
				test
				(
					'Segment template should contain tab bar and preview pane wrapper',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpSegTemplate = tmpConfig.Templates.find((t) => t.Hash === 'MarkdownEditor-Segment');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-tab-bar');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-preview-pane');
						return fDone();
					}
				);
				test
				(
					'Segment template should contain file input for image uploads',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpSegTemplate = tmpConfig.Templates.find((t) => t.Hash === 'MarkdownEditor-Segment');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-image-input');
						Expect(tmpSegTemplate.Template).to.contain('accept="image/*"');
						return fDone();
					}
				);
				test
				(
					'CSS should contain active segment styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-active');
						Expect(tmpConfig.CSS).to.contain('pict-mde-drag-handle');
						Expect(tmpConfig.CSS).to.contain('pict-mde-sidebar');
						Expect(tmpConfig.CSS).to.contain('pict-mde-drag-over-top');
						Expect(tmpConfig.CSS).to.contain('pict-mde-drag-over-bottom');
						return fDone();
					}
				);
				test
				(
					'CSS should contain image drag-over styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-image-dragover');
						return fDone();
					}
				);
				test
				(
					'CSS should contain collapsed data URI widget styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-data-uri-collapsed');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Data URI Collapse Extension',
			() =>
			{
				test
				(
					'_buildDataURICollapseExtension should be a callable method',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Collapse1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._buildDataURICollapseExtension).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'_buildDataURICollapseExtension should return null when CodeMirror modules are not set',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Collapse2', {}, libPictSectionMarkdownEditor);
						let tmpResult = tmpView._buildDataURICollapseExtension();
						Expect(tmpResult).to.equal(null);
						return fDone();
					}
				);
				test
				(
					'_buildDataURICollapseExtension should return null when Decoration/ViewPlugin/WidgetType are missing',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-Collapse3', {}, libPictSectionMarkdownEditor);
						tmpView._codeMirrorModules = {
							EditorView: function () {},
							EditorState: function () {}
						};
						let tmpResult = tmpView._buildDataURICollapseExtension();
						Expect(tmpResult).to.equal(null);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Content Provider Integration',
			() =>
			{
				test
				(
					'_getContentProvider should return a pict-section-content provider instance',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CP1', {}, libPictSectionMarkdownEditor);
						let tmpProvider = tmpView._getContentProvider();
						Expect(tmpProvider).to.be.an('object');
						Expect(tmpProvider.parseMarkdown).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'_getContentProvider should return the same instance on subsequent calls',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CP2', {}, libPictSectionMarkdownEditor);
						let tmpProvider1 = tmpView._getContentProvider();
						let tmpProvider2 = tmpView._getContentProvider();
						Expect(tmpProvider1).to.equal(tmpProvider2);
						return fDone();
					}
				);
				test
				(
					'Content provider should parse markdown with headings',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CP3', {}, libPictSectionMarkdownEditor);
						let tmpProvider = tmpView._getContentProvider();
						let tmpResult = tmpProvider.parseMarkdown('# Hello World');
						Expect(tmpResult).to.contain('<h1');
						Expect(tmpResult).to.contain('Hello World');
						return fDone();
					}
				);
				test
				(
					'Content provider should parse mermaid fenced code blocks',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CP4', {}, libPictSectionMarkdownEditor);
						let tmpProvider = tmpView._getContentProvider();
						let tmpContent = '```mermaid\ngraph TD;\n  A-->B;\n```';
						let tmpResult = tmpProvider.parseMarkdown(tmpContent);
						Expect(tmpResult).to.contain('class="mermaid"');
						Expect(tmpResult).to.contain('graph TD');
						return fDone();
					}
				);
				test
				(
					'Content provider should parse KaTeX display math blocks',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CP5', {}, libPictSectionMarkdownEditor);
						let tmpProvider = tmpView._getContentProvider();
						let tmpContent = '$$\nE = mc^2\n$$';
						let tmpResult = tmpProvider.parseMarkdown(tmpContent);
						Expect(tmpResult).to.contain('pict-content-katex-display');
						Expect(tmpResult).to.contain('E = mc^2');
						return fDone();
					}
				);
				test
				(
					'Content provider should parse KaTeX inline math',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CP6', {}, libPictSectionMarkdownEditor);
						let tmpProvider = tmpView._getContentProvider();
						let tmpContent = 'The equation $E=mc^2$ is famous.';
						let tmpResult = tmpProvider.parseMarkdown(tmpContent);
						Expect(tmpResult).to.contain('pict-content-katex-inline');
						Expect(tmpResult).to.contain('E=mc^2');
						return fDone();
					}
				);
				test
				(
					'Content provider should parse code blocks with syntax highlighting',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CP7', {}, libPictSectionMarkdownEditor);
						let tmpProvider = tmpView._getContentProvider();
						let tmpContent = '```javascript\nconst x = 42;\n```';
						let tmpResult = tmpProvider.parseMarkdown(tmpContent);
						Expect(tmpResult).to.contain('pict-content-code-wrap');
						Expect(tmpResult).to.contain('language-javascript');
						return fDone();
					}
				);
				test
				(
					'_postRenderMermaid should not throw without mermaid global',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PostMerm', {}, libPictSectionMarkdownEditor);
						// Should not throw — mermaid is not defined in test env
						tmpView._postRenderMermaid('nonexistent-container', 0, 1);
						return fDone();
					}
				);
				test
				(
					'_postRenderKaTeX should not throw without katex global',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PostKaTeX', {}, libPictSectionMarkdownEditor);
						// Should not throw — katex is not defined in test env
						tmpView._postRenderKaTeX('nonexistent-container');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Preview Toggle',
			() =>
			{
				test
				(
					'Instance should initialize with preview mode off',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PrevTog1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._previewMode).to.equal('off');
						Expect(tmpView._lastPreviewLayout).to.equal('bottom');
						Expect(tmpView._segmentTabStates).to.be.an('object');
						Expect(Object.keys(tmpView._segmentTabStates).length).to.equal(0);
						Expect(tmpView._hiddenPreviewSegments).to.be.an('object');
						Expect(Object.keys(tmpView._hiddenPreviewSegments).length).to.equal(0);
						return fDone();
					}
				);
				test
				(
					'togglePreview should toggle between off and last preview layout',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PrevTog2', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._previewMode).to.equal('off');
						tmpView.togglePreview();
						Expect(tmpView._previewMode).to.equal('bottom');
						tmpView.togglePreview();
						Expect(tmpView._previewMode).to.equal('off');
						return fDone();
					}
				);
				test
				(
					'togglePreview should accept explicit boolean',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PrevTog3', {}, libPictSectionMarkdownEditor);
						tmpView.togglePreview(false);
						Expect(tmpView._previewMode).to.equal('off');
						tmpView.togglePreview(false);
						Expect(tmpView._previewMode).to.equal('off');
						tmpView.togglePreview(true);
						Expect(tmpView._previewMode).to.equal('bottom');
						return fDone();
					}
				);
				test
				(
					'toggleSegmentPreview should not throw without a DOM segment',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PrevTog4', {}, libPictSectionMarkdownEditor);
						// Should not throw even without a matching DOM element
						tmpView.toggleSegmentPreview(999);
						return fDone();
					}
				);
				test
				(
					'CSS should contain preview mode styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-preview-off');
						Expect(tmpConfig.CSS).to.contain('pict-mde-preview-bottom');
						Expect(tmpConfig.CSS).to.contain('pict-mde-preview-side');
						Expect(tmpConfig.CSS).to.contain('pict-mde-preview-tabbed');
						Expect(tmpConfig.CSS).to.contain('pict-mde-previews-hidden');
						Expect(tmpConfig.CSS).to.contain('pict-mde-preview-hidden');
						return fDone();
					}
				);
				test
				(
					'ButtonsBL config should contain a cyclePreviewMode action with preview class',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpPreviewBtn = tmpConfig.ButtonsBL.find((b) => b.Action === 'cyclePreviewMode');
						Expect(tmpPreviewBtn).to.be.an('object');
						Expect(tmpPreviewBtn.Class).to.contain('pict-mde-btn-preview');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Preview Layout Modes',
			() =>
			{
				test
				(
					'DefaultPreviewMode configuration option should default to off',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.DefaultPreviewMode).to.equal('off');
						return fDone();
					}
				);
				test
				(
					'setPreviewMode should set mode to valid values',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PM1', {}, libPictSectionMarkdownEditor);
						tmpView.setPreviewMode('bottom');
						Expect(tmpView._previewMode).to.equal('bottom');
						tmpView.setPreviewMode('side');
						Expect(tmpView._previewMode).to.equal('side');
						tmpView.setPreviewMode('tabbed');
						Expect(tmpView._previewMode).to.equal('tabbed');
						tmpView.setPreviewMode('off');
						Expect(tmpView._previewMode).to.equal('off');
						return fDone();
					}
				);
				test
				(
					'setPreviewMode should reject invalid mode',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PM2', {}, libPictSectionMarkdownEditor);
						tmpView.setPreviewMode('invalid');
						Expect(tmpView._previewMode).to.equal('off');
						return fDone();
					}
				);
				test
				(
					'setPreviewMode should update _lastPreviewLayout for non-off modes',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PM3', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._lastPreviewLayout).to.equal('bottom');
						tmpView.setPreviewMode('side');
						Expect(tmpView._lastPreviewLayout).to.equal('side');
						tmpView.setPreviewMode('off');
						Expect(tmpView._lastPreviewLayout).to.equal('side');
						tmpView.togglePreview();
						Expect(tmpView._previewMode).to.equal('side');
						return fDone();
					}
				);
				test
				(
					'cyclePreviewMode should cycle through all modes',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PM4', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._previewMode).to.equal('off');
						tmpView.cyclePreviewMode(0);
						Expect(tmpView._previewMode).to.equal('bottom');
						tmpView.cyclePreviewMode(0);
						Expect(tmpView._previewMode).to.equal('side');
						tmpView.cyclePreviewMode(0);
						Expect(tmpView._previewMode).to.equal('tabbed');
						tmpView.cyclePreviewMode(0);
						Expect(tmpView._previewMode).to.equal('off');
						return fDone();
					}
				);
				test
				(
					'switchSegmentTab should be a callable method',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-PM5', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.switchSegmentTab).to.be.a('function');
						// Should not throw even without DOM
						tmpView.switchSegmentTab(999, 'preview');
						return fDone();
					}
				);
				test
				(
					'CSS should contain tab bar styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-tab-bar');
						Expect(tmpConfig.CSS).to.contain('pict-mde-tab');
						Expect(tmpConfig.CSS).to.contain('pict-mde-tab-active');
						Expect(tmpConfig.CSS).to.contain('pict-mde-tab-showing-preview');
						return fDone();
					}
				);
				test
				(
					'CSS should contain preview pane wrapper styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-preview-pane');
						return fDone();
					}
				);
				test
				(
					'Instance should accept custom DefaultPreviewMode in options',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestMDE-PM6',
							{ DefaultPreviewMode: 'bottom' },
							libPictSectionMarkdownEditor
						);
						Expect(tmpView._previewMode).to.equal('bottom');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Rendered View Toggle',
			() =>
			{
				test
				(
					'Instance should initialize with rendered view inactive',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RV1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._renderedViewActive).to.equal(false);
						Expect(tmpView._renderedViewGeneration).to.equal(0);
						return fDone();
					}
				);
				test
				(
					'toggleRenderedView should toggle the rendered view state',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RV2', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._renderedViewActive).to.equal(false);
						tmpView.toggleRenderedView();
						Expect(tmpView._renderedViewActive).to.equal(true);
						tmpView.toggleRenderedView();
						Expect(tmpView._renderedViewActive).to.equal(false);
						return fDone();
					}
				);
				test
				(
					'toggleRenderedView should accept explicit boolean',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RV3', {}, libPictSectionMarkdownEditor);
						tmpView.toggleRenderedView(true);
						Expect(tmpView._renderedViewActive).to.equal(true);
						tmpView.toggleRenderedView(true);
						Expect(tmpView._renderedViewActive).to.equal(true);
						tmpView.toggleRenderedView(false);
						Expect(tmpView._renderedViewActive).to.equal(false);
						return fDone();
					}
				);
				test
				(
					'_renderRenderedView should not throw without DOM',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RV4', {}, libPictSectionMarkdownEditor);
						// Should not throw — no target element set
						tmpView._renderRenderedView();
						return fDone();
					}
				);
				test
				(
					'_restoreEditingView should not throw without DOM',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RV5', {}, libPictSectionMarkdownEditor);
						// Should not throw — no target element set
						tmpView._restoreEditingView();
						return fDone();
					}
				);
				test
				(
					'CSS should contain rendered view styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-rendered-view');
						Expect(tmpConfig.CSS).to.contain('pict-mde-rendered-mode');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Quadrant Button System',
			() =>
			{
				test
				(
					'Default config should have ButtonsTL, ButtonsBL, ButtonsTR, ButtonsBR arrays',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.ButtonsTL).to.be.an('array');
						Expect(tmpConfig.ButtonsBL).to.be.an('array');
						Expect(tmpConfig.ButtonsTR).to.be.an('array');
						Expect(tmpConfig.ButtonsBR).to.be.an('array');
						return fDone();
					}
				);
				test
				(
					'ButtonsTL should have 1 entry (remove)',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.ButtonsTL.length).to.equal(1);
						Expect(tmpConfig.ButtonsTL[0].Action).to.equal('removeSegment');
						return fDone();
					}
				);
				test
				(
					'ButtonsBL should have 4 entries (up, down, controls, preview)',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.ButtonsBL.length).to.equal(4);
						Expect(tmpConfig.ButtonsBL[0].Action).to.equal('moveSegmentUp');
						Expect(tmpConfig.ButtonsBL[1].Action).to.equal('moveSegmentDown');
						Expect(tmpConfig.ButtonsBL[2].Action).to.equal('toggleControls');
						Expect(tmpConfig.ButtonsBL[3].Action).to.equal('cyclePreviewMode');
						return fDone();
					}
				);
				test
				(
					'ButtonsTR should have 6 entries (formatting buttons)',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.ButtonsTR.length).to.equal(6);
						Expect(tmpConfig.ButtonsTR[0].Action).to.equal('applyFormatting:bold');
						Expect(tmpConfig.ButtonsTR[5].Action).to.equal('openImagePicker');
						return fDone();
					}
				);
				test
				(
					'ButtonsBR should be empty by default',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.ButtonsBR.length).to.equal(0);
						return fDone();
					}
				);
				test
				(
					'CSS should contain quadrant classes',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-quadrant-tl');
						Expect(tmpConfig.CSS).to.contain('pict-mde-quadrant-bl');
						Expect(tmpConfig.CSS).to.contain('pict-mde-quadrant-tr');
						Expect(tmpConfig.CSS).to.contain('pict-mde-quadrant-br');
						return fDone();
					}
				);
				test
				(
					'Each button config should have HTML, Action, Class, and Title',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpAllButtons = [].concat(tmpConfig.ButtonsTL, tmpConfig.ButtonsBL, tmpConfig.ButtonsTR, tmpConfig.ButtonsBR);
						for (let i = 0; i < tmpAllButtons.length; i++)
						{
							Expect(tmpAllButtons[i]).to.have.property('HTML');
							Expect(tmpAllButtons[i]).to.have.property('Action');
							Expect(tmpAllButtons[i]).to.have.property('Class');
							Expect(tmpAllButtons[i]).to.have.property('Title');
						}
						return fDone();
					}
				);
				test
				(
					'_buildQuadrantButtons should be a callable method',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-QB1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._buildQuadrantButtons).to.be.a('function');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Controls Toggle',
			() =>
			{
				test
				(
					'Instance should initialize with controls visible',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CT1', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._controlsVisible).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'toggleControls should toggle _controlsVisible',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CT2', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._controlsVisible).to.equal(true);
						tmpView.toggleControls();
						Expect(tmpView._controlsVisible).to.equal(false);
						tmpView.toggleControls();
						Expect(tmpView._controlsVisible).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'toggleControls should accept explicit boolean (first arg)',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CT3', {}, libPictSectionMarkdownEditor);
						tmpView.toggleControls(false);
						Expect(tmpView._controlsVisible).to.equal(false);
						tmpView.toggleControls(false);
						Expect(tmpView._controlsVisible).to.equal(false);
						tmpView.toggleControls(true);
						Expect(tmpView._controlsVisible).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'toggleControls should accept segment index + explicit boolean (second arg)',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CT4', {}, libPictSectionMarkdownEditor);
						// Called like toggleControls(segmentIndex, boolean) from quadrant system
						tmpView.toggleControls(0, false);
						Expect(tmpView._controlsVisible).to.equal(false);
						tmpView.toggleControls(0, true);
						Expect(tmpView._controlsVisible).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'toggleControls should toggle when called with segment index and no boolean',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CT5', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._controlsVisible).to.equal(true);
						// Called like toggleControls(segmentIndex) from quadrant button
						tmpView.toggleControls(0);
						Expect(tmpView._controlsVisible).to.equal(false);
						tmpView.toggleControls(0);
						Expect(tmpView._controlsVisible).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'toggleLineNumbers should be a backward-compatible alias for toggleControls',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-CT6', {}, libPictSectionMarkdownEditor);
						Expect(tmpView.toggleLineNumbers).to.be.a('function');
						Expect(tmpView._controlsVisible).to.equal(true);
						tmpView.toggleLineNumbers();
						Expect(tmpView._controlsVisible).to.equal(false);
						tmpView.toggleLineNumbers(true);
						Expect(tmpView._controlsVisible).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'CSS should contain controls-hidden rules',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-controls-hidden');
						Expect(tmpConfig.CSS).to.contain('pict-mde-controls-on');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Rich Preview Configuration',
			() =>
			{
				test
				(
					'Default configuration should have EnableRichPreview set to true',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.EnableRichPreview).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'CSS should contain rich preview styles',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						Expect(tmpConfig.CSS).to.contain('pict-mde-rich-preview');
						Expect(tmpConfig.CSS).to.contain('pict-mde-has-rich-preview');
						return fDone();
					}
				);
				test
				(
					'Segment template should contain rich preview container',
					(fDone) =>
					{
						let tmpConfig = libPictSectionMarkdownEditor.default_configuration;
						let tmpSegTemplate = tmpConfig.Templates.find((t) => t.Hash === 'MarkdownEditor-Segment');
						Expect(tmpSegTemplate.Template).to.contain('pict-mde-rich-preview');
						Expect(tmpSegTemplate.Template).to.contain('PictMDE-RichPreview-');
						return fDone();
					}
				);
				test
				(
					'_updateRichPreviews should not throw before initialization',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RichPrev1', {}, libPictSectionMarkdownEditor);
						tmpView._updateRichPreviews(999);
						return fDone();
					}
				);
				test
				(
					'Instance should have rich preview timers and generations initialized',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestMDE-RichPrev2', {}, libPictSectionMarkdownEditor);
						Expect(tmpView._richPreviewTimers).to.be.an('object');
						Expect(tmpView._richPreviewGenerations).to.be.an('object');
						return fDone();
					}
				);
			}
		);
	}
);
