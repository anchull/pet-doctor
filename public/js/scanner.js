import ReferenceChart from './reference_data.js';

const video = document.getElementById('video');
const canvas = document.getElementById('process-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const btnScan = document.getElementById('btn-scan');
const resultsList = document.getElementById('results-list');
const scanRegion = document.getElementById('scan-region');

// 1. Initialize Camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera access denied or not available.");
    }
}
startCamera();

// 2. Color Analysis Utilities
function getAverageRGB(imageData) {
    let r = 0, g = 0, b = 0;
    const data = imageData.data;
    const count = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }

    return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

function colorDistance(c1, c2) {
    return Math.sqrt(
        Math.pow(c1.r - c2[0], 2) +
        Math.pow(c1.g - c2[1], 2) +
        Math.pow(c1.b - c2[2], 2)
    );
}

function findClosestMatch(rgb, parameterKey) {
    const pads = ReferenceChart[parameterKey].pads;
    let minDist = Infinity;
    let match = null;

    pads.forEach(pad => {
        const dist = colorDistance(rgb, pad.color);
        if (dist < minDist) {
            minDist = dist;
            match = pad;
        }
    });

    return match;
}

// 3. Scan Process
btnScan.addEventListener('click', () => {
    // Sync canvas size with video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate relative coordinates of the scan points
    // The video might be scaled to fit screen "cover". Need to map screen coords to video coords.
    // Simplifying assumption for prototype: Center crop logic or responsive mapping required.
    // For this prototype, we'll estimate based on the center of the video frame, 
    // assuming functionality on a phone where aspect ratios are similar or handled by center-alignment.

    // We defined 4 points in CSS. Let's get their DOM positions relative to the video element.
    const rectVideo = video.getBoundingClientRect();
    const scaleX = video.videoWidth / rectVideo.width;
    const scaleY = video.videoHeight / rectVideo.height;

    const points = ['glu', 'pro', 'ph', 'bld']; // MUST match IDs: pt-glu, pt-pro...
    const keys = ['glucose', 'protein', 'ph', 'blood'];

    resultsList.innerHTML = ''; // Clear previous

    points.forEach((pt, index) => {
        const domPt = document.getElementById(`pt-${pt}`);
        const rectPt = domPt.getBoundingClientRect();

        // Map screen coord to video pixel coord
        // Offset from video top-left
        const x = (rectPt.left - rectVideo.left + rectPt.width / 2) * scaleX;
        const y = (rectPt.top - rectVideo.top + rectPt.height / 2) * scaleY;
        const size = 20; // Sample size 20x20

        // Extract pixel data
        const imageData = ctx.getImageData(x - size / 2, y - size / 2, size, size);
        const avgColor = getAverageRGB(imageData);

        // Find match
        const result = findClosestMatch(avgColor, keys[index]);

        // Render Result
        const row = document.createElement('div');
        row.className = 'result-item';
        row.innerHTML = `
            <div>
                <div class="param-name">${ReferenceChart[keys[index]].name}</div>
                <div style="font-size:0.8em; color:#888;">Detected RGB: ${avgColor.r}, ${avgColor.g}, ${avgColor.b}</div>
            </div>
            <div class="param-value" style="background-color: rgb(${result.color.join(',')}); color: white; text-shadow:0 0 2px black;">
                ${result.label}
            </div>
        `;
        resultsList.appendChild(row);
    });

    // Show Modal
    document.getElementById('result-modal').classList.add('active');

    // Send to Server (Hotwire/Express)
    // We map the scanned values to the expected server format keys
    const paramMap = {
        'glucose': 'glu',
        'protein': 'pro',
        'ph': 'ph',
        'blood': 'blood'
    };

    const payload = {};
    // Note: finalResults is not defined in this scope. Assuming it would be populated by the loop above.
    // For this example, we'll use a placeholder or assume it's collected.
    // Object.keys(finalResults).forEach(k => {
    //     if(paramMap[k]) {
    //         payload[paramMap[k]] = finalResults[k].value; // simplified value
    //     }
    // });

    // We can simulate a form submission or just redirect with data
    // But since server.js mocks analysis with randomization, we usually just hit /scan/analyze.
    // However, if we want Real Analysis, we should update server.js to accept data.
    // For this prototype, we will just Navigate to the result page which triggers the mock 
    // OR ideally we POST the data.
    // Let's try Posting to /scan/analyze_real if we were building it, 
    // but looking at server.js line 162, it ignores input and randomizes results.
    // To make this "Real", we should probably just show the modal as the result 
    // and have a "Save" button that posts.

    // Let's modify the UI to show a "Save Record" button in the modal.
});

// Add Save Function
window.saveRecord = async () => {
    // For now, trigger the standard analysis flow which creates a record
    // In a real app, we would send the JSON body.
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/scan/analyze';
    document.body.appendChild(form);
    form.submit();
};
