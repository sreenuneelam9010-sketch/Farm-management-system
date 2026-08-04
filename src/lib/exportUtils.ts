import { Order, FinancialRecord, Animal, InventoryItem } from '../types';

export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const val = row[header] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAnimalsCSV(animals: Animal[]) {
  const data = animals.map(a => ({
    'Tag Number': a.tagNumber,
    'Category': a.category,
    'Breed': a.breed,
    'Gender': a.gender,
    'Age (Months)': a.ageMonths,
    'Weight (kg)': a.weightKg,
    'Purchase Price (₹)': a.purchasePrice,
    'Selling Price (₹)': a.sellingPrice,
    'Status': a.status,
    'Vaccination Status': a.vaccinationStatus,
    'Added Date': a.addedDate
  }));
  downloadCSV(`LV_Farm_Animals_${new Date().toISOString().slice(0, 10)}.csv`, data);
}

export function exportFinancialsCSV(records: FinancialRecord[]) {
  const data = records.map(r => ({
    'ID': r.id,
    'Type': r.type,
    'Category': r.category,
    'Title': r.title,
    'Amount (₹)': r.amount,
    'Date': r.date,
    'Recorded By': r.recordedBy,
    'Notes': r.notes || ''
  }));
  downloadCSV(`LV_Farm_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`, data);
}

export function exportOrdersCSV(orders: Order[]) {
  const data = orders.map(o => ({
    'Order Number': o.orderNumber,
    'Customer Name': o.customerName,
    'Mobile': o.customerMobile,
    'Delivery Address': o.deliveryAddress,
    'Total Amount (₹)': o.totalAmount,
    'Payment Mode': o.paymentMode,
    'Payment Status': o.paymentStatus,
    'Order Status': o.orderStatus,
    'Created At': o.createdAt
  }));
  downloadCSV(`LV_Farm_Sales_Orders_${new Date().toISOString().slice(0, 10)}.csv`, data);
}

export function exportInventoryCSV(inventory: InventoryItem[]) {
  const data = inventory.map(item => ({
    'Item Name': item.itemName,
    'Type': item.type,
    'Supplier Name': item.supplierName,
    'Supplier Contact': item.supplierContact,
    'Number of Bags / Boxes': `${item.numberOfBagsOrBoxes || 0} ${item.unit || 'Units'}`,
    'Cost per Bag / Box (₹)': item.costPerUnit || 0,
    'Total Purchase Amount (₹)': item.totalPurchaseAmount || ((item.numberOfBagsOrBoxes || 0) * (item.costPerUnit || 0)),
    'Current Stock': item.currentStock,
    'Min Alert Stock': item.minAlertStock,
    'Last Restocked': item.lastRestocked
  }));
  downloadCSV(`LV_Farm_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`, data);
}

export function printInvoice(order: Order) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${item.totalPrice.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 30px; color: #111827; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #15803d; padding-bottom: 20px; margin-bottom: 20px; }
          .farm-title { font-size: 22px; font-weight: bold; color: #15803d; margin: 0; }
          .farm-sub { font-size: 13px; color: #4b5563; margin-top: 4px; }
          .inv-title { font-size: 28px; font-weight: 800; color: #111827; text-align: right; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .details-box { width: 48%; font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 14px; text-transform: uppercase; color: #374151; }
          .total-box { width: 300px; margin-left: auto; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; text-align: right; }
          .total-amount { font-size: 24px; font-weight: bold; color: #15803d; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <h1 class="farm-title">Lakshmi Venkateshwara Sheep & Natu Kolla Farm</h1>
              <div class="farm-sub">Healthy Sheep • Native Chickens • Organic Farming • Trusted Quality</div>
              <div class="farm-sub">Primary Contact: Neelam Ramachandraiah (+91 9502756669)</div>
              <div class="farm-sub">WhatsApp: 9392589010</div>
            </div>
            <div>
              <div class="inv-title">INVOICE</div>
              <div style="font-size: 14px; color: #4b5563; text-align: right;">${order.orderNumber}</div>
              <div style="font-size: 13px; color: #6b7280; text-align: right;">Date: ${order.createdAt}</div>
            </div>
          </div>

          <div class="details">
            <div class="details-box">
              <strong style="color: #15803d;">Customer Information:</strong><br />
              <strong>${order.customerName}</strong><br />
              Phone: ${order.customerMobile}<br />
              Delivery Address: ${order.deliveryAddress}
            </div>
            <div class="details-box" style="text-align: right;">
              <strong style="color: #15803d;">Payment Details:</strong><br />
              Payment Method: ${order.paymentMode}<br />
              Payment Status: <span style="font-weight: bold; color: ${order.paymentStatus === 'Paid' ? '#16a34a' : '#d97706'}">${order.paymentStatus}</span><br />
              Order Status: <strong>${order.orderStatus}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div style="font-size: 14px; color: #374151;">Grand Total Amount</div>
            <div class="total-amount">₹${order.totalAmount.toLocaleString('en-IN')}</div>
          </div>

          <div class="footer">
            Thank you for choosing Lakshmi Venkateshwara Sheep & Natu Kolla Farm!<br />
            For queries, contact us at 9502756669 | Location: https://maps.app.goo.gl/voCm8BcCT6Cx4pnv6
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
