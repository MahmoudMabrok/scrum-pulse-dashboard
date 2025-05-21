
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
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Split the text by newlines to process each line
  const lines = text.split('\n');
  const prInfo: PRInfo[] = [];

  // Process each line to extract PR information
  for (const line of lines) {
    // Match pattern like: "- chore: [Manual PR] rc/beta-2.2.0 to master 19/05/2025 (#[11696])"
    const match = line.match(/^-\s+(.*?)\s+\(#\[(\d+)\]\)$/);
    
    if (match) {
      const title = match[1].trim();
      const number = match[2];
      
      prInfo.push({
        number,
        title
      });
    }
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
