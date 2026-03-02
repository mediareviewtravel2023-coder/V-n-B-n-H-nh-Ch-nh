export type DocumentForm = 'Hành chính (NĐ 30/2020)' | 'Đảng (HD 36-HD/VPTW)' | 'Đoàn (HD 29-HD/TWĐTN-VP)' | 'Mặt trận (QĐ 207/2025)' | 'Hợp đồng (Kinh tế - Dân sự)';

export interface ContractParty {
  type: 'organization' | 'individual';
  name: string;
  address: string;
  taxCode: string;
  representative: string;
  position: string;
  phone: string;
}

export interface CoSigner {
  title: string;
  name: string;
}

export interface DocumentData {
  id: string;
  form: DocumentForm; // Hình thức văn bản
  title: string; // Tên loại văn bản (e.g., QUYẾT ĐỊNH)
  type: string; // Loại văn bản (e.g., Quyết định, Tờ trình)
  orgName: string; // Cơ quan chủ quản (e.g., BỘ GIÁO DỤC VÀ ĐÀO TẠO)
  issuingOrg: string; // Cơ quan ban hành (e.g., TRƯỜNG ĐẠI HỌC X)
  unitCode: string; // Mã đơn vị
  location: string; // Địa danh (e.g., Hà Nội)
  date: Date; // Ngày ban hành
  
  sequenceNumber: string; // Số thứ tự (e.g., 01)
  docNumber: string; // Số hiệu đầy đủ (e.g., 01/QĐ-VNCAI)
  
  excerpt: string; // Trích yếu / Tên văn bản
  content: string; // Nội dung chính (HTML or Text)
  recipients: string[]; // Nơi nhận
  
  signerTitle: string; // Chức vụ người ký (e.g., HIỆU TRƯỞNG)
  signerName: string; // Họ tên người ký
  
  coSigners: CoSigner[]; // Người ký phối hợp
  isJointDoc: boolean; // Văn bản liên tịch
  
  headerAlign: number; // 0-100 slider for header alignment
  
  aiRequest?: string; // Yêu cầu cho AI

  // Contract specific fields
  partyA?: ContractParty;
  partyB?: ContractParty;
  showPartyAOnHeader?: boolean;
}

export const INITIAL_DOC: DocumentData = {
  id: '1',
  form: 'Hành chính (NĐ 30/2020)',
  title: 'QUYẾT ĐỊNH',
  type: 'Quyết định',
  orgName: 'BỘ KHOA HỌC VÀ CÔNG NGHỆ',
  issuingOrg: 'VIỆN NGHIÊN CỨU AI',
  unitCode: 'VNCAI',
  location: 'Hà Nội',
  date: new Date(),
  sequenceNumber: '01',
  docNumber: '01/QĐ-VNCAI',
  excerpt: 'Về việc ban hành quy định sử dụng trợ lý ảo',
  content: `Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;
Căn cứ chức năng, nhiệm vụ của Viện Nghiên cứu AI;
Xét đề nghị của Chánh Văn phòng,

QUYẾT ĐỊNH:

Điều 1. Ban hành kèm theo Quyết định này Quy định về việc sử dụng trợ lý ảo trong công việc hành chính.

Điều 2. Quyết định này có hiệu lực kể từ ngày ký.

Điều 3. Các ông (bà) Chánh Văn phòng, Trưởng các đơn vị trực thuộc chịu trách nhiệm thi hành Quyết định này./.`,
  recipients: ['Như Điều 3', 'Lưu: VT, TCHC'],
  signerTitle: 'VIỆN TRƯỞNG',
  signerName: 'Nguyễn Văn A',
  coSigners: [],
  isJointDoc: false,
  headerAlign: 50,
  aiRequest: '',
  
  partyA: {
    type: 'organization',
    name: 'CÔNG TY TNHH ABC',
    address: 'Số 1, Đường X, Quận Y, Hà Nội',
    taxCode: '0101234567',
    representative: 'Nguyễn Văn A',
    position: 'Giám đốc',
    phone: '0901234567'
  },
  partyB: {
    type: 'organization',
    name: 'CÔNG TY TNHH XYZ',
    address: 'Số 2, Đường Z, Quận T, Hà Nội',
    taxCode: '0109876543',
    representative: 'Trần Thị B',
    position: 'Giám đốc',
    phone: '0909876543'
  },
  showPartyAOnHeader: false
};

