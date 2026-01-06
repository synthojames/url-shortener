// Get form and input elements
const shortenForm = document.getElementById('shortenForm');
const urlInput = document.getElementById('urlInput');
const resultDiv = document.getElementById('result');
const shortUrlOutput = document.getElementById('shortUrlOutput');
const copyBtn = document.getElementById('copyBtn');
const urlsList = document.getElementById('urlsList');
const refreshBtn = document.getElementById('refreshBtn');
const statsModal = document.getElementById('statsModal');
const statsContent = document.getElementById('statsContent');
const closeModal = document.querySelector('.close');

//run when url is submitted
shortenForm.addEventListener('submit', async (event) =>{
    event.preventDefault();

    const url = urlInput.value.trim();
    if(!url){
        alert('Enter a URL');
        return;
    }

    try{
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({url:url})
        });
        if(!response.ok){
            throw new Error('Failed to shorten URL');
        }
        const data = await response.json();
        console.log('API returned', data);
        shortUrlOutput.value = data.shortUrl;
        resultDiv.classList.remove('hidden');
        urlInput.value='';
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to shorten URL. Try again later.');
    }
});

//copy text
copyBtn.addEventListener('click', async () => {
    const shortUrl = shortUrlOutput.value;
    try{
        await navigator.clipboard.writeText(shortUrl);
        console.log('Copied to clipboard');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#48BB78';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);

    } catch (error) {
        console.error('Copy Failed:', error);
        alert('Failed to copy. Try to copy manually');
    }
});

//load and display all urls

function createUrlElement(url) {
    const div = document.createElement('div');
    div.className = 'url-item';

    div.innerHTML = `
        <div class="url-info">
            <div class="short-code">${url.shortCode}</div>
            <div class="original-url">${url.originalUrl}</div>
            <div class="meta">
                Created: ${new Date(url.createdAt).toLocaleDateString()} |
                Clicks: ${url.clickCount}
            </div>
        </div>
        <div class="url-actions">
            <button class="stats-btn" data-code="${url.shortCode}">Stats</button>
            <button class="delete-btn" data-code="${url.shortCode}">Delete</button>
        </div>
    `;
    return div;
}

async function loadUrls() {
    try{
        urlsList.innerHTML = '<p class="loading">Loading</p>';
        const response = await fetch('/api/urls');
        if(!response.ok){
            throw new Error('Failed to load URLS');
        }
        const data = await response.json();
        if(data.urls.length === 0) {
            urlsList.innerHTML = `
                <div class="empty">
                    <p>No URLs yet!</p>
                    <p>Make some to get started!</p>
                </div>
            `;
            return;
        }
        urlsList.innerHTML = '';
        data.urls.forEach(url => {
            const urlItem = createUrlElement(url);
            urlsList.appendChild(urlItem);
        });

    } catch(error) {
        console.error('Error loading URLS:', error);
        urlsList.innerHTML = '<p class="error">Failed to load URLs.</p>';
    }
}

//Stats button
urlsList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('stats-btn')) {
        const shortCode = event.target.dataset.code;
        await showStats(shortCode);
    }
    else if (event.target.classList.contains('delete-btn')){
        const shortCode = event.target.dataset.code;
        await deleteUrl(shortCode);
    }
});

async function showStats(shortCode) {
    try{
        statsContent.innerHTML = '<p class="loading">Loading</p>';
        statsModal.classList.remove('hidden');
        const response = await fetch(`/api/stats/${shortCode}`);
        if(!response.ok){
            throw new Error('Failed to load stats');
        }
        const data = await response.json();
        displayStats(data);
    } catch (error) {
        console.error('Error loading stats:', error);
        statsContent.innerHTML = '<p class="error">Failed to load</p>';
    }
}

function displayStats(data) {
    statsContent.innerHTML = `
        <div class="stat-item">
            <h3>URL Information</h3>
            <p><strong>Short Code:</strong> ${data.shortCode}</p>
            <p><strong>Original URL:</strong> ${data.originalUrl}</p>
            <p><strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
        </div>

        <div class="stat-item">
                <h3>Click Statistics</h3>
                <p><strong>Total Clicks:</strong> ${data.totalClicks}</p>
            </div>
            
        <div class="stat-item">
            <h3>Recent Clicks</h3>
            ${data.recentClicks.length > 0 
                ? data.recentClicks.map(click => `
                    <p>
                        ${new Date(click.timestamp).toLocaleString()} - 
                        ${click.ip}
                    </p>
                `).join('')
                : '<p>No clicks yet</p>'
            }
        </div>
        
        <div class="stat-item">
            <h3>Browser Statistics</h3>
            ${data.browserStats.length > 0
                ? data.browserStats.map(stat => `
                    <p>
                        <strong>${stat.count} clicks</strong> - 
                        ${stat._id.substring(0, 50)}...
                    </p>
                `).join('')
                : '<p>No data yet</p>'
            }
        </div>
    `;
}

async function deleteUrl(shortCode){
    const confirmed = confirm(`Are you sure you want to delete ${shortCode}?`);
    if (!confirmed) {
        return;
    }
    try{
        const response = await fetch(`/api/urls/${shortCode}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete');
        }
        const data = await response.json();
        console.log('Deleted:', data);

        await loadUrls();

        alert('URL Deleted');
    } catch (error){
        console.error('Error:', error);
        alert('Failed to delete URL. Try again');
    }
}

//Close the box when done
closeModal.addEventListener('click', () => {
    statsModal.classList.add('hidden');
});

// Close modal when clicking outside
statsModal.addEventListener('click', (event) => {
    if (event.target === statsModal) {
        statsModal.classList.add('hidden');
    }
});

// Load URLS when page loads
loadUrls();

//Referesh button
refreshBtn.addEventListener('click', () => {
    loadUrls();
});