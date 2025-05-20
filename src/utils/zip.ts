
import JSZip from 'jszip';
import { PRInfo } from '@/utils/api/githubDataTypes';

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
    
    // Parse the content to extract PR info
    const prInfo = extractPRInfo(content);
    
    return { 
      prs: prInfo.map(pr => pr.number).join(', '),
      prDetails: prInfo
    };
  }


// Extract PR numbers and titles from text
export function extractPRInfo(text: string): PRInfo[] {
  // Regular expressions to find PR numbers and titles
  // Looking for patterns like #[123] PR Title Here or similar formats
  const prRegex = /#\[(\d+)\]\s*([^#\n]+)/g;
  
  // Array to store the extracted PR information
  const prInfo: PRInfo[] = [];
  
  // Find all matches
  let match;
  while ((match = prRegex.exec(text)) !== null) {
    prInfo.push({
      number: match[1],
      title: match[2].trim()
    });
  }
  
  return prInfo;
}

// Legacy function kept for compatibility
export function extractPRNumbers(text: string): string {
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
