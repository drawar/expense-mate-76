
/**
 * Utility function to safely handle string promises in file operations
 * @param callback Function to be executed with the resolved string
 * @param stringPromise Promise that resolves to a string
 */
export async function withResolvedStringPromise(
  callback: (resolvedString: string) => Promise<void>,
  stringPromise: Promise<string>
): Promise<void> {
  try {
    const resolvedString = await stringPromise;
    await callback(resolvedString);
  } catch (error) {
    console.error('Error resolving string promise:', error);
  }
}
