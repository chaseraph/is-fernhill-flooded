document.addEventListener('DOMContentLoaded', () => {
    // 1. Set the Date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // 2. Handle the "Flooded" Logic
    const statusText = document.getElementById('status-text');
    const statusImage = document.getElementById('status-image');

    if (CONFIG.isFlooded) {
        statusText.textContent = "YES";
        statusText.classList.add('yes');
        statusImage.src = "Fernhillisflooded.png"; // Your uploaded file name
        statusImage.alt = "Fern Hill Road is currently flooded";
    } else {
        statusText.textContent = "NO";
        statusText.classList.add('no');
        statusImage.src = "fernhillisnotflooded.jpg"; // Your uploaded file name
        statusImage.alt = "Fern Hill Road is currently dry";
    }

    // 3. Handle Traffic Cams
    function updateCams() {
        const timestamp = new Date().getTime(); // Cache buster

        // Only try to load if URL is provided in config
        if (CONFIG.cam1) document.getElementById('cam1').src = `${CONFIG.cam1}?t=${timestamp}`;
        if (CONFIG.cam2) document.getElementById('cam2').src = `${CONFIG.cam2}?t=${timestamp}`;
        if (CONFIG.cam3) document.getElementById('cam3').src = `${CONFIG.cam3}?t=${timestamp}`;
    }

    // Initial load
    updateCams();

    // Auto-refresh cams every 5 minutes (300,000 milliseconds)
    setInterval(updateCams, 300000);
});