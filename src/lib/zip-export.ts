import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Trip } from './types';
import { format } from 'date-fns';

// Helper function to convert data URI to blob
function dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

export const exportBillsToZip = async (trip: Trip) => {
    const zip = new JSZip();
    const receiptsFolder = zip.folder("receipts");

    if (!receiptsFolder) {
        console.error("Failed to create a folder in the zip file.");
        return;
    }

    const expensesWithReceipts = trip.expenses.filter(e => e.receiptImageUrl);

    if (expensesWithReceipts.length === 0) {
        // You might want to show a toast message to the user
        console.log("No receipts to export.");
        return;
    }

    for (const expense of expensesWithReceipts) {
        if (expense.receiptImageUrl) {
            try {
                const blob = dataURItoBlob(expense.receiptImageUrl);
                const fileExtension = blob.type.split('/')[1] || 'png';
                const formattedDate = format(new Date(expense.date), 'yyyy-MM-dd');
                const safeTitle = expense.title.replace(/[^a-zA-Z0-9]/g, '_');
                const fileName = `${safeTitle}-${formattedDate}.${fileExtension}`;
                receiptsFolder.file(fileName, blob);
            } catch (error) {
                console.error(`Failed to process receipt for "${expense.title}":`, error);
            }
        }
    }

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const safeTripName = trip.name.replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(content, `${safeTripName}_receipts.zip`);
    } catch (error) {
        console.error("Failed to generate zip file:", error);
    }
};
