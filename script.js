async function saveAllAccountsToCloud() {
    localStorage.setItem('neon_franky_accounts_cache', JSON.stringify(VALID_ACCOUNTS));
    updateQuotaBadge();

    if (isJsonBinConfigured()) {
        try {
            const payload = {};
            VALID_ACCOUNTS.forEach(a => {
                payload[a.username] = {
                    password: a.password,
                    remainingTokens: a.remainingTokens
                };
            });

            await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(payload)
            });
        } catch (e) {}
    }
}

async function syncAccountsFromServer() {
    if (isJsonBinConfigured()) {
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data === 'object') {
                    const updatedList = [];
                    Object.keys(data).forEach(username => {
                        const val = data[username];
                        const fallback = VALID_ACCOUNTS.find(a => a.username === username);
                        if (typeof val === 'number') {
                            updatedList.push({
                                username,
                                password: fallback ? fallback.password : '123',
                                remainingTokens: val
                            });
                        } else if (val && typeof val === 'object') {
                            updatedList.push({
                                username,
                                password: val.password || (fallback ? fallback.password : '123'),
                                remainingTokens: typeof val.remainingTokens === 'number' ? val.remainingTokens : 400000
                            });
                        }
                    });
                    if (updatedList.length > 0) {
                        VALID_ACCOUNTS = updatedList;
                    }
                    localStorage.setItem('neon_franky_accounts_cache', JSON.stringify(VALID_ACCOUNTS));
                    updateQuotaBadge();
                    return;
                }
            }
        } catch (e) {}
    }

    const cached = localStorage.getItem('neon_franky_accounts_cache');
    if (cached) VALID_ACCOUNTS = JSON.parse(cached);
    updateQuotaBadge();
}