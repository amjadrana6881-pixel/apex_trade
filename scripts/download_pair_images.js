const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  {
    filenames: ['Gold.jpg', 'gold.jpg'],
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80' // Gold bars
  },
  {
    filenames: ['Silver.jpg', 'silver.jpg'],
    url: 'https://images.unsplash.com/photo-1624365168968-f283a546c6b6?auto=format&fit=crop&w=600&q=80' // Silver bars
  },
  {
    filenames: ['Oil.jpg', 'oil.jpg', 'usoil.jpg'],
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' // Oil refinery / barrels
  },
  {
    filenames: ['gas.jpg', 'Gas.jpg', 'GAS.jpg'],
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80' // Gas burner blue flames
  },
  {
    filenames: ['eurusd.jpg', 'EURUSD.jpg'],
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80' // Stock/forex chart Euro
  },
  {
    filenames: ['usdjpy.jpg', 'USDJPY.jpg'],
    url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80' // Currency exchange USD/JPY
  },
  {
    filenames: ['gbpjpy.jpg', 'GBPJPY.jpg'],
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80' // Forex trading chart
  },
  {
    filenames: ['AUDNZD.jpg', 'audnzd.jpg'],
    url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80' // Forex currency
  },
  {
    filenames: ['Bitcoin.jpg', 'bitcoin.jpg', 'BTCUSDT.jpg', 'btcusdt.jpg'],
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80' // Bitcoin / crypto circuit
  },
  {
    filenames: ['ethereum.jpg', 'Ethereum.jpg', 'ETHUSDT.jpg', 'ethusdt.jpg'],
    url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=600&q=80' // Ethereum neon 3d
  },
  {
    filenames: ['SOLANA.jpg', 'solana.jpg', 'SOLUSDT.jpg', 'solusdt.jpg'],
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80' // Solana crypto gradient
  },
  {
    filenames: ['xrp.jpg', 'XRP.jpg', 'XRPUSDT.jpg', 'xrpusdt.jpg'],
    url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80' // Ripple XRP digital currency
  },
  {
    filenames: ['apple.jpg', 'Apple.jpg', 'AAPL.jpg', 'aapl.jpg'],
    url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80' // Apple device
  },
  {
    filenames: ['TESLA.jpg', 'tesla.jpg', 'TSLA.jpg', 'tsla.jpg'],
    url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=80' // Tesla vehicle
  },
  {
    filenames: ['google.jpg', 'Google.jpg', 'GOOG.jpg', 'goog.jpg'],
    url: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=600&q=80' // Google tech
  },
  {
    filenames: ['facebook.jpg', 'Facebook.jpg', 'META.jpg', 'meta.jpg'],
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' // Meta futuristic network
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Follow redirect
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading pair background images...');
  for (const item of images) {
    const primaryFile = path.join(targetDir, item.filenames[0]);
    try {
      console.log(`Downloading ${item.filenames[0]}...`);
      await download(item.url, primaryFile);
      // Copy to aliases
      for (let i = 1; i < item.filenames.length; i++) {
        const aliasFile = path.join(targetDir, item.filenames[i]);
        fs.copyFileSync(primaryFile, aliasFile);
      }
      console.log(`Saved ${item.filenames.join(', ')}`);
    } catch (err) {
      console.error(`Error downloading ${item.filenames[0]}:`, err.message);
    }
  }
  console.log('All pair images downloaded successfully!');
}

main();
