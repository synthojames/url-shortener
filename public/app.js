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

    //set url equal to the input value
    const url = urlInput.value.trim();
    //validate url for null
    if(!url){
        alert('Enter a URL');
        return;
    }

    try{
        //shorten the url using api call
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
        //set data equal to the json reply from the function
        const data = await response.json();
        console.log('API returned', data);
        //insert the new url and unhide the box
        shortUrlOutput.value = data.shortUrl;
        resultDiv.classList.remove('hidden');
        //reset the input for a new entry
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
        //copy the shortUrl to clipboard
        await navigator.clipboard.writeText(shortUrl);
        console.log('Copied to clipboard');
        //change the button to say copied briefly for the user
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

//Creates ONE url object to be shown.
function createUrlElement(url) {
    const div = document.createElement('div');
    div.className = 'url-item';

    div.innerHTML = `
        <div class="url-info" data-code="${url.shortCode}">
            <div class="short-code">www.shorten.syntho.moe/${url.shortCode}</div>
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
//load a list of all the URLS
async function loadUrls() {
    try{
        urlsList.innerHTML = '<p class="loading">Loading</p>';
        //fetch all urls from the api
        const response = await fetch('/api/urls');
        if(!response.ok){
            throw new Error('Failed to load URLS');
        }
        //save the replies in data variable
        const data = await response.json();
        //if there is no urls, show an empty box
        if(data.urls.length === 0) {
            urlsList.innerHTML = `
                <div class="empty">
                    <p>No URLs yet!</p>
                    <p>Make some to get started!</p>
                </div>
            `;
            return;
        }
        //for each url in the list, call the previous functio to create url html elements and append them
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

//call function showStats when stats button is clicked, call function deleteURl if delete button is clicked
urlsList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('stats-btn')) {
        const shortCode = event.target.dataset.code;
        await showStats(shortCode);
    }
    else if (event.target.classList.contains('delete-btn')){
        const shortCode = event.target.dataset.code;
        await deleteUrl(shortCode);
    }    
    else if(event.target.classList.contains('url-item') && !event.target.classList.contains('stats-btn') && !event.target.classList.contains('delete-btn')){
        const shortCode = event.target.dataset.code;
        await navigator.clipboard.writeText(`https://www.shorten.syntho.moe/${shortCode}`);
        
        const originalHTML = event.target.innerHTML;
        event.target.innerHTML = `<div>Copied!</div>`;

        setTimeout(() => {
            event.target.innerHTML = originalHTML;
        }, 1000);
    }
});

//the actual showStats function
async function showStats(shortCode) {
    try{
        statsContent.innerHTML = '<p class="loading">Loading</p>';
        statsModal.classList.remove('hidden');
        //fetch the stats using the api
        const response = await fetch(`/api/stats/${shortCode}`);
        if(!response.ok){
            throw new Error('Failed to load stats');
        }
        //assign data the json reply from the api
        const data = await response.json();
        //call displayStats function using returned data
        displayStats(data);
    } catch (error) {
        console.error('Error loading stats:', error);
        statsContent.innerHTML = '<p class="error">Failed to load</p>';
    }
}

//creates the HTML to be displayed when stats button is clicked and the data is fetched
function displayStats(data) {
    statsContent.innerHTML = `
        <div class="stat-item">
            <h3>URL Information</h3>
            <p><strong>Shortened URL:</strong> www.shorten.syntho.moe/${data.shortCode}</p>
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

//function that will deleteUrl
async function deleteUrl(shortCode){
    const confirmed = confirm(`Are you sure you want to delete ${shortCode}?`);
    if (!confirmed) {
        return;
    }
    try{
        //use the api method 'delete' to get rid of the shortened url
        const response = await fetch(`/api/urls/${shortCode}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete');
        }
        //receive the confirmation or failure
        const data = await response.json();
        console.log('Deleted:', data);

        //reload the loadUrls to show its deletion
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