import { GoogleGenAI } from "@google/genai";
import { DocumentData } from '@/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateDocumentContent = async (docData: DocumentData, promptType: 'create' | 'fix' | 'suggest') => {
  const model = "gemini-3.1-pro-preview"; // Using Pro for high quality generation
  
  let prompt = "";
  
  if (promptType === 'create') {
    prompt = `
      Bạn là một chuyên gia soạn thảo văn bản hành chính Việt Nam.
      Hãy soạn thảo nội dung chính cho một văn bản thuộc hình thức: "${docData.form}".
      
      Thông tin văn bản:
      - Loại văn bản: ${docData.type}
      - Trích yếu: ${docData.excerpt}
      - Cơ quan ban hành: ${docData.issuingOrg}
      - Người ký: ${docData.signerTitle} ${docData.signerName}
      ${docData.aiRequest ? `- Yêu cầu cụ thể từ người dùng: "${docData.aiRequest}"` : ''}
      ${docData.form === 'Hợp đồng (Kinh tế - Dân sự)' ? `
      - Bên A: ${docData.partyA?.name}, Đại diện: ${docData.partyA?.representative}
      - Bên B: ${docData.partyB?.name}, Đại diện: ${docData.partyB?.representative}
      ` : ''}
      
      Yêu cầu về cấu trúc và văn phong:
      - Nếu là "Hành chính (NĐ 30/2020)": Tuân thủ chặt chẽ Nghị định 30/2020/NĐ-CP. Dùng "Căn cứ...", "Xét đề nghị...", "QUYẾT ĐỊNH/THÔNG BÁO...".
      - Nếu là "Đảng (HD 36-HD/VPTW)": Tuân thủ Hướng dẫn 36 của Văn phòng Trung ương Đảng. Dùng "Căn cứ...", "Xét...", "BAN THƯỜNG VỤ/CẤP ỦY QUYẾT ĐỊNH...".
      - Nếu là "Đoàn (HD 29-HD/TWĐTN-VP)": Tuân thủ Hướng dẫn của Trung ương Đoàn.
      - Nếu là "Hợp đồng": 
        + KHÔNG viết lại phần thông tin Bên A/Bên B (vì đã có trong layout).
        + Bắt đầu ngay vào phần "Điều 1. ...", "Điều 2. ...".
        + Nội dung gồm các điều khoản chi tiết phù hợp với loại hợp đồng "${docData.type}".
      
      Yêu cầu chung:
      - Chỉ trả về phần nội dung chính (không bao gồm quốc hiệu, tiêu ngữ, phần ký tên).
      - Trả về dạng VĂN BẢN THUẦN (Plain Text), KHÔNG dùng Markdown hay HTML.
      - Sử dụng xuống dòng để tách đoạn.
      - Các mục như "Điều 1.", "1.", "a)" cần viết rõ ràng đầu dòng.
      - Ngôn ngữ trang trọng, chuẩn mực.
    `;
  } else if (promptType === 'fix') {
    prompt = `
      Kiểm tra và chỉnh sửa đoạn văn bản sau theo chuẩn chính tả và văn phong phù hợp với hình thức "${docData.form}":
      "${docData.content}"
      
      Yêu cầu:
      - Trả về nội dung đã chỉnh sửa dưới dạng VĂN BẢN THUẦN (Plain Text).
      - Giữ nguyên ý nghĩa, chỉ thay đổi câu từ cho trang trọng và đúng chuẩn.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const suggestRecipients = async (docType: string, content: string) => {
  const model = "gemini-3-flash-preview"; // Using Flash for speed
  const prompt = `
    Dựa vào loại văn bản "${docType}" và nội dung tóm tắt: "${content.substring(0, 500)}...",
    hãy gợi ý danh sách "Nơi nhận" phù hợp theo chuẩn hành chính Việt Nam.
    Trả về kết quả dưới dạng JSON array các chuỗi string. Ví dụ: ["Như Điều 3", "Lưu: VT", "Ban Giám đốc"].
    Không giải thích gì thêm.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};

export const rewriteText = async (text: string, instruction?: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Bạn là trợ lý biên tập văn bản. Hãy viết lại đoạn văn bản sau đây.
    
    Đoạn văn gốc: "${text}"
    
    ${instruction ? `Yêu cầu cụ thể: ${instruction}` : 'Yêu cầu: Viết lại cho hay hơn, trang trọng hơn, đúng văn phong hành chính, giữ nguyên ý nghĩa.'}
    
    Chỉ trả về đoạn văn mới (Plain text), không thêm dấu ngoặc kép hay lời dẫn.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("AI Rewrite Error:", error);
    return text;
  }
};

export const chatWithDocument = async (
  docData: DocumentData, 
  userPrompt: string, 
  history: { role: 'user' | 'model', text: string }[]
) => {
  const model = "gemini-3.1-pro-preview"; // Use Pro for complex reasoning
  
  const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n');
  
  const prompt = `
    Bạn là một trợ lý AI chuyên nghiệp về soạn thảo văn bản hành chính.
    
    Thông tin văn bản hiện tại:
    - Loại: ${docData.type}
    - Trích yếu: ${docData.excerpt}
    - Nội dung hiện tại:
    """
    ${docData.content}
    """
    
    Lịch sử trò chuyện:
    ${historyText}
    
    Yêu cầu mới từ người dùng: "${userPrompt}"
    
    Nhiệm vụ của bạn:
    1. Phân tích yêu cầu của người dùng.
    2. Nếu người dùng yêu cầu chỉnh sửa nội dung, hãy viết lại toàn bộ nội dung văn bản đã được chỉnh sửa.
    3. Nếu người dùng chỉ hỏi thông tin hoặc yêu cầu giải thích, hãy giữ nguyên nội dung cũ.
    4. Trả về kết quả dưới dạng JSON với cấu trúc:
    {
      "reply": "Câu trả lời của bạn dành cho người dùng (ngắn gọn, lịch sự)",
      "updatedContent": "Nội dung văn bản mới (nếu có thay đổi, nếu không thì để null hoặc chuỗi rỗng)"
    }
    
    Lưu ý:
    - Chỉ trả về JSON hợp lệ, không thêm markdown formatting (như \`\`\`json).
    - updatedContent phải là VĂN BẢN THUẦN (Plain Text), giữ nguyên cấu trúc dòng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as { reply: string, updatedContent?: string };
  } catch (error) {
    console.error("AI Chat Error:", error);
    return { 
      reply: "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.", 
      updatedContent: null 
    };
  }
};
