import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const generateInvestigationReport = async (results, appConfig, getOperator) => {
  if (!results || results.length === 0) return;
  const config = appConfig.pdfSettings || { agencyName: "LWS CYBER DEFENSE UNIT", watermark: true, showQr: true };

  console.log("Starting PDF Generation for", results.length, "results");
  toast.loading('Generating Investigation Report...', { id: 'pdf-toast' });
  
  try {
    const pdf = new jsPDF({ 
      orientation: 'p', 
      unit: 'mm', 
      format: 'a4',
      compress: true 
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();

    for (let index = 0; index < results.length; index++) {
      const res = results[index];
      if (index > 0) pdf.addPage();
      
      // Header
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, 45, 'F');

      // Badge
      pdf.setDrawColor(147, 51, 234);
      pdf.setLineWidth(0.5);
      pdf.circle(pageWidth - 25, 22, 10, 'D');
      pdf.setTextColor(147, 51, 234);
      pdf.setFontSize(6);
      pdf.text("VERIFIED", pageWidth - 25, 21, { align: "center" });
      pdf.text("INTERNAL", pageWidth - 25, 24, { align: "center" });

      // Branding
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(config.agencyName.toUpperCase(), 15, 22);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('INTELLIGENCE & INVESTIGATION DIVISION', 15, 30);
      pdf.text(`REF ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 15, 35);

      // Data Section
      let yPos = 65;
      pdf.setTextColor(147, 51, 234);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUBJECT DATA PROFILE', 15, yPos);
      pdf.line(15, yPos + 2, 70, yPos + 2);
      
      yPos += 15;

      const tableBody = [
        ['FULL NAME', (res.name || res.full_name || 'N/A').toUpperCase()],
        ['IDENTITY NO', res.cnic || res.nic || 'N/A'],
        ['MOBILE REF', res.phone || res.mobile || 'N/A'],
        ['SERVICE PROVIDER', getOperator(res.phone || res.mobile || "").name],
        ['PRIMARY ADDRESS', (res.address || res.location || 'N/A').toUpperCase()]
      ];

      autoTable(pdf, {
        startY: yPos,
        theme: 'grid',
        body: tableBody,
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: [240, 240, 240] } }
      });

      // Footer & Sign
      // @ts-ignore
      const finalY = pdf.lastAutoTable.finalY + 25;
      
      // Right Signature
      const sigB64 = "data:image/png;base64,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";
      pdf.addImage(sigB64, 'PNG', pageWidth - 60, finalY - 10, 45, 20);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text("OFFICER IN CHARGE", pageWidth - 60, finalY + 12);
      pdf.line(pageWidth - 65, finalY + 8, pageWidth - 15, finalY + 8);
    }

    pdf.save(`Investigation_Report_${phoneNumber}.pdf`);
    toast.success('Investigation Report Generated', { id: 'pdf-toast' });
  } catch (err) {
    console.error("PDF Generate Error:", err);
    toast.error('PDF Generation Failed', { id: 'pdf-toast' });
  }
};
