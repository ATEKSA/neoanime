const fs = require('fs');
const iconv = require('iconv-lite');

// Let's test on AnimeDetails.jsx
const content = fs.readFileSync('src/AnimeDetails.jsx', 'utf8');
// PowerShell read UTF-8 bytes as Windows-1251. 
// So the characters in `content` are what Windows-1251 thinks those bytes were.
// We encode the string back to Windows-1251 bytes to get the original UTF-8 bytes!
const originalBytes = iconv.encode(content, 'win1251');
const restoredString = originalBytes.toString('utf8');

console.log(restoredString.substring(0, 500));
// Let's check if it has normal russian characters
const match = restoredString.match(/[А-Яа-я]/);
if (match) {
    console.log("Restoration successful!");
    const files = [
        'src/AnimeDetails.jsx', 'src/Profile.jsx', 'src/Layout.jsx', 
        'src/WatchRoom.jsx', 'src/CollectionView.jsx', 'src/Collections.jsx',
        'src/Home.jsx', 'src/CustomPlayer.jsx', 'src/App.jsx', 'src/Lobbies.jsx', 'src/Catalog.jsx'
    ];
    for (const f of files) {
        if (!fs.existsSync(f)) continue;
        const text = fs.readFileSync(f, 'utf8');
        const bytes = iconv.encode(text, 'win1251');
        fs.writeFileSync(f, bytes.toString('utf8'), 'utf8');
    }
} else {
    console.log("Restoration failed or no russian chars");
}
