const fs = require('fs');
const path = require('path');
const https = require('https');

async function listModels() {
    let apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const env = fs.readFileSync(envPath, 'utf8');
            const match = env.match(/GOOGLE_GENAI_API_KEY=([^\r\n]+)/);
            if (match) apiKey = match[1];
        }
    }

    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.models) {
                    console.log("Available Models:");
                    json.models.forEach(m => console.log(`- ${m.name}`));
                } else {
                    console.log("Response:", JSON.stringify(json, null, 2));
                }
            } catch (e) {
                console.error("Parse Error:", e.message);
                console.log("Raw Data:", data);
            }
        });
    }).on('error', (e) => {
        console.error("Request Error:", e.message);
    });
}

listModels();
