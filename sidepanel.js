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

        // Check if we can inject scripts into this tab
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('edge://') || tab.url.startsWith('about:') ||
            tab.url.startsWith('file://') && !tab.url.endsWith('.html')) {
            showResult('Cannot analyze content on this type of page. Please navigate to a regular webpage.');
            return;
        }

        let result;
        try {
            const response = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => window.getSelection().toString()
            });
            result = response[0].result;
        } catch (scriptError) {
            // Handle cases where script injection fails
            showResult('Unable to access content on this page. Please try on a different webpage.');
            return;
        }

        if (!result || result.trim() === '') {
            showResult('Please select some text on the page first, then click the button.');
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
        // Show a temporary success message
        const btn = document.getElementById('saveNotesBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.backgroundColor = '#4CAF50';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    });

}

function showResult(content) {
    document.getElementById('results').innerHTML =
        `<div class="result-item">
                <div class="result-content" id="resultContent"></div>
            </div>`;
    animateContent('resultContent', content);
}

function showSuggestions(text) {
    const formattedContent = formatSuggestions(text);

    document.getElementById('results').innerHTML =
        `<div class="suggestions-container">
            <h3>Research Suggestions</h3>
            <div class="suggestions-content" id="suggestionsContent"></div>
            <button class="add-to-notes-btn" id="addToNotesBtn" style="opacity: 0; transition: opacity 0.5s;">Add to Notes</button>
        </div>`;

    // Animate the content instead of showing it immediately
    animateContent('suggestionsContent', formattedContent, () => {
        const btn = document.getElementById('addToNotesBtn');
        btn.style.opacity = '1';
        btn.addEventListener('click', () => {
            addSuggestionsToNotes(text);
        });
    });
}

function formatSuggestions(text) {
    // Split into lines for easier processing
    const lines = text.split('\n');
    let formatted = '';
    let inList = false;

    lines.forEach(line => {
        // Check if this line starts with a bullet point
        if (line.trim().startsWith('* ')) {
            if (!inList) {
                formatted += '<ul>';
                inList = true;
            }
            // Process the bullet point content
            let listContent = line.trim().substring(2);
            // Replace bold text within bullets with sub-header styling
            listContent = listContent.replace(/\*\*(.*?)\*\*/g, '<span class="sub-header">$1</span>');
            formatted += `<li>${listContent}</li>`;
        } else {
            // Not a bullet point
            if (inList) {
                formatted += '</ul>';
                inList = false;
            }

            // Check if entire line is bold (main header)
            if (line.trim().match(/^\*\*.*\*\*$/)) {
                formatted += line.replace(/\*\*(.*)\*\*/, '<h4>$1</h4>');
            } else if (line.trim()) {
                // Regular text line
                formatted += `<p>${line}</p>`;
            }
        }
    });

    // Close any open list
    if (inList) {
        formatted += '</ul>';
    }

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

function animateContent(elementId, content, callback) {
    const element = document.getElementById(elementId);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const nodes = Array.from(tempDiv.childNodes);
    let currentIndex = 0;

    function showNextNode() {
        if (currentIndex < nodes.length) {
            const node = nodes[currentIndex].cloneNode(true);

            if (node.nodeType === Node.ELEMENT_NODE) {
                node.style.opacity = '0';
                element.appendChild(node);

                setTimeout(() => {
                    node.style.transition = 'opacity 0.3s ease-in';
                    node.style.opacity = '1';
                }, 10);

                currentIndex++;
                setTimeout(showNextNode, 150);
            } else {
                element.appendChild(node);
                currentIndex++;
                showNextNode();
            }
        } else if (callback) {
            callback();
        }
    }

    showNextNode();
}