import React, { useMemo } from 'react';
import { DocumentData } from '@/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

interface DocumentPreviewProps {
  data: DocumentData;
  zoom: number;
  onChange?: (data: DocumentData) => void;
}

// Constants for A4 layout estimation (in px at 96 DPI)
const PAGE_HEIGHT = 1123;
const PAGE_WIDTH = 794;
const PADDING_Y = 150; // 20mm top + 20mm bottom approx
const CONTENT_WIDTH_CHARS = 100; // Approx characters per line for Times New Roman 14px
const LINE_HEIGHT = 22; // px (closer to 14px * 1.5)
const PARAGRAPH_MARGIN = 8; // px
const HEADER_HEIGHT = 180; // px
const TITLE_HEIGHT = 100; // px
const FOOTER_HEIGHT = 180; // px

export const DocumentPreview = React.forwardRef<HTMLDivElement, DocumentPreviewProps>(({ data, zoom, onChange }, ref) => {
  const scaleStyle = {
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
  };

  // Handle page-level updates (onBlur of the page container)
  const handlePageBlur = (e: React.FormEvent<HTMLDivElement>, pageContent: any[]) => {
    if (!onChange) return;
    
    const container = e.currentTarget;
    const childNodes = Array.from(container.childNodes);
    const newLines: string[] = [];
    
    childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        // Get innerHTML to preserve bold/italic/underline tags
        let html = el.innerHTML;
        
        // Check for alignment in style (browser might add it to the div)
        const align = el.style.textAlign;
        if (align) {
           // Wrap if not already wrapped
           if (!html.trim().startsWith('<div style="text-align')) {
               html = `<div style="text-align: ${align}">${html}</div>`;
           }
        }
        
        // Clean up empty lines or BRs
        if (el.innerText.trim() === '' && !el.querySelector('img')) {
           if (html === '<br>' || html === '') html = '';
        }
        
        // Remove any wrapper divs that might have been duplicated by browser behavior if needed
        // But generally we trust the innerHTML. 
        // We might want to strip the outer div's classes if they were copied? 
        // No, we only save the inner content.
        
        newLines.push(html);
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Text directly in container
        if (node.textContent) {
          newLines.push(node.textContent);
        }
      }
    });
    
    // Update data.content
    // We need to replace the lines corresponding to this page in the global content
    const lines = data.content.split('\n');
    
    if (pageContent.length > 0) {
      const start = pageContent[0].originalIndex;
      const end = pageContent[pageContent.length - 1].originalIndex;
      
      // Replace the range with new lines
      lines.splice(start, end - start + 1, ...newLines);
      
      onChange({ ...data, content: lines.join('\n') });
    }
  };

  // Pagination Logic
  const pages = useMemo(() => {
    const contentLines = data.content.split('\n');
    const pagesArray: any[][] = [];
    let currentPage: any[] = [];
    let currentHeight = HEADER_HEIGHT + TITLE_HEIGHT; // Start with header + title on page 1
    let pageIndex = 0;

    // Helper to check space
    const getPageCapacity = (pIndex: number) => {
      return PAGE_HEIGHT - PADDING_Y;
    };

    contentLines.forEach((line, index) => {
      // Keep original index for editing
      const item = { type: 'text', content: line, originalIndex: index };
      
      const trimmed = line.trim();
      if (!trimmed) {
        currentHeight += LINE_HEIGHT; // Empty line
        currentPage.push({ ...item, type: 'break' }); // Still track index
        return;
      }

      // Estimate height of this paragraph
      const estimatedLines = Math.ceil(trimmed.length / CONTENT_WIDTH_CHARS) || 1;
      const paragraphHeight = (estimatedLines * LINE_HEIGHT) + PARAGRAPH_MARGIN;

      // Check if fits
      if (currentHeight + paragraphHeight > getPageCapacity(pageIndex)) {
        // Move to next page
        pagesArray.push(currentPage);
        currentPage = [];
        pageIndex++;
        currentHeight = 0; // Reset height for new page (no header/title)
      }

      currentPage.push(item);
      currentHeight += paragraphHeight;
    });

    // Check footer
    if (currentHeight + FOOTER_HEIGHT > getPageCapacity(pageIndex)) {
      // Footer doesn't fit, push to new page
      pagesArray.push(currentPage);
      currentPage = []; // Empty page for footer
      pageIndex++;
    }
    
    // Add remaining content (or empty if just footer)
    pagesArray.push(currentPage);

    return pagesArray;
  }, [data.content, data.form, data.headerAlign]); // Recalculate when content changes

  const renderPageContent = (pageContent: any[]) => {
    return pageContent.map((item, i) => {
      const index = item.originalIndex;
      
      // Formatting rules (applied to container, but innerHTML overrides)
      const hasHtml = /<[a-z][\s\S]*>/i.test(item.content);
      
      const trimmed = item.content.replace(/<[^>]*>/g, '').trim();
      const isBoldStart = !hasHtml && /^(Điều \d+\.|QUYẾT ĐỊNH:|Căn cứ|Xét đề nghị)/i.test(trimmed);
      const isUppercase = !hasHtml && trimmed === trimmed.toUpperCase() && trimmed.length > 5;
      const isItalic = !hasHtml && (trimmed.startsWith('Căn cứ') || trimmed.startsWith('Xét đề nghị'));
      
      // Indentation
      let indentClass = "";
      if (trimmed.match(/^\d+\./)) indentClass = "pl-4"; // 1.
      else if (trimmed.match(/^[a-z]\)/)) indentClass = "pl-8"; // a)
      else if (trimmed.match(/^-/)) indentClass = "pl-8"; // -

      if (item.type === 'break') {
         return (
            <div 
               key={`line-${index}`}
               id={`line-${index}`}
               className="h-[22px]" // Empty line height
            />
         );
      }

      return (
        <div 
          key={`line-${index}`}
          id={`line-${index}`}
          className={clsx(
            "mb-2 rounded px-1 -mx-1 transition-colors min-h-[22px]", 
            indentClass,
            (isBoldStart || (isUppercase && !trimmed.startsWith('Căn cứ'))) && "font-bold",
            isItalic && "italic"
          )}
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col items-center overflow-auto bg-gray-200 p-8 h-full min-h-screen gap-8">
      {pages.map((pageContent, pageIndex) => (
        <div 
          key={pageIndex}
          ref={pageIndex === 0 ? ref : undefined} // Ref on first page for print (react-to-print handles the rest via CSS)
          className="bg-white shadow-xl border border-gray-300 text-black font-times relative shrink-0 print-container"
          style={{
            width: '794px',
            minHeight: '1123px',
            padding: '20mm 15mm 20mm 20mm',
            ...scaleStyle
          }}
        >
          {/* Render Header & Title ONLY on Page 1 */}
          {pageIndex === 0 && (
            <>
              {/* Header Table */}
              <table className="w-full mb-6 border-collapse">
                <tbody>
                  <tr>
                    {data.form === 'Hợp đồng (Kinh tế - Dân sự)' && !data.showPartyAOnHeader ? (
                      <td className="align-top text-center pb-4 w-full" colSpan={2}>
                        <p className="font-bold uppercase text-[13px] leading-snug">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </p>
                        <p className="font-bold text-[14px] leading-snug underline decoration-1 underline-offset-4 pb-1">
                          Độc lập - Tự do - Hạnh phúc
                        </p>
                        <div className="mt-2 text-[13px] italic">
                          {data.location}, ngày {format(data.date, 'dd', { locale: vi })} tháng {format(data.date, 'MM', { locale: vi })} năm {format(data.date, 'yyyy', { locale: vi })}
                        </div>
                      </td>
                    ) : (
                      <>
                        <td 
                          className="align-top text-center pb-4"
                          style={{ width: `${40 + (data.headerAlign * 0.2)}%` }}
                        >
                          {data.form === 'Hợp đồng (Kinh tế - Dân sự)' ? (
                            data.showPartyAOnHeader ? (
                              <>
                                <p className="font-bold uppercase text-[12px] leading-snug">
                                  {data.partyA?.name}
                                </p>
                                <div className="mt-2 text-[13px]">
                                  Số: {data.docNumber}
                                </div>
                              </>
                            ) : null
                          ) : data.form?.startsWith('Đảng') ? (
                            <>
                              <p className="font-normal uppercase text-[13px] leading-snug">
                                {data.orgName}
                              </p>
                              <p className="font-bold uppercase text-[13px] leading-snug underline decoration-1 underline-offset-4">
                                {data.issuingOrg}
                              </p>
                              <div className="mt-2 text-[13px]">
                                Số: {data.docNumber}
                              </div>
                            </>
                          ) : data.form?.startsWith('Đoàn') ? (
                            <>
                              <p className="font-normal uppercase text-[13px] leading-snug">
                                {data.orgName}
                              </p>
                              <p className="font-bold uppercase text-[13px] leading-snug underline decoration-1 underline-offset-4">
                                {data.issuingOrg}
                              </p>
                              <div className="mt-2 text-[13px]">
                                Số: {data.docNumber}
                              </div>
                            </>
                          ) : data.form?.startsWith('Mặt trận') ? (
                            <>
                              <p className="font-normal uppercase text-[13px] leading-snug">
                                {data.orgName}
                              </p>
                              <p className="font-bold uppercase text-[13px] leading-snug underline decoration-1 underline-offset-4">
                                {data.issuingOrg}
                              </p>
                              <div className="mt-2 text-[13px]">
                                Số: {data.docNumber}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-normal uppercase text-[13px] leading-snug">
                                {data.orgName}
                              </p>
                              <p className="font-bold uppercase text-[13px] leading-snug underline decoration-1 underline-offset-4">
                                {data.issuingOrg}
                              </p>
                              <div className="mt-2 text-[13px]">
                                Số: {data.docNumber}
                              </div>
                            </>
                          )}
                        </td>
                        <td 
                          className="align-top text-center pb-4"
                          style={{ width: `${60 - (data.headerAlign * 0.2)}%` }}
                        >
                          {data.form?.startsWith('Đảng') ? (
                            <>
                              <p className="font-bold uppercase text-[13px] leading-snug">
                                ĐẢNG CỘNG SẢN VIỆT NAM
                              </p>
                              <div className="mt-2 text-[13px] italic">
                                {data.location}, ngày {format(data.date, 'dd', { locale: vi })} tháng {format(data.date, 'MM', { locale: vi })} năm {format(data.date, 'yyyy', { locale: vi })}
                              </div>
                            </>
                          ) : data.form?.startsWith('Đoàn') ? (
                            <>
                              <p className="font-bold uppercase text-[13px] leading-snug">
                                ĐOÀN TNCS HỒ CHÍ MINH
                              </p>
                              <div className="mt-2 text-[13px] italic">
                                {data.location}, ngày {format(data.date, 'dd', { locale: vi })} tháng {format(data.date, 'MM', { locale: vi })} năm {format(data.date, 'yyyy', { locale: vi })}
                              </div>
                            </>
                          ) : data.form?.startsWith('Mặt trận') ? (
                            <>
                              <p className="font-bold uppercase text-[13px] leading-snug">
                                ỦY BAN MTTQ VIỆT NAM
                              </p>
                              <div className="mt-2 text-[13px] italic">
                                {data.location}, ngày {format(data.date, 'dd', { locale: vi })} tháng {format(data.date, 'MM', { locale: vi })} năm {format(data.date, 'yyyy', { locale: vi })}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-bold uppercase text-[13px] leading-snug">
                                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                              </p>
                              <p className="font-bold text-[14px] leading-snug underline decoration-1 underline-offset-4 pb-1">
                                Độc lập - Tự do - Hạnh phúc
                              </p>
                              <div className="mt-2 text-[13px] italic">
                                {data.location}, ngày {format(data.date, 'dd', { locale: vi })} tháng {format(data.date, 'MM', { locale: vi })} năm {format(data.date, 'yyyy', { locale: vi })}
                              </div>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>

              {/* Title & Excerpt */}
              <div className="text-center mb-6">
                <h1 className="font-bold text-[16px] uppercase mb-1">
                  {data.title}
                </h1>
                {data.form === 'Hợp đồng (Kinh tế - Dân sự)' ? (
                   !data.showPartyAOnHeader && (
                     <div className="font-bold text-[14px] px-12 leading-snug">
                       Số: {data.docNumber}
                     </div>
                   )
                ) : (
                  <>
                    <div className="font-bold text-[14px] px-12 leading-snug">
                      {data.excerpt}
                    </div>
                    <div className="w-16 h-[1px] bg-black mx-auto mt-2"></div>
                  </>
                )}
              </div>
              
              {/* Contract Parties Info */}
              {data.form === 'Hợp đồng (Kinh tế - Dân sự)' && (
                <div className="mb-6 text-[14px] leading-normal font-times">
                  <p className="mb-4 italic">
                    Hôm nay, ngày {format(data.date, 'dd')} tháng {format(data.date, 'MM')} năm {format(data.date, 'yyyy')}, tại {data.location}. Chúng tôi gồm có:
                  </p>
                  
                  {/* Party A */}
                  <div className="mb-4">
                    <p className="font-bold uppercase mb-1">BÊN A: {data.partyA?.name}</p>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-32 align-top">Địa chỉ:</td>
                          <td>{data.partyA?.address}</td>
                        </tr>
                        <tr>
                          <td className="align-top">Mã số thuế:</td>
                          <td>{data.partyA?.taxCode}</td>
                        </tr>
                        <tr>
                          <td className="align-top">Đại diện:</td>
                          <td>Ông/Bà <b>{data.partyA?.representative}</b></td>
                        </tr>
                        <tr>
                          <td className="align-top">Chức vụ:</td>
                          <td>{data.partyA?.position}</td>
                        </tr>
                        <tr>
                          <td className="align-top">Điện thoại:</td>
                          <td>{data.partyA?.phone}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Party B */}
                  <div className="mb-4">
                    <p className="font-bold uppercase mb-1">BÊN B: {data.partyB?.name}</p>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-32 align-top">Địa chỉ:</td>
                          <td>{data.partyB?.address}</td>
                        </tr>
                        <tr>
                          <td className="align-top">Mã số thuế:</td>
                          <td>{data.partyB?.taxCode}</td>
                        </tr>
                        <tr>
                          <td className="align-top">Đại diện:</td>
                          <td>Ông/Bà <b>{data.partyB?.representative}</b></td>
                        </tr>
                        <tr>
                          <td className="align-top">Chức vụ:</td>
                          <td>{data.partyB?.position}</td>
                        </tr>
                        <tr>
                          <td className="align-top">Điện thoại:</td>
                          <td>{data.partyB?.phone}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="italic mb-2">Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:</p>
                </div>
              )}
            </>
          )}

          {/* Page Content */}
          <div 
            contentEditable={!!onChange}
            suppressContentEditableWarning
            onBlur={(e) => handlePageBlur(e, pageContent)}
            className="text-[14px] leading-normal text-justify mb-8 document-content font-times outline-none"
          >
            {renderPageContent(pageContent)}
          </div>

          {/* Render Footer ONLY on Last Page */}
          {pageIndex === pages.length - 1 && (
            <table className="w-full mt-8 border-collapse avoid-break">
              <tbody>
                {data.form === 'Hợp đồng (Kinh tế - Dân sự)' ? (
                  <tr>
                    <td className="w-[50%] align-top text-center">
                      <p className="font-bold uppercase text-[13px] mb-2">
                        ĐẠI DIỆN BÊN A
                      </p>
                      <p className="italic text-[12px] mb-12">(Ký, ghi rõ họ tên và đóng dấu)</p>
                      <p className="font-bold text-[14px] mt-16">
                        {data.partyA?.representative}
                      </p>
                    </td>
                    <td className="w-[50%] align-top text-center">
                      <p className="font-bold uppercase text-[13px] mb-2">
                        ĐẠI DIỆN BÊN B
                      </p>
                      <p className="italic text-[12px] mb-12">(Ký, ghi rõ họ tên và đóng dấu)</p>
                      <p className="font-bold text-[14px] mt-16">
                        {data.partyB?.representative}
                      </p>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="w-[50%] align-top text-left pl-4">
                      <p className="font-bold italic text-[12px] mb-1">Nơi nhận:</p>
                      <ul className="list-none p-0 m-0 text-[11px]">
                        {data.recipients.map((r, i) => (
                          <li key={i} className="leading-snug">- {r};</li>
                        ))}
                        <li className="leading-snug">- Lưu: VT, {data.unitCode}.</li>
                      </ul>
                    </td>
                    <td className="w-[50%] align-top text-center">
                      <p className="font-bold uppercase text-[13px] mb-12">
                        {data.signerTitle}
                      </p>
                      {/* Space for signature */}
                      <p className="font-bold text-[14px] mt-16">
                        {data.signerName}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          
          {/* Page Number (if > 1 page) */}
          {pages.length > 1 && (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[12px] text-black">
               {pageIndex + 1}
             </div>
          )}
        </div>
      ))}
    </div>
  );
});

DocumentPreview.displayName = 'DocumentPreview';
