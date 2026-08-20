# pict-section-markdowneditor

> **[Read the Pict-Section-Markdowneditor Documentation](https://fable-retold.github.io/pict-section-markdowneditor/)** - interactive docs with the full API reference.

A segmented markdown editor for Pict applications, built on CodeMirror v6. Split your document into independently editable segments, reorder them with drag-and-drop, and get live rich previews with syntax highlighting, mermaid diagrams, and KaTeX math.

## Quick Start

```bash
npm install pict-section-markdowneditor
```

### 1. Define an Editor View

Extend `PictSectionMarkdownEditor` and register it with a Pict application:

```javascript
const libPictApplication = require('pict-application');
const libPictSectionMarkdownEditor = require('pict-section-markdowneditor');

class MyEditorView extends libPictSectionMarkdownEditor
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}
}

const _EditorConfig = (
{
	"ViewIdentifier": "MyEditor",
	"TargetElementAddress": "#EditorContainer",
	"ContentDataAddress": "AppData.Document.Segments",
	"ReadOnly": false,
	"EnableRichPreview": true
});

class MyApp extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.pict.addView('MyEditorView', _EditorConfig, MyEditorView);
	}

	onAfterInitialize()
	{
		super.onAfterInitialize();
		this.pict.views.MyEditorView.render();
	}
}

module.exports = MyApp;

module.exports.default_configuration = (
{
	"Name": "My Editor App",
	"Hash": "MyEditorApp",
	"MainViewportViewIdentifier": "MyEditorView",
	"pict_configuration":
	{
		"Product": "MyEditor-App",
		"DefaultAppData":
		{
			"Document":
			{
				"Segments":
				[
					{ "Content": "# Hello\n\nStart writing here." }
				]
			}
		}
	}
});
```

### 2. Create the HTML Page

```html
<!doctype html>
<html>
<head>
	<style id="PICT-CSS"></style>
	<script src="./codemirror-bundle.js"></script>
	<script src="./pict.min.js"></script>
	<script>
		Pict.safeOnDocumentReady(() => { Pict.safeLoadPictApplication(MyApp, 1) });
	</script>
</head>
<body>
	<div id="EditorContainer"></div>
	<script src="./my_app.min.js"></script>
</body>
</html>
```

### 3. Build and Run

```bash
npx quack build && npx quack copy
```

Open `dist/index.html` in your browser.

## How It Works

1. Your Pict application initializes and renders the editor view
2. The view reads `ContentDataAddress` from AppData to load an array of segment objects
3. Each segment gets its own CodeMirror editor instance inside a four-quadrant layout
4. Formatting buttons (bold, italic, code, heading, link, image) appear in the sidebar
5. Content changes are debounced and marshaled back to AppData automatically
6. Rich previews render markdown to HTML via `pict-section-content` with mermaid and KaTeX post-processing

## CodeMirror Integration

The editor does not bundle CodeMirror directly. Your application must provide `EditorView`, `EditorState`, and an `extensions` array in one of two ways:

1. **Window global** -- Set `window.CodeMirrorModules` with the required exports (recommended for browser apps)
2. **Explicit injection** -- Call `view.connectCodeMirrorModules({ EditorView, EditorState, extensions })` before rendering

## Features

- **Segmented Editing** -- Break documents into independently editable segments with add, remove, and reorder
- **Drag-and-Drop Reorder** -- Drag segments by the handle to reorganize your document
- **Rich Preview** -- Live rendered markdown below each segment with syntax highlighting, mermaid diagrams, and KaTeX math
- **Formatting Toolbar** -- Bold, italic, code, heading, link, and image buttons that follow your cursor
- **Image Support** -- Paste, drag, or file-pick images with base64 inline or server-side upload via the `onImageUpload` hook
- **Video Support** -- Paste or drag a recording; it uploads through the same hook and is inserted as a `video` fence (an upload handler is required, since a video has no sensible inline form)
- **Data URI Collapse** -- Long base64 image URIs are visually collapsed in the editor without changing the document
- **Read-Only Mode** -- Toggle editing on or off at runtime with `setReadOnly()`
- **Rendered View** -- Toggle a full-document read-mode preview that combines all segments
- **Keyboard Shortcuts** -- `Ctrl/Cmd+B` bold, `Ctrl/Cmd+I` italic, `Ctrl/Cmd+E` inline code

## Examples

Four working example applications are included in the `example_applications/` folder:

- **`markdown_editor/`** -- Full-featured segmented editor with previews, formatting, drag reorder, and rich content
- **`embedded_editor/`** -- Small bordered widget for notes, comments, or form fields
- **`book_viewer/`** -- A multi-chapter book rendered with pict-section-content, click any section to edit it inline
- **`server_upload/`** -- Orator server with image upload endpoint demonstrating the `onImageUpload` hook

## Learn More

- [Configuration](configuration.md) -- View options, button quadrants, and template customization
- [API Reference](api.md) -- Complete class method and property documentation
- [Image Upload](image_upload.md) -- Server-side image upload integration guide
- [Pict View](/pict/pict-view/) -- The base view class this editor extends
- [Pict Application](/pict/pict-application/) -- The application container

## Related Packages

- [pict](https://github.com/fable-retold/pict) - MVC application framework
- [pict-view](https://github.com/fable-retold/pict-view) - View base class
- [pict-section-content](https://github.com/fable-retold/pict-section-content) - Markdown rendering with code highlighting, mermaid, and KaTeX
- [pict-application](https://github.com/fable-retold/pict-application) - Application base class

## License

MIT

## Contributing

Pull requests are welcome. For details on our code of conduct, contribution process, and testing requirements, see the [Retold Contributing Guide](https://github.com/fable-retold/retold/blob/main/docs/contributing.md).
