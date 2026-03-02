import React, { useState, useRef, useEffect } from 'react';
import { DocumentData, INITIAL_DOC } from '@/types';
import { EditorForm } from '@/components/EditorForm';
import { DocumentPreview } from '@/components/DocumentPreview';
import { AIChatPanel } from '@/components/AIChatPanel';
import { generateDocumentContent, suggestRecipients } from '@/services/gemini';
import { exportToDocx } from '@/services/docxExport';
import { useReactToPrint } from 'react-to-print';
import { ZoomIn, ZoomOut, Moon, Sun, Save, Home, FileText, CheckCircle, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo, Redo, Table } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [doc, setDoc] = useState<DocumentData>(INITIAL_DOC);
  const [zoom, setZoom] = useState(100);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [history, setHistory] = useState<DocumentData[]>([INITIAL_DOC]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Wrapper for setDoc to handle history
  const updateDoc = (newDoc: DocumentData | ((prev: DocumentData) => DocumentData)) => {
    setDoc(prev => {
      const updated = typeof newDoc === 'function' ? newDoc(prev) : newDoc;
      
      // Add to history if changed
      if (JSON.stringify(updated) !== JSON.stringify(prev)) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDoc(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDoc(history[newIndex]);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Force update doc content after format? 
    // The onBlur in DocumentPreview will handle saving the HTML.
    // But we might want to trigger it immediately? 
    // For now, rely on user clicking away or typing.
  };

  const printRef = useRef<HTMLDivElement>(null);

  // Autosave simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('current_doc', JSON.stringify(doc));
    }, 2000);
    return () => clearTimeout(timer);
  }, [doc]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('current_doc');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Restore Date objects
        parsed.date = new Date(parsed.date);
        // Merge with INITIAL_DOC to ensure new fields (like 'form') exist
        setDoc({ ...INITIAL_DOC, ...parsed });
      } catch (e) {
        console.error("Failed to load saved doc", e);
      }
    }
  }, []);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setNotification("AI đang soạn thảo văn bản...");
    try {
      const content = await generateDocumentContent(doc, 'create');
      if (content) {
        setDoc(prev => ({ ...prev, content }));
        
        // Also suggest recipients
        const recipients = await suggestRecipients(doc.type, content);
        if (recipients.length > 0) {
          setDoc(prev => ({ ...prev, recipients: [...recipients] }));
        }
        setNotification("Đã sinh nội dung thành công!");
      }
    } catch (error) {
      setNotification("Lỗi khi sinh nội dung.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleValidateAI = async () => {
    setIsGenerating(true);
    setNotification("AI đang kiểm tra lỗi chính tả và thể thức...");
    try {
      const fixedContent = await generateDocumentContent(doc, 'fix');
      if (fixedContent) {
        setDoc(prev => ({ ...prev, content: fixedContent }));
        setNotification("Đã chuẩn hóa nội dung theo NĐ30!");
      }
    } catch (error) {
      setNotification("Lỗi khi kiểm tra.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // @ts-ignore
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${doc.docNumber.replace('/', '-')}_${doc.type}`,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        localStorage.setItem('current_doc', JSON.stringify(doc));
        setNotification("Đã lưu văn bản!");
        setTimeout(() => setNotification(null), 2000);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (handlePrint) handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, handlePrint]);

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Top Bar */}
      <header className="h-12 bg-gov-red text-white flex items-center justify-between px-4 shadow-md z-20 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => setCurrentStep(1)}>
             <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-gov-red font-bold text-[10px] border border-white">
                VN
             </div>
             <span className="font-medium text-sm">Trang chủ</span>
          </div>
          <div className="h-4 w-[1px] bg-white/30"></div>
          <span className="font-bold text-sm">Soạn thảo văn bản</span>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
              {doc.form?.startsWith('Đảng') && <span className="flex items-center gap-1"><CheckCircle size={12}/> Chuẩn Đảng (HD 36)</span>}
              {doc.form?.startsWith('Đoàn') && <span className="flex items-center gap-1"><CheckCircle size={12}/> Chuẩn Đoàn (HD 29)</span>}
              {doc.form?.startsWith('Mặt trận') && <span className="flex items-center gap-1"><CheckCircle size={12}/> Chuẩn Mặt trận (QĐ 207)</span>}
              {doc.form?.startsWith('Hành chính') && <span className="flex items-center gap-1"><CheckCircle size={12}/> Chuẩn Nghị định 30</span>}
              {doc.form?.startsWith('Hợp đồng') && <span className="flex items-center gap-1"><CheckCircle size={12}/> Chuẩn Hợp đồng</span>}
           </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 text-xs font-medium text-gray-500 shrink-0 z-10">
         <div 
            className={`flex items-center gap-2 cursor-pointer ${currentStep === 1 ? 'text-gov-red font-bold' : ''}`}
            onClick={() => setCurrentStep(1)}
         >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-gov-red text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
            Cấu hình chung
         </div>
         <div className="w-8 h-[1px] bg-gray-300 mx-3"></div>
         <div 
            className={`flex items-center gap-2 cursor-pointer ${currentStep === 2 ? 'text-gov-red font-bold' : ''}`}
            onClick={() => setCurrentStep(2)}
         >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-gov-red text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
            Nội dung văn bản
         </div>
         <div className="w-8 h-[1px] bg-gray-300 mx-3"></div>
         <div 
            className={`flex items-center gap-2 cursor-pointer ${currentStep === 3 ? 'text-gov-red font-bold' : ''}`}
            onClick={() => setCurrentStep(3)}
         >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${currentStep === 3 ? 'bg-gov-red text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
            Trợ lý AI & Hoàn thiện
         </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Editor Form OR AI Chat */}
        <div className="w-[500px] shrink-0 border-r border-gray-200 bg-white z-10 shadow-xl overflow-hidden flex flex-col">
          {currentStep === 3 ? (
            <AIChatPanel 
              doc={doc} 
              onUpdateDoc={(newContent) => updateDoc(prev => ({ ...prev, content: newContent }))} 
            />
          ) : (
            <EditorForm 
              data={doc} 
              onChange={updateDoc}
              onGenerateAI={handleGenerateAI}
              onValidateAI={handleValidateAI}
              onExportPdf={() => handlePrint && handlePrint()}
              onExportDocx={() => exportToDocx(doc)}
              isGenerating={isGenerating}
              currentStep={currentStep}
              onNextStep={() => setCurrentStep(currentStep === 1 ? 2 : 3)}
            />
          )}
        </div>

        {/* Right: Preview Area */}
        <div className="flex-1 relative bg-gray-100/50 flex flex-col">
          {/* Toolbar (Only visible in Step 3) */}
          {currentStep === 3 && (
            <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shadow-sm shrink-0">
               <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('bold')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Bold size={16}/></button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('italic')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Italic size={16}/></button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('underline')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Underline size={16}/></button>
               </div>
               <div className="flex items-center gap-1 border-r border-gray-200 pr-2 pl-2">
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('justifyLeft')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><AlignLeft size={16}/></button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('justifyCenter')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><AlignCenter size={16}/></button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('justifyRight')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><AlignRight size={16}/></button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('justifyFull')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><AlignJustify size={16}/></button>
               </div>
               <div className="flex items-center gap-1 border-r border-gray-200 pr-2 pl-2">
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertUnorderedList')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><List size={16}/></button>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertOrderedList')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><ListOrdered size={16}/></button>
               </div>
               <div className="flex items-center gap-1 pl-2">
                  <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30"><Undo size={16}/></button>
                  <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30"><Redo size={16}/></button>
               </div>
               <div className="ml-auto flex items-center gap-2">
                  <button 
                    onClick={() => handlePrint && handlePrint()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700"
                  >
                    <FileText size={14} /> Xuất PDF
                  </button>
                  <button 
                    onClick={() => exportToDocx(doc)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium text-white"
                  >
                    <Save size={14} /> Xuất Word
                  </button>
               </div>
            </div>
          )}

          {/* Zoom Controls (Floating) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-full px-4 py-2 flex items-center gap-4 z-20 mt-12">
             <span className="text-xs font-medium text-gray-500">Bản xem trước (Tiếng Việt)</span>
             <div className="h-4 w-[1px] bg-gray-300"></div>
            <button 
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="p-1 hover:bg-gray-100 rounded text-gray-600"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(200, z + 10))}
              className="p-1 hover:bg-gray-100 rounded text-gray-600"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Document Canvas */}
          <div className="flex-1 overflow-hidden relative">
             <DocumentPreview 
               ref={printRef}
               data={doc} 
               zoom={zoom} 
               onChange={updateDoc}
             />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
