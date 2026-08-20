# Image and Video Upload

By default, the markdown editor embeds images as base64 data URIs inline in the markdown. This works for small images but produces bloated documents. For production use, you should override the `onImageUpload` hook to upload images to a server and insert URLs instead.

**Video goes through the same hook.** A pasted or dropped video file reaches `onImageUpload` exactly as an image does, and your handler tells them apart with `pFile.type`. There is one difference: a video has no inline fallback. Without an upload handler the editor refuses the file and says so, because a base64 data URI of a recording is megabytes of text pasted into the document that every later save and read would carry.

## Ingestion Flow

Images and videos enter the editor through three paths:

1. **Clipboard paste** -- User pastes from the clipboard (Ctrl/Cmd+V)
2. **Drag-and-drop** -- User drags a file onto a segment
3. **File picker** -- User clicks the image button in the sidebar

All three ask the same question, `_isEmbeddableFile(pFile)`: an `image/*` or a `video/*` file goes on, and
anything else is ignored, because markdown has nothing to show for a dropped PDF.

All three paths converge on `_processImageFile(pFile, pSegmentIndex)`, which calls your `onImageUpload` hook:

```
User action (paste / drag / pick)
         |
         v
  _processImageFile(file, segmentIndex)
         |
         v
  onImageUpload(file, segmentIndex, callback)
         |
    +----+----+
    |         |
  true      false (default)
    |         |
  async     FileReader.readAsDataURL()
  upload        |
    |           v
    |     _insertImageMarkdown(idx, dataURI, alt)
    |
    v
  callback(null, url)
    |
    v
  _insertImageMarkdown(idx, url, alt)
```

## The `onImageUpload` Hook

Override this method in your subclass to handle server-side uploads:

```javascript
/**
 * @param {File} pFile - The image File object from the browser
 * @param {number} pSegmentIndex - Which segment to insert the image into
 * @param {function} fCallback - Call when done: fCallback(pError, pURL)
 * @returns {boolean} true if you handle it, false for default base64
 */
onImageUpload(pFile, pSegmentIndex, fCallback)
{
	// Return true to tell the editor you are handling the upload
	// Return false (or don't override) for default base64 behavior
}
```

**Key contract:**

