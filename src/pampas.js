const createFile = async (name) => {
    const response = await fetch('http://127.0.0.1:6969/files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    })

    if (!response.ok) {
        throw new Error('Failed to create a file: ' + response.status)
    }

    const json = await response.json()

    return json.data
}

const getFileSecret = async (url, token) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to get the file: ' + response.status)
    }

    const json = await response.json()

    return json.data.secret
}

const destroyFile = async (url, token) => {
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to destroy the file: ' + response.status)
    }
}

const encryptFile = (text, masterKey, url, token) => {
    // @todo encrypt file using master key. Include temporary url and token.
    // Example of an encrypted file
    // {
    //      "content": "sadi(AS98jAS89dA)S#-=",
    //      "url": "http://127.0.0.1:6969/files/123"
    //      "token": "asdasdasd.123sadasd.asdasdaskdoi=="
    // }
    return {
        content: text,
        url,
        token
    }
}

const decryptFile = (text, masterKey, secret) => {
    // @todo decrypt file using master key and secret
    return text
}

async function main() {
    /**
     * Encryption
     */

    // Generate a temporary url that holds a secret value required by pampas to decrypt the fiel contents.
    // The response contains a url and a token. A token can be invalidated so the link
    // will die forever and as a result the file will be lost forever.
    const file = await createFile('Germany.txt')
    console.log('file', file)

    // Apply encryption logic
    const encrypted = encryptFile(
        "Adolf Hitler is still alive, he is in a bunker...",
        // Master key is used together with the temp URLs, so the file can't be decrypted if someone steals the token.
        "OKABE_MASTER_KEY",
        file.url,
        file.token
    )
    console.log('encrypted', encrypted)

    /**
     * Decryption
     */

    // Load file secret first
    const secret = await getFileSecret(encrypted.url, encrypted.token)
    console.log('secret', secret)

    // Decrypt file contents
    const decrypted = decryptFile(
        encrypted.content,
        "OKABE_MASTER_KEY",
        secret
    )

    // Hurray!
    console.log('decrypted', decrypted)

    /**
     * Destroy file link if needed
     */
    // Try to retrieve secret before destroying the resource
    console.log('Trying to get secret #1...')
    await getFileSecret(encrypted.url, encrypted.token)
    console.log('Got secret #1')

    await destroyFile(encrypted.url, encrypted.token)
    console.log('destroyed')

    // Try to retrieve secret for the destroyed resource
    console.log('Trying to get secret #2...')
    await getFileSecret(encrypted.url, encrypted.token)

    // Oops! Can't reach. Failed with 403.
    console.log('Got secret #2')
}

main()
    .then(() => { process.exit() })
    .catch((error) => { console.error(error); process.exit(1) })