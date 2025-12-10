const SHEET_ID = '1AOGXNkuKCz4udYDyqvpyJSGpxi_Ro6WVwI2sV_RCTho';
const GID = '862163295';

export interface SheetRow {
  rowIndex: number;
  data: string[];
}

export interface SheetData {
  headers: string[];
  rows: SheetRow[];
}

export const fetchSheetData = async (userEmail?: string): Promise<SheetData> => {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch sheet data');
  }
  
  const csvText = await response.text();
  const lines = parseCSV(csvText);
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const headers = lines[0];
  let rows: SheetRow[] = lines.slice(1).map((data, index) => ({
    rowIndex: index + 2, // Row 1 is headers, so data starts at row 2
    data
  }));
  
  // Filter rows to only show those matching the user's email
  if (userEmail) {
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    rows = rows.filter(row => {
      const rowEmail = row.data[0]?.toLowerCase().trim();
      return rowEmail === normalizedUserEmail;
    });
  }
  
  return { headers, rows };
};

// Parse CSV properly handling quoted fields
const parseCSV = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        if (currentRow.some(field => field.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r') i++; // Skip \n after \r
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  
  // Don't forget the last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(field => field.trim() !== '')) {
      rows.push(currentRow);
    }
  }
  
  return rows;
};

export const canEditRow = (row: SheetRow, userEmail: string): boolean => {
  // Column A (index 0) contains the email
  const rowEmail = row.data[0]?.toLowerCase().trim();
  return rowEmail === userEmail.toLowerCase().trim();
};