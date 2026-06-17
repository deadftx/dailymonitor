import fs from 'fs';
import path from 'path';

const TOKEN = process.env.GH_TOKEN;
const OWNER = 'deadftx';
const REPO = 'dailymonitor';
const TAG = 'v2.0.1';

async function request(method, url, body, isUpload = false) {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (body && !isUpload) headers['Content-Type'] = 'application/json';
    if (isUpload) headers['Content-Type'] = 'application/octet-stream';

    const options = { method, headers };
    if (body) options.body = isUpload ? body : JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
        let text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    if (method !== 'DELETE') return res.json();
}

async function run() {
    console.log('Fetching releases...');
    const releases = await request('GET', `https://api.github.com/repos/${OWNER}/${REPO}/releases`);
    
    for (const r of releases) {
        if (r.tag_name === TAG || r.name === TAG) {
            console.log(`Deleting existing release ${r.id}...`);
            await request('DELETE', `https://api.github.com/repos/${OWNER}/${REPO}/releases/${r.id}`);
        }
    }

    console.log(`Creating new release for ${TAG}...`);
    const release = await request('POST', `https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
        tag_name: TAG,
        name: TAG,
        draft: false,
        prerelease: false,
        generate_release_notes: true
    });

    const files = ['DailyMonitorLauncher.exe', 'DailyMonitorLauncher.exe.blockmap', 'latest.yml'];
    
    for (const file of files) {
        const filePath = path.join(process.cwd(), 'dist', file);
        if (fs.existsSync(filePath)) {
            console.log(`Uploading ${file}...`);
            const stat = fs.statSync(filePath);
            const stream = fs.createReadStream(filePath);
            
            const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(file)}`);
            
            const res = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': stat.size
                },
                body: stream,
                duplex: 'half'
            });
            
            if (!res.ok) {
                console.error(`Failed to upload ${file}: ${await res.text()}`);
            } else {
                console.log(`Uploaded ${file}!`);
            }
        } else {
            console.warn(`File not found: ${filePath}`);
        }
    }
    console.log('All done!');
}

run().catch(console.error);
