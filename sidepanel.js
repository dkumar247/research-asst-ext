document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['researchNotes'], function (result) {
        // Fix: Handle undefined on first load in text area by using empty string as default
        document.getElementById('notes').value = result.researchNotes || '';
    });

    document.getElementById('summarizeBtn').addEventListener('click', () => processContent('summarize'));
    document.getElementById('suggestBtn').addEventListener('click', () => processContent('suggest'));
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
});

async function processContent(operation) {
    try {
        // Show loading state
        showResult(`<div class="loading">Processing ${operation}...</div>`);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('Please select some text first');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: operation })
        });

        console.log('Executed fetch call', response);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();

        // Format the response based on operation type
        if (operation === 'suggest') {
            showSuggestions(text);
        } else {
            showResult(text.replace(/\n/g, '<br>'));
        }

    } catch (error) {
        showResult('Error: ' + error.message);
    }
}

async function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes }, function () {
        alert('Notes saved succesfully.');
    });
}

function showResult(content) {
    document.getElementById('results').innerHTML =
        `<div class="result-item">
            <div class="result-content">${content}</div>
        </div>`
}

function showSuggestions(text) {
    const formattedContent = formatSuggestions(text);

    document.getElementById('results').innerHTML =
        `<div class="suggestions-container">
            <h3>Research Suggestions</h3>
            <div class="suggestions-content">${formattedContent}</div>
            <button class="add-to-notes-btn" id="addToNotesBtn">Add to Notes</button>
        </div>`;

    document.getElementById('addToNotesBtn').addEventListener('click', () => {
        addSuggestionsToNotes(text);
    });
}

function formatSuggestions(text) {
    // Convert bullet points and headings to HTML
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\* (.*?)(?=\n|$)/g, '<li>$1</li>') // Bullet points
        .replace(/\n\n/g, '</ul><ul>') // Group bullet points
        .replace(/^/, '<ul>')
        .replace(/$/, '</ul>')
        .replace(/<ul><\/ul>/g, '') // Remove empty ul tags
        .replace(/\n(?!<)/g, '<br>'); // Line breaks for non-list items

    return formatted;
}

function addSuggestionsToNotes() {
    const suggestions = document.querySelector('.suggestions-content').innerText;
    const currentNotes = document.getElementById('notes').value;
    const separator = currentNotes ? '\n\n---\n\n' : '';
    const timestamp = new Date().toLocaleString();

    document.getElementById('notes').value =
        currentNotes + separator +
        `[Suggestions - ${timestamp}]\n${suggestions}`;

    saveNotes();
    // Scroll to bottom of textarea to show new content
    const textarea = document.getElementById('notes');
    textarea.scrollTop = textarea.scrollHeight;
}