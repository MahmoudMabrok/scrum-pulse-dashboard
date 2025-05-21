
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
  // Updated regex to match patterns like "- chore: [Manual PR] rc/beta-2.2.0 to master 19/05/2025 (#[11696])"
  // The regex now captures the entire line text as the title and the PR number in the format #[number]

  // split by more than one space
  const texts = text.split(/\s{2,}/);

  // Array to store the extracted PR information
  const prInfo: PRInfo[] = [];

  // loop on texts and print text until find "(#[number])" then print number
  texts.forEach((text) => {
    console.log(`Processing text: ${text}`);
    const data = text.split(" (#[");
    if (data.length == 2) {
      const title = data[0].replace('- ', '').trim();
      const end = data[1].indexOf(']');
      const prNumber = data[1].slice(0, end);
      prInfo.push({
        number: prNumber,
        title: title
      });
    }
  });

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
