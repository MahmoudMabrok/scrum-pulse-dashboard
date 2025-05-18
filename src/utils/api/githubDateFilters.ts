
export type DateFilter = 'all' | 'week' | 'two_weeks';

/**
 * Gets date query string for GitHub API based on filter selection
 */
export const getDateFilterQuery = (filter: DateFilter): string => {
  if (filter === 'all') return '';
  
  const now = new Date();
  let daysAgo = filter === 'week' ? 7 : 14; // 7 days for 'week', 14 for 'two_weeks'
  
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - daysAgo);
  
  // Format as YYYY-MM-DD for GitHub's query syntax
  const formattedDate = pastDate.toISOString().split('T')[0];
  
  return ` updated:>=${formattedDate}`;
};

/**
 * Checks if a date falls within the specified date range
 */
export const isDateInRange = (dateString: string, filter: DateFilter): boolean => {
  if (filter === 'all') return true;
  
  const date = new Date(dateString);
  const now = new Date();
  const daysAgo = filter === 'week' ? 7 : 14;
  
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - daysAgo);
  
  return date >= pastDate;
};
