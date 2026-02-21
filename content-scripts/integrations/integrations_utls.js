export function selectAllAsText() {
    const selection = window.getSelection();
    const range = document.createRange();

    // 1. Target the entire body
    range.selectNodeContents(document.body);

    // 2. Apply the selection
    selection.removeAllRanges();
    selection.addRange(range);

    const pageText = selection.toString();

    // 3. Cleanup
    selection.removeAllRanges();

    return pageText;
}

// compression can be brotli, gzip etc.
export async function compressAndBase64(text, compression) {
    try {
        // 1. Convert text to bytes
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        const stream = new Blob([bytes]).stream();

        // 2. Use the native compression Note that brotli is only available starting Firefox 147
        const compressionStream = new CompressionStream(compression);
        const compressedStream = stream.pipeThrough(compressionStream);

        // 3. Collect chunks into an array
        const chunks = [];
        const reader = compressedStream.getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        // 4. Combine chunks into a single Uint8Array
        const compressedBlob = new Blob(chunks);
        const arrayBuffer = await compressedBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // 5. Convert Uint8Array to Base64
        // We use a loop to avoid "Maximum call stack size exceeded" on large data
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        const base64String = btoa(binary);

        console.debug(`Compression to ${compression} + base64 Successfull!`);

        return base64String;

    } catch (err) {
        console.error("Compression error (Check if your broser support the chosen compression", err);
    }
}

/**
 * Mimics Ctrl+A + Ctrl+C behavior for the entire document.
 * Returns true if successful, false otherwise.
 */
export function copyRenderedPageToClipboard() {
    try {
        const selection = window.getSelection();
        const range = document.createRange();

        // 1. Target the entire body
        range.selectNodeContents(document.body);

        // 2. Apply the selection
        selection.removeAllRanges();
        selection.addRange(range);

        // 3. Execute Copy
        // Note: execCommand is technically deprecated but remains the only 
        // reliable way to copy "Rich Text" (formatted content) across all browsers.
        const success = document.execCommand('copy');

        // 4. Clean up (removes the blue highlight from the UI)
        selection.removeAllRanges();

        return success;
    } catch (err) {
        console.error('Failed to copy page content to clipboard:', err);
        return false;
    }
}