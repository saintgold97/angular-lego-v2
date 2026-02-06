import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
            styles: { fontSize: 9, cellPadding: 3 },
        });

        doc.save(`${fileName}_${new Date().getTime()}.pdf`);
    }
}