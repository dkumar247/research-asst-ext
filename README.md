# Research Assistant Chrome Extension

A Chrome extension that provides AI-powered text summarization and research capabilities through a convenient side panel interface.

## Features

- Text summarization from any webpage
- Research notes with local storage
- Side panel interface for easy access
- Integration with backend AI service
  
## Demo Video (click on below image)

[![Watch the video](https://img.youtube.com/vi/otuJlxIWG94/hqdefault.jpg)](https://youtu.be/otuJlxIWG94)

## Prerequisites

- Google Chrome or Chromium-based browser
- Backend service running on `http://localhost:8080` (Backend repo available here https://github.com/dkumar247/research-assistant)

## Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd research-assistant-extension
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the extension directory

3. The extension icon will appear in your toolbar

## Usage

1. Click the extension icon to open the side panel
2. Select any text on a webpage
3. Click "Summarize" to get an AI-generated summary
4. Use the notes section to save your research
5. Click "Save Notes" to persist your notes locally

## Project Structure

```
.
├── manifest.json      # Extension configuration
├── background.js      # Service worker for extension
├── sidepanel.html     # Side panel UI
├── sidepanel.js       # Side panel functionality
└── sidepanel.css      # Side panel styling
```

## Configuration

The extension expects the backend API to be running at `http://localhost:8080`. To change this, update the URL in `sidepanel.js`:

```javascript
const response = await fetch('http://localhost:8080/api/research/process', {
    // ...
});
```

## Permissions

The extension requires the following permissions:
- `activeTab` - Access to the current tab
- `storage` - Save notes locally
- `sidePanel` - Display the side panel
- `scripting` - Execute content scripts

## Development

To modify the extension:
1. Make your changes
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## API Endpoints Used

- `POST /api/research/process` - Process selected text for summarization

## Troubleshooting

- **Extension not loading**: Check for errors in `chrome://extensions/`
- **API connection failed**: Ensure backend is running on port 8080
- **No text selected error**: Select text before clicking summarize
- **Notes not saving**: Check browser storage permissions
