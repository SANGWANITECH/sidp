// Generate ECDSA P-256 key pair using Web Crypto API
export async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, // private key NOT extractable
      ['sign', 'verify']
    )
    return keyPair
  }
  
  // Export public key as JWK to send to server
  export async function exportPublicKey(publicKey) {
    const jwk = await window.crypto.subtle.exportKey('jwk', publicKey)
    return jwk
  }
  
  // Store private key in IndexedDB — survives page refresh
  export async function storePrivateKey(privateKey) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('sidp_keys', 1)
  
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('keys')
      }
  
      request.onsuccess = (e) => {
        const db = e.target.result
        const tx = db.transaction('keys', 'readwrite')
        tx.objectStore('keys').put(privateKey, 'device_private_key')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
  
      request.onerror = () => reject(request.error)
    })
  }
  
  // Retrieve private key from IndexedDB
  export async function getPrivateKey() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('sidp_keys', 1)
  
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('keys')
      }
  
      request.onsuccess = (e) => {
        const db = e.target.result
        const tx = db.transaction('keys', 'readonly')
        const req = tx.objectStore('keys').get('device_private_key')
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
      }
  
      request.onerror = () => reject(request.error)
    })
  }
  
  // Check if device has a registered key
  export async function hasRegisteredKey() {
    const key = await getPrivateKey()
    return key !== null
  }
  
  // Sign a transaction payload with stored private key
  export async function signPayload(payload) {
    const privateKey = await getPrivateKey()
    if (!privateKey) throw new Error('No registered device key found')
  
    // Must match backend exactly: sorted keys, no spaces
    const sortedKeys = Object.keys(payload).sort()
    const sortedPayload = {}
    sortedKeys.forEach(k => { sortedPayload[k] = payload[k] })
  
    // Produce compact JSON — no spaces after colons or commas
    const message = JSON.stringify(sortedPayload)
      .replace(/,\s*/g, ',')
      .replace(/:\s*/g, ':')
  
    const encoded = new TextEncoder().encode(message)
  
    const signature = await window.crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      privateKey,
      encoded
    )
  
    // Convert to base64url
    const bytes = new Uint8Array(signature)
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }