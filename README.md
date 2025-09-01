# Daily Activity Tracker Chrome Extension

A professional and robust Chrome extension for tracking daily activities with a clean, intuitive interface.

## Features

- **📅 Smart Calendar**: Displays current month dates, automatically skipping weekends
- **📊 Working Days Summary**: Shows total working days, completed activities, and pending tasks at the top
- **📝 Compact Activity Input**: Reduced default textarea height by 25% (can be resized by dragging)
- **📓 Notes Section**: Persistent notes that stay the same regardless of selected date
- **➕ Multiple Notes**: Add unlimited notes with individual edit/delete controls
- **💻 Code Snippets**: Select text and click 💻 button to format as inline code
- **💾 Auto-Save**: Both activities and notes auto-save as you type
- **🎯 Default Today**: Automatically selects today's date when opening
- **🔄 Scroll Persistence**: Remembers your scroll position when closing/reopening
- **📊 CSV Export**: Export current month activities to CSV for backup or analysis
- **🔗 ERP Integration**: Quick access link to ERP timesheet at the bottom
- **✏️ Edit Anytime**: Edit past activities or add missed entries
- **🎨 Professional UI**: Clean, modern design with responsive layout
- **⚡ Performance**: Optimized for speed and reliability

## Installation

1. **Download/Clone** this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **"Developer mode"** in the top right corner
4. Click **"Load unpacked"** button
5. Select the folder containing the extension files
6. The extension will appear in your extensions list and browser toolbar

## Usage

### Adding Activities
1. Click the extension icon in your browser toolbar
2. The calendar shows weekdays for the current month
3. Today's date is automatically selected
4. Type your activities in the text area
5. Activities are automatically saved as you type

### Navigation
- Use **‹ ›** buttons to navigate between months
- Click any date to select it and view/edit activities
- Dates with activities show a yellow indicator dot

### Managing Activities
- **Save**: Activities auto-save, but you can manually save with the Save button
- **Clear**: Use the Clear button to remove activities (with confirmation)
- **Edit Past**: Click any date to edit past or future activities

### Notes Management
- **Add Notes**: Click the **+** button to create new notes
- **Persistent**: Notes stay the same regardless of selected date
- **Auto-Save**: Notes automatically save as you type (500ms delay)
- **Auto-Resize**: Textarea height adapts automatically to content length
- **Code Blocks**: Type `\code` to insert multi-line code blocks (```code```)
- **Inline Code**: Select text and click 💻 button to format as `inline code`
- **Delete**: Click 🗑️ button to delete notes (with confirmation)
- **Multiple**: Create unlimited notes for different purposes

### Working Days Overview
- **Total Working Days**: Shows count of weekdays (Mon-Fri) in current month
- **Completed**: Number of days with activities logged
- **Pending**: Remaining working days without activities
- Updated in real-time as you add/remove activities

### Export Data
- Click **"Export CSV"** to download current month activities as a CSV file
- File will be named `daily-activities-[Month Year].csv`
- Perfect for monthly reporting and analysis

### ERP Integration
- **Configurable Link**: Set up your own ERP timesheet URL via the ⚙️ settings button
- Click the gear icon in the ERP section at the bottom to configure your link
- URL is saved locally and persists across browser sessions
- Opens in new tab for easy switching between activity logging and ERP entry
- Supports any ERP system with web-based timesheet functionality

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension standards
- **Chrome Storage API**: Secure, persistent data storage
- **Responsive Design**: Works on different screen sizes
- **No External Dependencies**: Self-contained extension
- **Privacy-Focused**: All data stored locally in your browser

## File Structure

```
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Core functionality
├── styles.css            # Professional styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## Privacy & Security

- All activity data is stored locally in your browser
- No data is transmitted to external servers
- Uses Chrome's secure storage APIs
- No tracking or analytics

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Opera, etc.)
- Requires Manifest V3 support

## Contributing

Feel free to submit issues or pull requests for improvements!

## License

This project is open source and available under the MIT License.
