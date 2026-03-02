import { DocumentData } from '@/types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, UnderlineType } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const FONT_FAMILY = "Times New Roman";

// Helper to create invisible borders
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

export const exportToDocx = async (data: DocumentData) => {
  const children = [];

  // --- 1. Header Section ---
  const leftColWidth = 40 + (data.headerAlign * 0.2);
  const rightColWidth = 60 - (data.headerAlign * 0.2);

  let leftCellChildren: Paragraph[] = [];
  let rightCellChildren: Paragraph[] = [];

  // Logic for Left Column
  if (data.form === 'Hợp đồng (Kinh tế - Dân sự)') {
    if (data.showPartyAOnHeader) {
      leftCellChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: data.partyA?.name?.toUpperCase(), bold: true, size: 24, font: FONT_FAMILY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `Số: ${data.docNumber}`, size: 26, font: FONT_FAMILY })],
        })
      );
    }
  } else {
    // Admin, Party, Union, Front
    leftCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: data.orgName?.toUpperCase(), size: 26, font: FONT_FAMILY })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ 
            text: data.issuingOrg?.toUpperCase(), 
            bold: true, 
            size: 26,
            font: FONT_FAMILY,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Số: ${data.docNumber}`, size: 26, font: FONT_FAMILY })],
      })
    );
  }

  // Logic for Right Column
  if (data.form === 'Hợp đồng (Kinh tế - Dân sự)' && !data.showPartyAOnHeader) {
     // Special case: Centered header for contracts when Party A is hidden
     // We will handle this by making a single row spanning both columns or just using the right column logic if we want to center it relative to page?
     // The preview implementation centers it across the whole page. 
     // To achieve this in the 2-column table structure, we might need a different table or merge cells.
     // For simplicity in this structure, let's put it in a separate table row or just use the right cell if we can't merge easily here.
     // Actually, let's just use the standard layout but put content in a single cell table if needed.
     // BUT, the preview code uses a single row with colspan=2.
  } else {
    let line1 = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
    let line2 = "Độc lập - Tự do - Hạnh phúc";
    
    if (data.form?.startsWith('Đảng')) {
      line1 = "ĐẢNG CỘNG SẢN VIỆT NAM";
      line2 = "";
    } else if (data.form?.startsWith('Đoàn')) {
      line1 = "ĐOÀN TNCS HỒ CHÍ MINH";
      line2 = "";
    } else if (data.form?.startsWith('Mặt trận')) {
      line1 = "ỦY BAN MTTQ VIỆT NAM";
      line2 = "";
    }

    rightCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: line1, bold: true, size: 26, font: FONT_FAMILY })],
      })
    );

    if (line2) {
      rightCellChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ 
              text: line2, 
              bold: true, 
              size: 28, 
              font: FONT_FAMILY,
              underline: { type: UnderlineType.SINGLE }
            })
          ],
        })
      );
    }

    rightCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER, // Changed to CENTER to match preview usually, or RIGHT? Preview uses italic centered under the motto usually.
        // Wait, preview code says: className="mt-2 text-[13px] italic" inside the td which is text-center. So it is centered.
        children: [
          new TextRun({ 
            text: `${data.location}, ngày ${format(data.date, 'dd')} tháng ${format(data.date, 'MM')} năm ${format(data.date, 'yyyy')}`, 
            italics: true, 
            size: 26,
            font: FONT_FAMILY
          })
        ],
      })
    );
  }

  // Construct Header Table
  if (data.form === 'Hợp đồng (Kinh tế - Dân sự)' && !data.showPartyAOnHeader) {
     // Centered Header for Contract
     children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 26, font: FONT_FAMILY })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ 
                        text: "Độc lập - Tự do - Hạnh phúc", 
                        bold: true, 
                        size: 28, 
                        font: FONT_FAMILY,
                        underline: { type: UnderlineType.SINGLE }
                      })
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ 
                        text: `${data.location}, ngày ${format(data.date, 'dd')} tháng ${format(data.date, 'MM')} năm ${format(data.date, 'yyyy')}`, 
                        italics: true, 
                        size: 26,
                        font: FONT_FAMILY
                      })
                    ],
                  })
                ]
              })
            ]
          })
        ]
      })
     );
  } else {
    // Standard 2-column Header
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: leftColWidth, type: WidthType.PERCENTAGE },
                children: leftCellChildren,
              }),
              new TableCell({
                width: { size: rightColWidth, type: WidthType.PERCENTAGE },
                children: rightCellChildren,
              }),
            ],
          }),
        ],
      })
    );
  }

  // --- 2. Title & Excerpt ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({ 
          text: data.title?.toUpperCase(), 
          bold: true, 
          size: 32, // 16pt approx
          font: FONT_FAMILY
        })
      ],
    })
  );

  if (data.form === 'Hợp đồng (Kinh tế - Dân sự)') {
    if (!data.showPartyAOnHeader) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `Số: ${data.docNumber}`, bold: true, size: 28, font: FONT_FAMILY })],
        })
      );
    }
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({ 
            text: data.excerpt, 
            bold: true, 
            size: 28,
            font: FONT_FAMILY
          })
        ],
      })
    );
    // Decorative line? In docx usually just a border or shape, skipping for simplicity or adding a bottom border to paragraph
  }

  // --- 3. Contract Parties (If Contract) ---
  if (data.form === 'Hợp đồng (Kinh tế - Dân sự)') {
    const today = `Hôm nay, ngày ${format(data.date, 'dd')} tháng ${format(data.date, 'MM')} năm ${format(data.date, 'yyyy')}, tại ${data.location}. Chúng tôi gồm có:`;
    children.push(
      new Paragraph({
        children: [new TextRun({ text: today, italics: true, size: 28, font: FONT_FAMILY })],
        spacing: { before: 240, after: 240 }
      })
    );

    // Helper for Party Info
    const createPartySection = (label: string, party: any) => {
      const rows = [
        ["Địa chỉ:", party?.address],
        ["Mã số thuế:", party?.taxCode],
        ["Đại diện:", `Ông/Bà ${party?.representative}`], // Bold name handled below
        ["Chức vụ:", party?.position],
        ["Điện thoại:", party?.phone]
      ];

      const tableRows = rows.map(([key, value]) => 
        new TableRow({
          children: [
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: key, size: 28, font: FONT_FAMILY })] })] }),
            new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: value || "", size: 28, font: FONT_FAMILY, bold: key === "Đại diện:" })] })] }),
          ]
        })
      );

      return [
        new Paragraph({
          children: [new TextRun({ text: `${label}: ${party?.name?.toUpperCase()}`, bold: true, size: 28, font: FONT_FAMILY })],
          spacing: { before: 120, after: 120 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: tableRows
        })
      ];
    };

    children.push(...createPartySection("BÊN A", data.partyA));
    children.push(...createPartySection("BÊN B", data.partyB));

    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:", italics: true, size: 28, font: FONT_FAMILY })],
        spacing: { before: 240, after: 240 }
      })
    );
  }

  // --- 4. Main Content ---
  const contentLines = data.content.split('\n');
  
  // Helper to parse HTML to TextRuns
  const parseHtmlToTextRuns = (text: string, baseSize: number = 28, baseFont: string = FONT_FAMILY) => {
    const runs: TextRun[] = [];
    // Simple regex to find tags. This is not a full parser but handles basic nesting if flat or simple.
    // Better approach: Split by tags and maintain a state stack.
    
    // Regex to split by tags, keeping delimiters
    const parts = text.split(/(<\/?(?:b|strong|i|em|u)>)/g);
    
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    
    parts.forEach(part => {
      if (part.match(/^<(?:b|strong)>$/)) { isBold = true; return; }
      if (part.match(/^<\/(?:b|strong)>$/)) { isBold = false; return; }
      if (part.match(/^<(?:i|em)>$/)) { isItalic = true; return; }
      if (part.match(/^<\/(?:i|em)>$/)) { isItalic = false; return; }
      if (part.match(/^<u>$/)) { isUnderline = true; return; }
      if (part.match(/^<\/u>$/)) { isUnderline = false; return; }
      
      if (part === '') return;
      
      // Decode HTML entities if needed (basic ones)
      const decoded = part
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      runs.push(new TextRun({
        text: decoded,
        bold: isBold,
        italics: isItalic,
        underline: isUnderline ? { type: UnderlineType.SINGLE } : undefined,
        size: baseSize,
        font: baseFont
      }));
    });
    
    return runs;
  };

  contentLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({}));
      return;
    }

    let indentLevel = 0;
    // Check indentation from text patterns (fallback if not using HTML styles)
    // Note: If we had alignment in HTML, we should parse style="text-align: ..."
    // For now, we stick to the existing pattern detection for indentation unless we parse styles.
    if (trimmed.match(/^\d+\./)) indentLevel = 0; 
    else if (trimmed.match(/^[a-z]\)/)) indentLevel = 1; 
    else if (trimmed.match(/^-/)) indentLevel = 1; 

    // Check for alignment classes or styles if we were saving them. 
    // Currently DocumentPreview saves innerHTML which might include <div style="text-align: center">...</div>
    // But our line splitting might break that. 
    // We assume lines are <p> or text.
    
    // Detect alignment from style attribute if present in the line string
    let alignment = AlignmentType.JUSTIFIED;
    if (line.includes('text-align: center') || line.includes('text-align:center')) alignment = AlignmentType.CENTER;
    if (line.includes('text-align: right') || line.includes('text-align:right')) alignment = AlignmentType.RIGHT;
    if (line.includes('text-align: left') || line.includes('text-align:left')) alignment = AlignmentType.LEFT;

    // Auto-detect bold/italic start if no HTML tags present (legacy support)
    const hasHtml = /<[a-z][\s\S]*>/i.test(line);
    let runs: TextRun[] = [];
    
    if (hasHtml) {
      runs = parseHtmlToTextRuns(line);
    } else {
      const isBoldStart = /^(Điều \d+\.|QUYẾT ĐỊNH:|Căn cứ|Xét đề nghị)/i.test(trimmed);
      const isUppercase = trimmed === trimmed.toUpperCase() && trimmed.length > 5;
      const isItalic = trimmed.startsWith('Căn cứ') || trimmed.startsWith('Xét đề nghị');
      
      runs = [new TextRun({
        text: trimmed,
        size: 28,
        font: FONT_FAMILY,
        bold: isBoldStart || (isUppercase && !trimmed.startsWith('Căn cứ')),
        italics: isItalic
      })];
    }

    const leftIndent = indentLevel === 0 && trimmed.match(/^\d+\./) ? 240 : (indentLevel * 480);

    children.push(
      new Paragraph({
        alignment: alignment,
        indent: { left: leftIndent },
        spacing: { after: 120 },
        children: runs,
      })
    );
  });

  // --- 5. Footer Section ---
  children.push(new Paragraph({ spacing: { before: 480 } })); // Spacer

  if (data.form === 'Hợp đồng (Kinh tế - Dân sự)') {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ĐẠI DIỆN BÊN A", bold: true, size: 26, font: FONT_FAMILY })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, ghi rõ họ tên và đóng dấu)", italics: true, size: 24, font: FONT_FAMILY })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440 }, children: [new TextRun({ text: data.partyA?.representative, bold: true, size: 28, font: FONT_FAMILY })] }),
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ĐẠI DIỆN BÊN B", bold: true, size: 26, font: FONT_FAMILY })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, ghi rõ họ tên và đóng dấu)", italics: true, size: 24, font: FONT_FAMILY })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440 }, children: [new TextRun({ text: data.partyB?.representative, bold: true, size: 28, font: FONT_FAMILY })] }),
                ]
              })
            ]
          })
        ]
      })
    );
  } else {
    // Standard Footer
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Nơi nhận:", bold: true, italics: true, size: 24, font: FONT_FAMILY })] }),
                  ...data.recipients.map(r => new Paragraph({ children: [new TextRun({ text: `- ${r};`, size: 22, font: FONT_FAMILY })] })),
                  new Paragraph({ children: [new TextRun({ text: `- Lưu: VT, ${data.unitCode}.`, size: 22, font: FONT_FAMILY })] }),
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.signerTitle?.toUpperCase(), bold: true, size: 26, font: FONT_FAMILY })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440 }, children: [new TextRun({ text: data.signerName, bold: true, size: 28, font: FONT_FAMILY })] }),
                ]
              })
            ]
          })
        ]
      })
    );
  }

  // Create Document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134, // 20mm
            right: 850, // 15mm
            bottom: 1134, // 20mm
            left: 1701, // 30mm
          },
        },
      },
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.docNumber.replace('/', '-')}_${data.type}.docx`);
};
