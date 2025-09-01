// Daily Activity Tracker - Main JavaScript

class DailyActivityTracker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.activities = {};
        this.notes = [];
        this.scrollPosition = 0;
        this.erpUrl = '';
        this.init();
    }

    async init() {
        await this.loadActivities();
        await this.loadNotes();
        await this.loadErpConfig();
        this.setupEventListeners();
        this.renderCalendar();
        this.updateSelectedDateDisplay();
        this.restoreScrollPosition();
        this.setupAutoSave();
        this.renderNotes();
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));

        // Action buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveActivity());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearActivity());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());

        // Notes buttons
        document.getElementById('addNoteBtn').addEventListener('click', () => this.addNote());

        // ERP Configuration buttons
        const erpConfigToggle = document.getElementById('erpConfigToggle');
        if (erpConfigToggle) {
            erpConfigToggle.addEventListener('click', () => this.toggleErpConfigPanel());
        }

        const saveErpUrl = document.getElementById('saveErpUrl');
        if (saveErpUrl) {
            saveErpUrl.addEventListener('click', () => this.saveErpUrl());
        }

        const erpUrlInput = document.getElementById('erpUrlInput');
        if (erpUrlInput) {
            erpUrlInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveErpUrl();
                }
            });
        }

        // Toolbar buttons
        const boldBtn = document.getElementById('boldBtn');
        if (boldBtn) {
            boldBtn.addEventListener('click', () => {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.classList.contains('note-textarea')) {
                    this.applyBoldFormatting(activeElement);
                    // Trigger auto-resize
                    activeElement.style.height = 'auto';
                    activeElement.style.height = activeElement.scrollHeight + 'px';
                }
            });
        }

        // No view toggle buttons needed - always in styled mode

        // Textarea events
        const textarea = document.getElementById('activityText');
        textarea.addEventListener('input', () => {
            this.updateCharacterCount();
            this.updateButtonStates();
        });

        // Global Ctrl+B handler for all note textareas
        document.addEventListener('keydown', (e) => {
            console.log('Global keydown:', e.key, e.keyCode, e.ctrlKey, e.metaKey, e.target.className);
            // Only handle Ctrl+B if a note textarea is focused
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('note-textarea')) {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B' || e.keyCode === 66 || e.keyCode === 98)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    console.log('Global Ctrl+B detected for note textarea, applying bold formatting');
                    this.applyBoldFormatting(activeElement);
                    // Trigger auto-resize
                    activeElement.style.height = 'auto';
                    activeElement.style.height = activeElement.scrollHeight + 'px';
                    return false;
                }
            }
        });

        // Scroll persistence
        window.addEventListener('scroll', () => this.saveScrollPosition());
        window.addEventListener('beforeunload', () => this.saveScrollPosition());
    }

    setupAutoSave() {
        let autoSaveTimeout;
        const textarea = document.getElementById('activityText');

        textarea.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                this.saveActivity();
            }, 1000); // Auto-save after 1 second of inactivity
        });
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthTitle = document.getElementById('currentMonth');

        // Update month title
        const options = { year: 'numeric', month: 'long' };
        monthTitle.textContent = this.currentDate.toLocaleDateString('en-US', options);

        // Clear existing grid
        calendarGrid.innerHTML = '';

        // Get first day of month and total days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const totalDays = lastDay.getDate();

        let totalWorkingDays = 0;
        let completedDays = 0;

        // Generate date buttons (weekdays only)
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dayOfWeek = date.getDay();

            // Skip weekends (Saturday = 6, Sunday = 0)
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            totalWorkingDays++;

            const dateBtn = document.createElement('button');
            dateBtn.className = 'date-btn';

            // Get day name abbreviation (Mon, Tue, etc.)
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[dayOfWeek];

            // Create content with day name and date
            dateBtn.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-number">${day}</div>
            `;
            dateBtn.dataset.date = date.toISOString().split('T')[0];

            // Add classes for styling
            if (this.isToday(date)) {
                dateBtn.classList.add('today');
            }

            if (this.isSelectedDate(date)) {
                dateBtn.classList.add('active');
            }

            // Check if date has activity
            const dateKey = this.getDateKey(date);
            if (this.activities[dateKey] && this.activities[dateKey].trim()) {
                dateBtn.classList.add('has-activity');
                completedDays++;
            }

            // Add click handler
            dateBtn.addEventListener('click', () => this.selectDate(date));

            calendarGrid.appendChild(dateBtn);
        }

        // Update working days summary
        this.updateWorkingDaysSummary(totalWorkingDays, completedDays);
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
        this.saveScrollPosition();
    }

    updateWorkingDaysSummary(totalWorkingDays, completedDays) {
        const totalWorkingDaysEl = document.getElementById('totalWorkingDays');
        const completedDaysEl = document.getElementById('completedDays');
        const pendingDaysEl = document.getElementById('pendingDays');

        totalWorkingDaysEl.textContent = totalWorkingDays;
        completedDaysEl.textContent = completedDays;
        pendingDaysEl.textContent = totalWorkingDays - completedDays;
    }

    selectDate(date) {
        console.log('=== SELECT DATE DEBUG ===');
        console.log('Switching to date:', date.toString());
        console.log('Previous selectedDate:', this.selectedDate?.toString());

        this.selectedDate = new Date(date);
        this.updateSelectedDateDisplay();
        this.loadActivityForDate();
        this.renderCalendar(); // Re-render to update active state
        this.updateButtonStates();
        this.saveScrollPosition();
    }

    updateSelectedDateDisplay() {
        const selectedDateEl = document.getElementById('selectedDate');
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        selectedDateEl.textContent = this.selectedDate.toLocaleDateString('en-US', options);
    }

    loadActivityForDate() {
        const dateKey = this.getDateKey(this.selectedDate);
        const textarea = document.getElementById('activityText');
        const activity = this.activities[dateKey] || '';

        console.log('=== LOAD ACTIVITY DEBUG ===');
        console.log('Loading for date:', this.selectedDate.toString());
        console.log('Date key:', dateKey);
        console.log('Activity found:', !!activity);
        console.log('Activity content:', activity.substring(0, 50) + (activity.length > 50 ? '...' : ''));
        console.log('Total stored activities:', Object.keys(this.activities).length);

        textarea.value = activity;
        textarea.disabled = false;
        this.updateCharacterCount();
    }

    saveActivity() {
        const dateKey = this.getDateKey(this.selectedDate);
        const textarea = document.getElementById('activityText');
        const activity = textarea.value.trim();

        console.log('=== SAVE ACTIVITY DEBUG ===');
        console.log('Selected date:', this.selectedDate.toString());
        console.log('Selected date ISO:', this.selectedDate.toISOString());
        console.log('Generated date key:', dateKey);
        console.log('Activity content:', activity.substring(0, 50) + (activity.length > 50 ? '...' : ''));
        console.log('Activity length:', activity.length);

        this.activities[dateKey] = activity;

        // Save to chrome storage
        chrome.storage.local.set({ activities: this.activities }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving activity:', chrome.runtime.lastError);
            } else {
                this.renderCalendar(); // Update calendar to show activity indicator and refresh summary
                this.showSaveFeedback();
            }
        });
    }

    clearActivity() {
        if (!confirm('Are you sure you want to clear this activity?')) return;

        const dateKey = this.getDateKey(this.selectedDate);
        delete this.activities[dateKey];

        // Save to chrome storage
        chrome.storage.local.set({ activities: this.activities }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error clearing activity:', chrome.runtime.lastError);
            } else {
                document.getElementById('activityText').value = '';
                this.updateCharacterCount();
                this.updateButtonStates();
                this.renderCalendar(); // Update calendar to remove activity indicator and refresh summary
            }
        });
    }

    async loadActivities() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['activities'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error loading activities:', chrome.runtime.lastError);
                } else {
                    this.activities = result.activities || {};
                    console.log('=== LOAD ACTIVITIES DEBUG ===');
                    console.log('Raw result from storage:', result);
                    console.log('Loaded activities count:', Object.keys(this.activities).length);
                    console.log('Loaded activity keys:', Object.keys(this.activities));

                    if (Object.keys(this.activities).length > 0) {
                        console.log('Sample activities:');
                        Object.entries(this.activities).slice(0, 3).forEach(([key, value]) => {
                            console.log(`  ${key}: "${value.substring(0, 30)}..."`);
                        });
                    }
                }
                resolve();
            });
        });
    }

    updateCharacterCount() {
        const textarea = document.getElementById('activityText');
        const charCount = document.getElementById('charCount');
        charCount.textContent = textarea.value.length;
    }

    updateButtonStates() {
        const textarea = document.getElementById('activityText');
        const saveBtn = document.getElementById('saveBtn');
        const clearBtn = document.getElementById('clearBtn');

        const hasContent = textarea.value.trim().length > 0;
        const dateKey = this.getDateKey(this.selectedDate);
        const hasExistingActivity = this.activities[dateKey] && this.activities[dateKey].trim();

        saveBtn.disabled = !hasContent;
        clearBtn.disabled = !hasExistingActivity && !hasContent;
    }

    exportToCSV() {
        const csvData = this.generateCSVData();
        if (!csvData) {
            alert('No activities to export.');
            return;
        }

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const monthName = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            link.setAttribute('href', url);
            link.setAttribute('download', `daily-activities-${monthName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    generateCSVData() {
        // Use the calendar's current month instead of today's month for export
        // This allows users to export any month they're viewing in the calendar
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

        console.log('=== CSV EXPORT DEBUG ===');
        console.log('Calendar current date:', this.currentDate.toString());
        console.log('Calendar month/year:', currentMonth + 1, currentYear);
        console.log('Month key to search:', currentMonthKey);
        console.log('Available activities count:', Object.keys(this.activities).length);
        console.log('Available activity keys:', Object.keys(this.activities));
this 
        // Debug: Show all activities with their content
        Object.entries(this.activities).forEach(([dateKey, activity]) => {
            console.log(`Activity ${dateKey}: "${activity?.substring(0, 50)}..." (length: ${activity?.length || 0})`);
            console.log(`  - Starts with ${currentMonthKey}: ${dateKey.startsWith(currentMonthKey)}`);
            console.log(`  - Has content: ${activity && activity.trim().length > 0}`);
        });

        // Also check what current selected date key should be
        const selectedDateKey = this.getDateKey(this.selectedDate);
        console.log('Selected date:', this.selectedDate.toString());
        console.log('Selected date key:', selectedDateKey);
        console.log('Has selected date activity:', !!this.activities[selectedDateKey]);
        console.log('Selected date activity content:', this.activities[selectedDateKey]?.substring(0, 50));

        // Check for any activities in current month
        const currentMonthActivities = Object.keys(this.activities).filter(key =>
            key.startsWith(currentMonthKey)
        );
        console.log('Activities in current month:', currentMonthActivities);
        console.log('Total activities in storage:', Object.keys(this.activities).length);
        console.log('All stored activity keys:', Object.keys(this.activities));

        // Check if there are any activities at all
        if (Object.keys(this.activities).length === 0) {
            console.log('❌ No activities stored at all!');
        } else {
            console.log('✅ Activities exist in storage');
        }

        const activities = Object.entries(this.activities)
            .filter(([dateKey, activity]) => {
                // Only include activities for current month and ensure activity exists
                const hasContent = activity && activity.trim().length > 0;
                const matchesMonth = dateKey.startsWith(currentMonthKey);
                const matches = hasContent && matchesMonth;
                console.log(`Date ${dateKey}: hasContent=${hasContent}, matchesMonth=${matchesMonth}, matches=${matches}`);
                return matches;
            })
            .map(([dateKey, activity]) => ({
                date: dateKey,
                activity: activity.replace(/"/g, '""') // Escape quotes for CSV
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        console.log('Filtered activities:', activities.length);

        if (activities.length === 0) {
            const monthName = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            alert(`No activities found for ${monthName}. Please add some activities and try again.`);
            return null;
        }

        const headers = 'Date,Activity\n';
        const rows = activities.map(item => `"${item.date}","${item.activity}"`).join('\n');

        return headers + rows;
    }

    saveScrollPosition() {
        this.scrollPosition = window.scrollY;
        chrome.storage.local.set({ scrollPosition: this.scrollPosition });
    }

    restoreScrollPosition() {
        chrome.storage.local.get(['scrollPosition'], (result) => {
            if (result.scrollPosition) {
                window.scrollTo(0, result.scrollPosition);
            }
        });
    }

    showSaveFeedback() {
        const saveBtn = document.getElementById('saveBtn');
        const originalHtml = saveBtn.innerHTML;
        const originalTitle = saveBtn.title;

        saveBtn.innerHTML = '✅';
        saveBtn.title = 'Saved successfully!';
        saveBtn.style.background = '#28a745';

        setTimeout(() => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.title = originalTitle;
            saveBtn.style.background = '';
        }, 1000);
    }

    // Notes methods
    async loadNotes() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['notes'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error loading notes:', chrome.runtime.lastError);
                } else {
                    this.notes = result.notes || [];
                }
                resolve();
            });
        });
    }

    // ERP Configuration methods
    async loadErpConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['erpUrl'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error loading ERP config:', chrome.runtime.lastError);
                } else {
                    this.erpUrl = result.erpUrl || '';
                    this.updateErpLink();
                }
                resolve();
            });
        });
    }

    saveErpUrl() {
        const erpUrlInput = document.getElementById('erpUrlInput');
        if (!erpUrlInput) return;

        const newUrl = erpUrlInput.value.trim();

        // Basic URL validation
        if (newUrl && !newUrl.match(/^https?:\/\/.+/)) {
            alert('Please enter a valid URL starting with http:// or https://');
            return;
        }

        this.erpUrl = newUrl;

        // Save to chrome storage
        chrome.storage.local.set({ erpUrl: this.erpUrl }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving ERP URL:', chrome.runtime.lastError);
                alert('Failed to save ERP URL. Please try again.');
            } else {
                this.updateErpLink();
                this.showToast('ERP URL saved successfully!');
                // Hide the config panel after saving
                this.toggleErpConfigPanel(false);
            }
        });
    }

    toggleErpConfigPanel(forceShow = null) {
        const configPanel = document.getElementById('erpConfigPanel');
        if (!configPanel) return;

        const isVisible = configPanel.style.display !== 'none';
        const shouldShow = forceShow !== null ? forceShow : !isVisible;

        configPanel.style.display = shouldShow ? 'block' : 'none';

        // If showing, focus the input field and pre-fill with current URL
        if (shouldShow) {
            const erpUrlInput = document.getElementById('erpUrlInput');
            if (erpUrlInput) {
                erpUrlInput.value = this.erpUrl || '';
                erpUrlInput.focus();
                erpUrlInput.select();
            }
        }
    }

    updateErpLink() {
        const erpLinkContainer = document.getElementById('erpLinkContainer');
        const erpLink = document.getElementById('erpLink');

        if (!erpLinkContainer || !erpLink) return;

        if (this.erpUrl) {
            erpLink.href = this.erpUrl;
            erpLinkContainer.style.display = 'block';
        } else {
            erpLinkContainer.style.display = 'none';
        }
    }

    saveNotes() {
        chrome.storage.local.set({ notes: this.notes }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving notes:', chrome.runtime.lastError);
            }
        });
    }

    addNote() {
        const now = new Date().toISOString();
        const newNote = {
            id: Date.now().toString(),
            title: `Note ${this.notes.length + 1}`,
            content: '',
            collapsed: false,
            created: now,
            modified: now
        };

        this.notes.unshift(newNote); // Add to beginning for newest first
        this.saveNotes();
        this.renderNotes();
    }

    deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        this.notes = this.notes.filter(note => note.id !== noteId);
        this.saveNotes();
        this.renderNotes();
    }

    updateNote(noteId, content, contentChanged = false) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.content = content;
            if (contentChanged) {
                note.modified = new Date().toISOString();
            }
            this.saveNotes();
        }
    }

    updateNoteTitle(noteId, newTitle, titleChanged = false) {
        const note = this.notes.find(n => n.id === noteId);
        if (note && newTitle.trim()) {
            note.title = newTitle.trim();
            if (titleChanged) {
                note.modified = new Date().toISOString();
            }
            this.saveNotes();
        } else if (note) {
            // Reset to original title if empty
            const titleInput = document.querySelector(`input[data-note-id="${noteId}"]`);
            if (titleInput) {
                titleInput.value = note.title;
            }
        }
    }

    toggleNoteCollapse(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.collapsed = !note.collapsed;
            this.saveNotes();
            this.renderNotes();
        }
    }

    // Apply bold formatting to selected text in notes
    applyBoldFormatting(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        if (selectedText.length > 0) {
            // Check if selected text is already bold
            const isBold = selectedText.startsWith('**') && selectedText.endsWith('**');

            let newText;
            if (isBold) {
                // Remove bold formatting
                newText = selectedText.substring(2, selectedText.length - 2);
            } else {
                // Add bold formatting
                newText = `**${selectedText}**`;
            }

            // Replace the selected text
            const beforeText = textarea.value.substring(0, start);
            const afterText = textarea.value.substring(end);
            textarea.value = beforeText + newText + afterText;

            // Update cursor position
            const newCursorPos = start + newText.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);

            // Trigger input event to save changes and update preview
            textarea.dispatchEvent(new Event('input'));
        } else {
            // No text selected, insert bold markers at cursor
            const cursorPos = textarea.selectionStart;
            const beforeText = textarea.value.substring(0, cursorPos);
            const afterText = textarea.value.substring(cursorPos);

            const boldText = '****';
            textarea.value = beforeText + boldText + afterText;

            // Position cursor between the markers
            const newCursorPos = cursorPos + 2;
            textarea.setSelectionRange(newCursorPos, newCursorPos);

            // Trigger input event
            textarea.dispatchEvent(new Event('input'));
        }
    }

    // Apply code block formatting to selected text (creates proper code blocks)
    applyCodeFormatting(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        if (selectedText.length > 0) {
            // Check if selected text is already in a code block
            const isAlreadyCodeBlock = selectedText.includes('```');

            let newText;
            if (isAlreadyCodeBlock) {
                // Remove code block formatting - try to extract just the code content
                const lines = selectedText.split('\n');
                const codeLines = lines.filter(line =>
                    !line.trim().startsWith('```')
                );
                newText = codeLines.join('\n').trim();
            } else {
                // Create a proper code block with triple backticks
                const lines = selectedText.split('\n');
                if (lines.length === 1) {
                    // Single line - wrap in simple code block
                    newText = `\`\`\`\n${selectedText}\n\`\`\``;
                } else {
                    // Multi-line - create proper code block
                    newText = `\`\`\`\n${selectedText}\n\`\`\``;
                }
            }

            // Replace the selected text with formatted text
            const beforeText = textarea.value.substring(0, start);
            const afterText = textarea.value.substring(end);
            textarea.value = beforeText + newText + afterText;

            // Update cursor position to inside the code block
            const newCursorPos = start + newText.length - 4; // Position before closing ```
            textarea.setSelectionRange(newCursorPos, newCursorPos);

            // Trigger the input event to save the changes
            textarea.dispatchEvent(new Event('input'));
        } else {
            // No text selected, insert an empty code block at cursor
            this.insertEmptyCodeBlock(textarea);
        }
    }

    // Insert an empty code block at cursor position
    insertEmptyCodeBlock(textarea) {
        const cursorPos = textarea.selectionStart;
        const beforeText = textarea.value.substring(0, cursorPos);
        const afterText = textarea.value.substring(cursorPos);

        const codeBlock = '\n```\n\n```\n';
        textarea.value = beforeText + codeBlock + afterText;

        // Position cursor inside the code block
        const newCursorPos = cursorPos + codeBlock.length - 5; // Position inside empty code block
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        // Trigger the input event to save the changes
        textarea.dispatchEvent(new Event('input'));
    }

    // Insert a code block at cursor position or after \code command
    insertCodeBlock(textarea, noteId) {
        const cursorPos = textarea.selectionStart;
        const text = textarea.value;

        // Find the position of \code
        const codeIndex = text.lastIndexOf('\\code');

        if (codeIndex !== -1) {
            // Remove \code and insert code block
            const beforeCode = text.substring(0, codeIndex);
            const afterCode = text.substring(codeIndex + 5); // 5 is length of \code

            // Create code block template
            const codeBlock = '\n```\n\n```\n';

            // Insert code block
            const newText = beforeCode + codeBlock + afterCode;
            textarea.value = newText;

            // Position cursor inside the code block
            const newCursorPos = beforeCode.length + codeBlock.length - 5; // Position inside empty code block
            textarea.setSelectionRange(newCursorPos, newCursorPos);

            // Trigger input event for auto-save
            textarea.dispatchEvent(new Event('input'));

            // Prevent default \code processing
            return;
        }
    }

    showToast(message) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    renderNotes() {
        const container = document.getElementById('notesContainer');
        container.innerHTML = '';

        this.notes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            container.appendChild(noteElement);
        });
    }

    createNoteElement(note) {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';

        const isCollapsed = note.collapsed || false;

        const modifiedDate = note.modified ? new Date(note.modified) : new Date(note.created);
        const formattedDate = this.formatDate(modifiedDate);

        noteItem.innerHTML = `
            <div class="note-header">
                <button class="note-collapse-btn" data-note-id="${note.id}" title="${isCollapsed ? 'Expand note' : 'Collapse note'}">
                    ${isCollapsed ? '▶️' : '🔽'}
                </button>
                <div class="note-title-section">
                    <input type="text" class="note-title-input" value="${note.title}" data-note-id="${note.id}" readonly>
                    <div class="note-modified-date">${formattedDate}</div>
                </div>
                <div class="note-actions">
                    <button class="note-edit-btn" data-note-id="${note.id}" title="Create code block from selected text (or insert empty block)">
                        💻
                    </button>
                    <button class="note-delete-btn" data-note-id="${note.id}" title="Delete note">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="note-content ${isCollapsed ? 'collapsed' : ''}" data-note-id="${note.id}">
                <textarea
                    class="note-textarea"
                    data-note-id="${note.id}"
                    placeholder="Enter your note here... Double-click preview to edit, type \code for code block"
                    rows="3"
                >${note.content}</textarea>

                <div class="note-preview show" data-note-id="${note.id}" style="min-height: ${note.content.trim() ? 'auto' : '60px'};">${this.renderMarkdown(note.content) || '<em style="color: #6c757d;">Click to start writing...</em>'}</div>
            </div>
        `;

        // Add event listeners
        const titleInput = noteItem.querySelector('.note-title-input');
        const textarea = noteItem.querySelector('.note-textarea');
        const editBtn = noteItem.querySelector('.note-edit-btn');
        const deleteBtn = noteItem.querySelector('.note-delete-btn');
        const collapseBtn = noteItem.querySelector('.note-collapse-btn');

        // Title editing functionality
        let isEditingTitle = false;

        titleInput.addEventListener('click', () => {
            if (!isEditingTitle) {
                isEditingTitle = true;
                titleInput.readOnly = false;
                titleInput.focus();
                titleInput.select();
                titleInput.classList.add('editing');
            }
        });

        titleInput.addEventListener('blur', () => {
            if (isEditingTitle) {
                isEditingTitle = false;
                titleInput.readOnly = true;
                titleInput.classList.remove('editing');
                this.updateNoteTitle(note.id, titleInput.value.trim(), true); // true = title changed
            }
        });

        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                titleInput.blur();
            } else if (e.key === 'Escape') {
                titleInput.value = note.title; // Reset to original
                titleInput.blur();
            }
        });

        // Collapse button functionality
        collapseBtn.addEventListener('click', () => {
            this.toggleNoteCollapse(note.id);
        });

        // Auto-resize functionality (fallback for browsers without field-sizing support)
        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        // Initial resize
        setTimeout(autoResize, 0);

        // Auto-save on input
        let autoSaveTimeout;
        textarea.addEventListener('input', (e) => {
            // Auto-resize
            autoResize();

            // Always update preview (always in styled mode)
            const preview = noteItem.querySelector('.note-preview');
            if (preview) {
                preview.innerHTML = this.renderMarkdown(e.target.value);
            }

            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                this.updateNote(note.id, e.target.value, true); // true = content changed
            }, 500);

            // Check for \code command
            if (e.target.value.includes('\\code')) {
                this.insertCodeBlock(e.target, note.id);
            }
        });

        // Add keydown event for Ctrl+B bold formatting
        textarea.addEventListener('keydown', (e) => {
            console.log('Textarea keydown:', e.key, e.keyCode, e.ctrlKey, e.metaKey, e.altKey);
            // Handle Ctrl+B for bold text (using keyCode for better compatibility)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B' || e.keyCode === 66 || e.keyCode === 98)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log('Ctrl+B detected, applying bold formatting');
                this.applyBoldFormatting(textarea);
                autoResize();
                return false;
            }
        });

        // Note: Ctrl+B is now handled globally in setupEventListeners()

        // Also prevent Ctrl+B on keyup to ensure browser doesn't interfere
        textarea.addEventListener('keyup', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B' || e.keyCode === 66 || e.keyCode === 98)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        editBtn.addEventListener('click', () => this.applyCodeFormatting(textarea));
        deleteBtn.addEventListener('click', () => this.deleteNote(note.id));
        collapseBtn.addEventListener('click', () => this.toggleNoteCollapse(note.id));

        // Add double-click handler to preview for editing
        const preview = noteItem.querySelector('.note-preview');
        preview.addEventListener('dblclick', () => {
            this.toggleEditMode(noteItem, note.id);
        });

        return noteItem;
    }

    // Toggle note collapse/expand
    toggleNoteCollapse(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        // Toggle collapsed state
        note.collapsed = !note.collapsed;

        // Save to storage
        this.saveNotes();

        // Update UI
        this.renderNotes();
    }

    // Format date for display
    formatDate(date) {
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInHours < 1) {
            const minutes = Math.floor(diffInMs / (1000 * 60));
            return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return hours === 1 ? '1h ago' : `${hours}h ago`;
        } else if (diffInDays < 7) {
            const days = Math.floor(diffInDays);
            return days === 1 ? '1d ago' : `${days}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    // Toggle between styled preview and raw text editing
    toggleEditMode(noteItem, noteId) {
        const textarea = noteItem.querySelector('.note-textarea');
        const preview = noteItem.querySelector('.note-preview');

        if (textarea.style.display === 'none' || textarea.style.display === '') {
            // Switch to edit mode - preserve preview height
            const previewHeight = Math.max(preview.offsetHeight, 60); // Minimum 60px
            textarea.style.display = 'block';
            textarea.style.height = previewHeight + 'px';
            textarea.style.minHeight = previewHeight + 'px';
            preview.style.display = 'none';
            textarea.focus();
        } else {
            // Switch to preview mode
            const textareaHeight = textarea.offsetHeight;
            textarea.style.display = 'none';
            preview.style.display = 'block';
            preview.style.minHeight = textareaHeight + 'px';
            preview.innerHTML = this.renderMarkdown(textarea.value);

            // Reset textarea height for next edit
            setTimeout(() => {
                textarea.style.height = 'auto';
                textarea.style.minHeight = '60px';
            }, 100);
        }
    }

    // No view switching needed - always in styled preview mode

    // Enhanced markdown renderer with Python syntax highlighting
    renderMarkdown(text) {
        if (!text) return '';

        let html = text;

        // Handle code blocks (```code```) with Python syntax highlighting
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            const highlightedCode = this.highlightPythonSyntax(code.trim());
            return `<pre><code>${highlightedCode}</code></pre>`;
        });

        // Handle inline code (`code`) with basic highlighting
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            const highlightedCode = this.highlightPythonSyntax(code);
            return `<code>${highlightedCode}</code>`;
        });

        // Handle bold text (**text**) - avoid processing inside code blocks
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Handle line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // Python syntax highlighting
    highlightPythonSyntax(code) {
        let html = this.escapeHtml(code);

        // Python keywords
        const keywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'import', 'from', 'return', 'yield', 'break', 'continue', 'pass', 'raise', 'assert', 'global', 'nonlocal', 'lambda', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False'];
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            html = html.replace(regex, `<span class="keyword">${keyword}</span>`);
        });

        // Strings (both single and double quotes)
        html = html.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$&</span>');

        // Numbers
        html = html.replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>');

        // Comments (starting with #)
        html = html.replace(/#.*$/gm, '<span class="comment">$&</span>');

        // Function definitions
        html = html.replace(/\b(def\s+)(\w+)/g, '$1<span class="function">$2</span>');

        return html;
    }

    // Escape HTML entities
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Debug method to check stored activities
    debugActivities() {
        console.log('=== ACTIVITIES DEBUG ===');
        console.log('Total activities:', Object.keys(this.activities).length);
        console.log('All activity keys:', Object.keys(this.activities));
        console.log('Current selected date:', this.selectedDate?.toString());
        console.log('Current calendar date:', this.currentDate?.toString());

        Object.entries(this.activities).forEach(([key, value]) => {
            const hasContent = value && value.trim().length > 0;
            console.log(`${key}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}" (hasContent: ${hasContent})`);
        });

        // Test month filtering
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        console.log('Current month key for filtering:', currentMonthKey);

        const monthActivities = Object.keys(this.activities).filter(key => key.startsWith(currentMonthKey));
        console.log('Activities in current month:', monthActivities);

        return this.activities;
    }

    // Helper methods
    getDateKey(date) {
        // Force Indian timezone (UTC+5:30) calculation for consistency
        const istOffset = 5.5 * 60; // IST is UTC+5:30
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const istDate = new Date(utc + (istOffset * 60000));

        const year = istDate.getFullYear();
        const month = String(istDate.getMonth() + 1).padStart(2, '0');
        const day = String(istDate.getDate()).padStart(2, '0');

        console.log(`Date conversion: ${date.toString()} -> IST: ${istDate.toString()} -> Key: ${year}-${month}-${day}`);
        return `${year}-${month}-${day}`;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isSelectedDate(date) {
        return date.toDateString() === this.selectedDate.toDateString();
    }
}

// Initialize the tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DailyActivityTracker();
});
