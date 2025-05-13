import JSZip from 'jszip';

/**
 * Extract release notes from ZIP archive
 * @param {ArrayBuffer} zipBuffer - ZIP file as ArrayBuffer
 * @returns {Promise<Array>} - Parsed release notes data
 */
export async function extractReleaseNotesFromZip(zipBuffer) {
    console.log("Extracting release notes from ZIP archive...");
    
    const zip = await JSZip.loadAsync(zipBuffer);
    
    // Find the release notes file (assuming it's named 'release-notes.md' or similar)
    const releaseNotesFile = Object.values(zip.files)[0];
    
    console.log(`Release notes file found: ${Object.values(zip.files)} ${releaseNotesFile ? releaseNotesFile.name : 'None'}`);


    if (!releaseNotesFile) {
      throw new Error("Release notes file not found in the artifact");
    }
    
    // Extract the content
    const content = await releaseNotesFile.async("string");
    
    console.log("Release notes content extracted");
    console.log(extractPRNumbers(content));
    
    // Parse the content based on your format (example for markdown table)
    return { prs: extractPRNumbers(content)};
  }


// add method to extract  PR numbers which are in the format of pulls/number
/**
 * PR Number Extractor
 * 
 * This script extracts all PR numbers from text that match the pattern "#[number]"
 * which is commonly used in git commit messages and PR references.
 */

export function extractPRNumbers(text) {
    // Regular expression to find PR numbers in the format #[number]
    const prRegex = /#\[(\d+)\]/g;
    
    // Array to store the extracted PR numbers
    const prNumbers = [];
    
    // Find all matches
    let match;
    while ((match = prRegex.exec(text)) !== null) {
      prNumbers.push(match[1]);
    }
    
    return prNumbers.join(', ');
  }