- Return `true` to signal that your code handles the upload asynchronously. The editor will not create a base64 fallback.
- Call `fCallback(null, pURL)` on success. The editor inserts `![alt](pURL)` at the cursor position.
- Call `fCallback(pErrorMessage)` on failure. The editor logs the error; no image is inserted.
- If you return `false` (or don't override this method), the editor uses FileReader to produce a base64 data URI.

## Complete Server Upload Example

This is a full walkthrough of the `server_upload` example application.

### Client Side: Subclassed Editor View

```javascript
const libPictSectionMarkdownEditor = require('pict-section-markdowneditor');

class ServerUploadEditorView extends libPictSectionMarkdownEditor
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onImageUpload(pFile, pSegmentIndex, fCallback)
	{
		fetch('/api/upload-image',
			{
				method: 'POST',
				body: pFile,
				headers:
				{
					'Content-Type': pFile.type,
					'x-filename': pFile.name
				}
			})
			.then(
				(pResponse) =>
				{
					if (!pResponse.ok)
					{
						throw new Error(`Server responded with ${pResponse.status}`);
					}
					return pResponse.json();
				})
			.then(
				(pData) =>
				{
					if (pData.Success && pData.URL)
					{
						fCallback(null, pData.URL);
					}
					else
					{
						fCallback(pData.Error || 'Upload failed');
					}
				})
			.catch(
				(pError) =>
				{
					this.log.error(`Upload error: ${pError.message}`);
					fCallback(pError.message);
				});

		return true;
	}
}
```

The client sends the raw `File` object as the request body with two headers:
- `Content-Type` -- The MIME type of the image (e.g., `image/png`)
- `x-filename` -- The original filename from the user's filesystem

### Server Side: Orator Endpoint

The server uses Orator (Retold's Restify wrapper) to handle the upload:

```javascript
const libFs = require('fs');
const libPath = require('path');
const libFable = require('fable');
const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');

let _UploadsFolder = libPath.join(__dirname, 'dist', 'uploads');

// Ensure the uploads directory exists
if (!libFs.existsSync(_UploadsFolder))
{
	libFs.mkdirSync(_UploadsFolder, { recursive: true });
}

let _Fable = new libFable(
	{
		Product: 'MarkdownEditor-ServerUpload',
		ProductVersion: '0.0.1',
		APIServerPort: 8089
	});

_Fable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);
_Fable.serviceManager.instantiateServiceProvider('OratorServiceServer');
_Fable.serviceManager.addServiceType('Orator', libOrator);
let _Orator = _Fable.serviceManager.instantiateServiceProvider('Orator');
```

#### POST `/api/upload-image`

Receives the raw image binary and saves it to disk:

```javascript
tmpServiceServer.post('/api/upload-image',
	(pRequest, pResponse, fNext) =>
	{
		let tmpBody = pRequest.body;

		if (!tmpBody)
		{
			pResponse.send(400, { Success: false, Error: 'No image data received.' });
			return fNext();
		}

		// Get the original filename from the custom header
		let tmpOriginalName = sanitizeFilename(pRequest.headers['x-filename']);
		let tmpContentType = pRequest.headers['content-type'] || 'application/octet-stream';

		// Determine file extension from content-type if needed
		let tmpExt = libPath.extname(tmpOriginalName);
		if (!tmpExt)
		{
			let tmpMimeMap =
			{
				'image/png': '.png',
				'image/jpeg': '.jpg',
				'image/gif': '.gif',
				'image/webp': '.webp',
				'image/svg+xml': '.svg',
				'image/bmp': '.bmp'
			};
			tmpExt = tmpMimeMap[tmpContentType] || '.bin';
			tmpOriginalName += tmpExt;
		}

		// Generate a unique filename: timestamp-originalname
		let tmpUniqueFilename = `${Date.now()}-${tmpOriginalName}`;
		let tmpFilePath = libPath.join(_UploadsFolder, tmpUniqueFilename);

		// Write the file
		let tmpBuffer = Buffer.isBuffer(tmpBody) ? tmpBody : Buffer.from(tmpBody);
		libFs.writeFileSync(tmpFilePath, tmpBuffer);

		let tmpURL = `/uploads/${tmpUniqueFilename}`;

		pResponse.send(
			{
				Success: true,
				URL: tmpURL,
				Filename: tmpUniqueFilename,
				Size: tmpBuffer.length
			});

		return fNext();
	});
```

#### Filename Sanitization

The server sanitizes filenames to prevent path traversal and dangerous characters:

```javascript
function sanitizeFilename(pName)
{
	if (!pName || typeof (pName) !== 'string')
	{
		return 'upload';
	}
	// Strip directory components
	let tmpName = libPath.basename(pName);
	// Remove dangerous characters
	tmpName = tmpName.replace(/[\/\\:*?"<>|]/g, '_');
	// Limit length
	if (tmpName.length > 200)
	{
		tmpName = tmpName.substring(0, 200);
	}
	return tmpName || 'upload';
}
```

#### GET `/api/uploads`

Lists all uploaded files (useful for debugging or building a file browser):

```javascript
tmpServiceServer.get('/api/uploads',
	(pRequest, pResponse, fNext) =>
	{
		let tmpFiles = libFs.readdirSync(_UploadsFolder);
		let tmpFileList = tmpFiles.map(
			(pFilename) =>
			{
				let tmpStat = libFs.statSync(libPath.join(_UploadsFolder, pFilename));
				return (
					{
						Filename: pFilename,
						URL: `/uploads/${pFilename}`,
						Size: tmpStat.size,
						Modified: tmpStat.mtime
					});
			});

		pResponse.send({ Success: true, Files: tmpFileList });
		return fNext();
	});
```

#### Static File Serving

The server serves the `dist/` folder as static files, which includes both the built application and the uploaded images:

```javascript
_Orator.addStaticRoute(`${__dirname}/dist/`, 'index.html');
```

### Complete Upload Flow

```
1. User pastes an image into segment 2
         |
2. _processImageFile(file, 2) is called
         |
3. onImageUpload(file, 2, callback) fires
         |
4. Client sends:  POST /api/upload-image
                  Content-Type: image/png
                  x-filename: screenshot.png
                  Body: <raw binary>
         |
5. Server:  sanitizeFilename("screenshot.png")
            -> "screenshot.png"
            -> "1708529890-screenshot.png"
            -> fs.writeFileSync(uploadsFolder + "/1708529890-screenshot.png")
         |
6. Server responds:
   {
     "Success": true,
     "URL": "/uploads/1708529890-screenshot.png",
     "Filename": "1708529890-screenshot.png",
     "Size": 25000
   }
         |
7. Client calls: callback(null, "/uploads/1708529890-screenshot.png")
         |
8. Editor inserts: ![screenshot](/uploads/1708529890-screenshot.png)
   at the cursor position in segment 2
         |
9. Image preview updates to show the uploaded image
```

## Alternative: FormData Upload

The example uses raw binary upload for simplicity. You can also use FormData if your server expects multipart uploads:

```javascript
onImageUpload(pFile, pSegmentIndex, fCallback)
{
	let tmpFormData = new FormData();
	tmpFormData.append('image', pFile);

	fetch('/api/upload',
		{
			method: 'POST',
			body: tmpFormData
		})
		.then((pResponse) => pResponse.json())
		.then(
			(pData) =>
			{
				if (pData.url)
				{
					fCallback(null, pData.url);
				}
				else
				{
					fCallback('No URL in response');
				}
			})
		.catch((pError) => fCallback(pError.message));

	return true;
}
```

## Alternative: External Service Upload

You can upload to any external service that returns a URL (S3, Cloudinary, etc.):

```javascript
onImageUpload(pFile, pSegmentIndex, fCallback)
{
	let tmpPresignedURL = '...'; // Fetch from your API

	fetch(tmpPresignedURL,
		{
			method: 'PUT',
			body: pFile,
			headers: { 'Content-Type': pFile.type }
		})
		.then(
			(pResponse) =>
			{
				if (pResponse.ok)
				{
					// Construct the public URL from the presigned URL
					let tmpPublicURL = tmpPresignedURL.split('?')[0];
					fCallback(null, tmpPublicURL);
				}
				else
				{
					fCallback(`Upload failed: ${pResponse.status}`);
				}
			})
		.catch((pError) => fCallback(pError.message));

	return true;
}
```

## Image Preview

After an image URL is inserted, the editor automatically scans the segment content for `![alt](url)` patterns and renders thumbnail previews in the image preview area below the editor. These previews update on a 500ms debounce after each keystroke.

## Data URI Collapse

When images are embedded as base64 data URIs (the default behavior without a server upload hook), the raw base64 string can be thousands of characters long. The editor includes a CodeMirror extension that visually collapses these URIs:

```
Before: ![photo](data:image/png;base64,iVBORw0KGgoAAAANSUhEU...40000 chars...)
After:  ![photo](data:image/png;base64,...39kB)
```

The collapse is display-only -- the document content is not modified. This extension requires `Decoration`, `ViewPlugin`, and `WidgetType` to be provided through `connectCodeMirrorModules()` or `window.CodeMirrorModules`.


## What Gets Inserted

The two kinds are written differently, and the reason is the URL your handler returns.

| File | Inserted |
|------|----------|
| Image | `![alt](URL)` |
| Video | A `video` fence carrying the URL and a `title:` line |

An uploaded file is usually addressed by a blob route with no file extension -- `/1.0/Media/42/Blob` -- and a
renderer can only read "this is a video" off an extension. The fence states it outright, so the URL does not
have to. `pict-section-content` renders that fence as a player.

A video whose URL *does* end in `.mp4`, `.webm`, `.ogv`, `.ogg`, `.mov` or `.m4v` can also be written with the
image form by hand; the renderer treats it as a player either way.

## Upload Size

Your handler decides the limit, and it is the handler's job to report a rejection: the editor logs the error
it is given but shows nothing on its own. A server that refuses an oversized upload with a 413 should surface
that to the person who just dropped a 200 MB screen recording, or the file appears to vanish.