export const DOC_FORMS: DocumentForm[] = [
  'Hành chính (NĐ 30/2020)',
  'Đảng (HD 36-HD/VPTW)',
  'Đoàn (HD 29-HD/TWĐTN-VP)',
  'Mặt trận (QĐ 207/2025)',
  'Hợp đồng (Kinh tế - Dân sự)'
];

export const DOC_TYPES_BY_FORM: Record<DocumentForm, string[]> = {
  'Hành chính (NĐ 30/2020)': [
    'Nghị quyết', 'Quyết định', 'Chỉ thị', 'Quy chế', 'Quy định', 
    'Thông cáo', 'Thông báo', 'Hướng dẫn', 'Chương trình', 'Kế hoạch', 
    'Phương án', 'Đề án', 'Dự án', 'Báo cáo', 'Biên bản', 'Tờ trình', 
    'Hợp đồng', 'Công văn', 'Công điện', 'Giấy ủy quyền', 'Giấy mời', 
    'Giấy giới thiệu', 'Giấy nghỉ phép', 'Phiếu gửi', 'Phiếu chuyển', 
    'Phiếu báo', 'Thư công'
  ],
  'Đảng (HD 36-HD/VPTW)': [
    'Nghị quyết', 'Quyết định', 'Chỉ thị', 'Kết luận', 'Quy chế',
    'Quy định', 'Thông báo', 'Hướng dẫn', 'Báo cáo', 'Kế hoạch',
    'Quy hoạch', 'Chương trình', 'Đề án', 'Phương án', 'Dự án',
    'Tờ trình', 'Công văn', 'Biên bản', 'Giấy mời', 'Phiếu gửi'
  ],
  'Đoàn (HD 29-HD/TWĐTN-VP)': [
    'Nghị quyết', 'Quyết định', 'Chương trình', 'Kế hoạch', 'Báo cáo',
    'Tờ trình', 'Thông báo', 'Công văn', 'Hướng dẫn'
  ],
  'Mặt trận (QĐ 207/2025)': [
    'Nghị quyết', 'Quyết định', 'Thông tri', 'Hướng dẫn', 'Báo cáo',
    'Chương trình', 'Kế hoạch', 'Lời kêu gọi'
  ],
  'Hợp đồng (Kinh tế - Dân sự)': [
    'Hợp đồng kinh tế', 
    'Hợp đồng lao động', 
    'Hợp đồng dịch vụ',
    'Hợp đồng mua bán hàng hóa', 
    'Hợp đồng thuê nhà/văn phòng',
    'Hợp đồng thuê khoán', 
    'Hợp đồng hợp tác kinh doanh (BCC)',
    'Hợp đồng chuyển nhượng quyền sử dụng đất',
    'Hợp đồng đặt cọc',
    'Hợp đồng ủy quyền',
    'Hợp đồng vay tài sản',
    'Hợp đồng tặng cho tài sản',
    'Hợp đồng gia công',
    'Hợp đồng vận chuyển',
    'Hợp đồng bảo hiểm',
    'Hợp đồng xây dựng',
    'Thỏa thuận hợp tác',
    'Thỏa thuận bảo mật (NDA)',
    'Biên bản thanh lý hợp đồng',
    'Phụ lục hợp đồng'
  ]
};

export const DOC_TYPES = DOC_TYPES_BY_FORM['Hành chính (NĐ 30/2020)']; // Fallback
