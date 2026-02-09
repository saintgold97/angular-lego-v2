import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root'
})
export class ExportService {

    constructor() { }

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });

        FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
    }

    exportAsExcelFile(json: any[], excelFileName: string): void {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);

        //Auto size
        const objectMaxLength: number[] = [];
        const keys = Object.keys(json[0]);
        const MAX_WIDTH = 50;

        json.forEach((data) => {
            keys.forEach((key, index) => {
                const value = data[key] ? data[key].toString() : '';
                let columnWidth = value.length;

                if (columnWidth > MAX_WIDTH) {
                    columnWidth = MAX_WIDTH;
                }

                objectMaxLength[index] = Math.max(objectMaxLength[index] || key.length, columnWidth) + 2;
            });
        });

        worksheet['!cols'] = objectMaxLength.map(width => ({ width }));

        const range = XLSX.utils.decode_range(worksheet['!ref']!);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!worksheet[cell_ref]) continue;
            }
        }
        //

        const workbook: XLSX.WorkBook = {
            Sheets: { 'data': worksheet },
            SheetNames: ['data']
        };

        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, excelFileName);
    }

    exportAsPdfFile(columns: string[], rows: any[], fileName: string, title?: string): void {
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(18);
        doc.text((title ? `${title}` : 'Report'), 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated at: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },

        });

        doc.save(`${fileName}_${new Date().getTime()}.pdf`);
    }

    async exportAnalyticsAsPdf(elementId: string, fileName: string, title: string): Promise<void> {
        const data = document.getElementById(elementId);
        if (!data) return;
    
        const canvas = await html2canvas(data, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });
    
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const maxLineWidth = pageWidth - (margin * 2);
    
        const startY = 30;
        const availableHeight = pageHeight - startY - margin;
    
        const imgWidth = maxLineWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
        // --- LOGIC TO RESIZE ---
        let finalImgHeight = imgHeight;
        let finalImgWidth = imgWidth;
    
        if (imgHeight > availableHeight) {
            const ratio = availableHeight / imgHeight;
            finalImgHeight = availableHeight;
            finalImgWidth = imgWidth * ratio;
        }
    
        const xOffset = margin + (maxLineWidth - finalImgWidth) / 2;
    
        pdf.setFontSize(18);
        pdf.text(title, margin, 15);
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 22);
    
        pdf.addImage(contentDataURL, 'PNG', xOffset, startY, finalImgWidth, finalImgHeight);
        
        pdf.save(`${fileName}.pdf`);
    }
}