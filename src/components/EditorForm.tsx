import React from 'react';
import { DocumentData, DOC_FORMS, DOC_TYPES_BY_FORM, DocumentForm } from '@/types';
import { Wand2, CheckCircle, FileDown, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface EditorFormProps {
  data: DocumentData;
  onChange: (data: DocumentData) => void;
  onGenerateAI: () => void;
  onValidateAI: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  isGenerating: boolean;
  currentStep: 1 | 2;
  onNextStep: () => void;
}

export const EditorForm: React.FC<EditorFormProps> = ({
  data,
  onChange,
  onGenerateAI,
  onValidateAI,
  onExportPdf,
  onExportDocx,
  isGenerating,
  currentStep,
  onNextStep
}) => {
  
  const handleChange = (field: keyof DocumentData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleFormChange = (newForm: DocumentForm) => {
    const newTypes = DOC_TYPES_BY_FORM[newForm];
    onChange({
      ...data,
      form: newForm,
      type: newTypes[0],
      title: newTypes[0].toUpperCase()
    });
  };

  const currentTypes = DOC_TYPES_BY_FORM[data.form] || DOC_TYPES_BY_FORM['Hành chính (NĐ 30/2020)'];

  return (
    <div className="h-full overflow-y-auto p-6 bg-white border-r border-gray-200">
      <div className="space-y-6">
        
        {/* Step 1: General Configuration */}
        {currentStep === 1 && (
          <>
            {/* Header Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Thông tin chung</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hình thức văn bản</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gov-red focus:border-transparent"
                    value={data.form}
                    onChange={(e) => handleFormChange(e.target.value as DocumentForm)}
                  >
                    {DOC_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loại văn bản</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gov-red focus:border-transparent"
                    value={data.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      handleChange('type', type);
                      handleChange('title', type.toUpperCase());
                    }}
                  >
                    {currentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                {data.form === 'Hợp đồng (Kinh tế - Dân sự)' ? (
                  <>
                    <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-gray-700">Thông tin Bên A</h4>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input 
                            type="checkbox"
                            className="rounded border-gray-300 text-gov-red focus:ring-gov-red"
                            checked={data.showPartyAOnHeader || false}
                            onChange={(e) => handleChange('showPartyAOnHeader', e.target.checked)}
                          />
                          Hiển thị tên Đơn vị Bên A trên tiêu đề hợp đồng
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tên đơn vị / Cá nhân</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyA?.name || ''}
                            onChange={(e) => handleChange('partyA', { ...data.partyA, name: e.target.value })}
                            placeholder="VD: CÔNG TY TNHH ABC"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyA?.address || ''}
                            onChange={(e) => handleChange('partyA', { ...data.partyA, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Mã số thuế</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyA?.taxCode || ''}
                            onChange={(e) => handleChange('partyA', { ...data.partyA, taxCode: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Điện thoại</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyA?.phone || ''}
                            onChange={(e) => handleChange('partyA', { ...data.partyA, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Đại diện</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyA?.representative || ''}
                            onChange={(e) => handleChange('partyA', { ...data.partyA, representative: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Chức vụ</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyA?.position || ''}
                            onChange={(e) => handleChange('partyA', { ...data.partyA, position: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3">Thông tin Bên B</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tên đơn vị / Cá nhân</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyB?.name || ''}
                            onChange={(e) => handleChange('partyB', { ...data.partyB, name: e.target.value })}
                            placeholder="VD: CÔNG TY TNHH XYZ"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyB?.address || ''}
                            onChange={(e) => handleChange('partyB', { ...data.partyB, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Mã số thuế</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyB?.taxCode || ''}
                            onChange={(e) => handleChange('partyB', { ...data.partyB, taxCode: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Điện thoại</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyB?.phone || ''}
                            onChange={(e) => handleChange('partyB', { ...data.partyB, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Đại diện</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyB?.representative || ''}
                            onChange={(e) => handleChange('partyB', { ...data.partyB, representative: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Chức vụ</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            value={data.partyB?.position || ''}
                            onChange={(e) => handleChange('partyB', { ...data.partyB, position: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Cơ quan chủ quản</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm uppercase"
                        value={data.orgName}
                        onChange={(e) => handleChange('orgName', e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Cơ quan ban hành</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm uppercase font-bold"
                        value={data.issuingOrg}
                        onChange={(e) => handleChange('issuingOrg', e.target.value.toUpperCase())}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Số thứ tự</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={data.sequenceNumber}
                      onChange={(e) => handleChange('sequenceNumber', e.target.value)}
                      placeholder="01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Mã đơn vị / Ký hiệu</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm uppercase"
                      value={data.unitCode}
                      onChange={(e) => handleChange('unitCode', e.target.value.toUpperCase())}
                      placeholder="UBND"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Số & Ký hiệu đầy đủ</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={data.docNumber}
                      onChange={(e) => handleChange('docNumber', e.target.value)}
                      placeholder="01/QĐ-UBND"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Ví dụ: 01/QĐ-UBND (Hành chính), 01-QĐ/HU (Đảng), 01-QĐ/TWĐTN (Đoàn)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Địa danh</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    value={data.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ngày ban hành</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    value={format(data.date, 'yyyy-MM-dd')}
                    onChange={(e) => handleChange('date', new Date(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Căn chỉnh Header ({data.headerAlign}%)
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gov-red"
                    value={data.headerAlign}
                    onChange={(e) => handleChange('headerAlign', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={onNextStep}
              className="w-full bg-gov-red text-white py-2 rounded-md font-medium hover:bg-red-700 transition-colors shadow-sm mt-4"
            >
              Tiếp tục: Soạn nội dung
            </button>
          </>
        )}

        {/* Step 2: Content & Signer */}
        {currentStep === 2 && (
          <>
            {/* Content Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Nội dung văn bản</h3>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Trích yếu nội dung</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-16"
                  value={data.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Gợi ý cho AI (Tùy chọn)</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-20 placeholder-gray-400"
                  value={data.aiRequest || ''}
                  onChange={(e) => handleChange('aiRequest', e.target.value)}
                  placeholder="Nhập yêu cầu cụ thể để AI viết nội dung chính xác hơn. Ví dụ: 'Viết quyết định bổ nhiệm ông Nguyễn Văn A làm Trưởng phòng...', 'Soạn hợp đồng thuê nhà 2 năm...'"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-500">Nội dung chi tiết (Văn bản thuần)</label>
                  <button 
                    onClick={onGenerateAI}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-xs text-gov-red font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    <Wand2 size={12} />
                    {isGenerating ? 'Đang viết...' : 'AI Viết nội dung'}
                  </button>
                </div>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-96 font-mono text-xs leading-relaxed"
                  value={data.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Nhập nội dung văn bản tại đây. Sử dụng xuống dòng để tách đoạn..."
                />
              </div>
            </div>

            {/* Signer Section & Recipients - Hide for Contracts */}
            {data.form !== 'Hợp đồng (Kinh tế - Dân sự)' && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Thẩm quyền ký</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Chức vụ</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm uppercase"
                        value={data.signerTitle}
                        onChange={(e) => handleChange('signerTitle', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Họ tên người ký</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm font-bold"
                        value={data.signerName}
                        onChange={(e) => handleChange('signerName', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Recipients */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Nơi nhận</h3>
                  <div className="space-y-2">
                    {data.recipients.map((r, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={r}
                          onChange={(e) => {
                            const newRecipients = [...data.recipients];
                            newRecipients[i] = e.target.value;
                            handleChange('recipients', newRecipients);
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newRecipients = data.recipients.filter((_, idx) => idx !== i);
                            handleChange('recipients', newRecipients);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleChange('recipients', [...data.recipients, ''])}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      + Thêm nơi nhận
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
              <button 
                onClick={onValidateAI}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gov-red text-gov-red py-2 rounded-md font-medium hover:bg-red-50 transition-colors"
              >
                <CheckCircle size={16} />
                Kiểm tra NĐ30
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={onExportDocx}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FileText size={16} />
                  Xuất DOCX
                </button>
                <button 
                  onClick={onExportPdf}
                  className="flex-1 flex items-center justify-center gap-2 bg-gov-red text-white py-2 rounded-md font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  <FileDown size={16} />
                  Xuất PDF
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
