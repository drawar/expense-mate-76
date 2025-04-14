
/**
 * Helper function to safely convert a Promise<string> to a Blob for use in file operations
 * @param stringPromise Promise that resolves to a string
 * @returns Promise that resolves to a Blob
 */
export async function stringPromiseToBlob(stringPromise: Promise<string>): Promise<Blob> {
  try {
    const content = await stringPromise;
    return new Blob([content], { type: 'text/plain' });
  } catch (error) {
    console.error('Error converting string promise to blob:', error);
    return new Blob([''], { type: 'text/plain' }); // Return empty blob on error
  }
}

/**
 * Helper to safely wait for a string promise and use it in a context requiring BlobPart
 * @param asyncOperation Function that returns the operation result when string is ready
 * @param stringPromise Promise that resolves to a string
 */
export async function withResolvedStringPromise<T>(
  asyncOperation: (content: BlobPart) => Promise<T>,
  stringPromise: Promise<string>
): Promise<T> {
  const blob = await stringPromiseToBlob(stringPromise);
  return asyncOperation(blob);
}
