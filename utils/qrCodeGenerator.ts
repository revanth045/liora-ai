/**
 * QR Code Demo Generator
 * Generates QR codes for testing AI Waiter feature
 */

/**
 * Generate a QR code data string for a table
 * @param tableNumber - Table number (e.g., "12")
 * @param restaurantName - Restaurant name (e.g., "The Italian Place")
 * @returns QR code data string
 */
export const generateQRData = (tableNumber: string | number, restaurantName: string): string => {
  return `${tableNumber}:${restaurantName.replace(/\s+/g, '_')}`;
};

/**
 * Parse QR code data back to table info
 * @param qrData - QR code data string
 * @returns Object with tableNumber and restaurantName
 */
export const parseQRData = (qrData: string): { tableNumber: string; restaurantName: string } | null => {
  const parts = qrData.split(':');
  if (parts.length === 2) {
    return {
      tableNumber: parts[0],
      restaurantName: parts[1].replace(/_/g, ' ')
    };
  }
  return null;
};

/**
 * Generate a QR code image using an external service
 * Uses qr-server API (free, no signup required)
 * @param tableNumber - Table number
 * @param restaurantName - Restaurant name
 * @param size - QR code size in pixels (default 300)
 * @returns URL to QR code image
 */
export const generateQRImageUrl = (
  tableNumber: string | number,
  restaurantName: string,
  size: number = 300
): string => {
  const qrData = generateQRData(tableNumber, restaurantName);
  const encoded = encodeURIComponent(qrData);
  // Using qr-server.com API (free, no authentication)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
};

/**
 * Generate multiple QR codes for a restaurant's tables
 * @param restaurantName - Restaurant name
 * @param tableCount - Number of tables (default 20)
 * @returns Array of table configurations with QR URLs
 */
export const generateRestaurantQRCodes = (
  restaurantName: string,
  tableCount: number = 20
): Array<{
  tableNumber: number;
  qrData: string;
  qrImageUrl: string;
}> => {
  const tables = [];
  for (let i = 1; i <= tableCount; i++) {
    tables.push({
      tableNumber: i,
      qrData: generateQRData(i, restaurantName),
      qrImageUrl: generateQRImageUrl(i, restaurantName, 400)
    });
  }
  return tables;
};

/**
 * Download QR code for printing
 * @param qrImageUrl - URL of the QR code image
 * @param tableNumber - Table number for filename
 */
export const downloadQRCode = (qrImageUrl: string, tableNumber: string | number): void => {
  const link = document.createElement('a');
  link.href = qrImageUrl;
  link.download = `table-${tableNumber}-qr.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate HTML for printing all QR codes
 * @param restaurantName - Restaurant name
 * @param tableCount - Number of tables
 * @returns HTML string ready for printing
 */
export const generatePrintableQRSheet = (restaurantName: string, tableCount: number = 20): string => {
  const tables = generateRestaurantQRCodes(restaurantName, tableCount);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Codes - ${restaurantName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          background: white;
        }
        h1 {
          text-align: center;
          color: #333;
        }
        .qr-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
          margin-top: 30px;
        }
        .qr-card {
          text-align: center;
          page-break-inside: avoid;
        }
        .qr-card img {
          width: 200px;
          height: 200px;
          border: 2px solid #ddd;
          padding: 10px;
          background: white;
        }
        .qr-card h3 {
          margin: 15px 0 5px 0;
          color: #333;
          font-size: 18px;
        }
        .qr-card p {
          margin: 0;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body {
            margin: 0;
            padding: 10px;
          }
          .qr-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }
      </style>
    </head>
    <body>
      <h1>${restaurantName} - QR Codes</h1>
      <p style="text-align: center; color: #666;">Print and laminate these QR codes. Place one at each table.</p>
      <div class="qr-grid">
        ${tables.map(table => `
          <div class="qr-card">
            <img src="${table.qrImageUrl}" alt="Table ${table.tableNumber}">
            <h3>Table ${table.tableNumber}</h3>
            <p>Scan with phone</p>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Open print dialog for QR codes
 * @param restaurantName - Restaurant name
 * @param tableCount - Number of tables
 */
export const printQRCodes = (restaurantName: string, tableCount: number = 20): void => {
  const html = generatePrintableQRSheet(restaurantName, tableCount);
  const printWindow = window.open('', '', 'width=800,height=600');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

