/**
 * Google Apps Script for Hiring Funnel Simulator
 * 
 * This script provides a web app endpoint to fetch data from Google Sheets
 * and return it as JSON with proper CORS headers.
 * 
 * Deployment Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Replace the default code with this file
 * 4. Save the project
 * 5. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Choose "Web app" as type
 *    - Set "Execute as" to "Me"
 *    - Set "Who has access" to "Anyone"
 *    - Click "Deploy"
 * 6. Copy the web app URL and update the fetch URL in App.tsx
 */

function doGet(e) {
  try {
    // Get parameters
    const sheetId = e.parameter.sheetId || '1Le7Ie7z3Na_VWa_cNwtwpbHwilBxSip2wddOORpFv6s';
    const tabName = e.parameter.tab || 'Inputs';
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName(tabName);
    
    if (!sheet) {
      return createErrorResponse(`Sheet "${tabName}" not found`, 404);
    }
    
    // Get data range
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length < 2) {
      return createErrorResponse('No data found in sheet', 404);
    }
    
    // Get headers (first row)
    const headers = values[0];
    
    // Map headers to expected format
    const requiredHeaders = ['Function', 'Level', 'Country', 'Source', 'Period', 'Stage', 'Order', 'PTR'];
    const headerMap = {};
    
    // Find required headers
    const missingHeaders = [];
    requiredHeaders.forEach(header => {
      const index = headers.findIndex(h => h.toString().trim() === header);
      if (index === -1) {
        missingHeaders.push(header);
      } else {
        headerMap[header] = index;
      }
    });
    
    if (missingHeaders.length > 0) {
      return createErrorResponse(`Missing required headers: ${missingHeaders.join(', ')}`, 400);
    }
    
    // Convert rows to objects
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Skip empty rows
      if (row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }
      
      const rowData = {
        Function: getCellValue(row, headerMap.Function),
        Level: getCellValue(row, headerMap.Level),
        Country: getCellValue(row, headerMap.Country),
        Source: getCellValue(row, headerMap.Source),
        Period: getCellValue(row, headerMap.Period),
        Stage: getCellValue(row, headerMap.Stage),
        Order: parseInt(getCellValue(row, headerMap.Order)) || 0,
        PTR: parseFloat(getCellValue(row, headerMap.PTR)) || 0
      };
      
      rows.push(rowData);
    }
    
    // Create success response
    const response = {
      success: true,
      rows: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return createErrorResponse(`Internal server error: ${error.toString()}`, 500);
  }
}

/**
 * Get cell value safely
 */
function getCellValue(row, index) {
  if (index >= 0 && index < row.length) {
    const value = row[index];
    return value ? value.toString().trim() : '';
  }
  return '';
}

/**
 * Create success response with CORS headers
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create error response with CORS headers
 */
function createErrorResponse(message, statusCode = 400) {
  const errorResponse = {
    success: false,
    error: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(errorResponse))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle OPTIONS request for CORS preflight
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}