/**
 * Peşə Kitabxanası - Ağıllı Kitabxanaçı Köməkçisi Xidməti (AI Assistant Service)
 * 
 * Bu xidmət oxucu və kitabxanaçılara təbii dildə sorğular üzrə
 * biblioqrafik axtarış, rəf istiqamətləndirməsi və tövsiyələr verir.
 * Real fond bazası (books-service) ilə inteqrasiyalıdır və
 * gələcək xarici LLM (məsələn, Gemini API) qoşulmasına tam hazırdır.
 */

import { getBooks, Book } from "./books-service";

export interface AiChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  recommendedBooks?: Book[];
}

export interface AiResponse {
  answer: string;
  recommendedBooks: Book[];
}

/**
 * Təbii dil sorğusunu emal edərək fond bazasından müvafiq nəşrləri və izahatı təqdim edir
 */
export async function askAiAssistant(query: string): Promise<AiResponse> {
  // Simulyasiya edilən süni intellekt emal gecikməsi (realistik UX üçün)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const books = await getBooks();
  const q = query.toLowerCase().trim();

  // Kitabxana fondu tamamilə boşdursa:
  if (books.length === 0) {
    return {
      answer: `Salam! Mən Peşə Kitabxanası Köməkçisiyəm. Hazırda Lənkəran Dövlət Peşə Təhsil Mərkəzinin kitabxana fondunda qeydiyyatda olan nəşr yoxdur. Zəhmət olmasa, əvvəlcə "Kitab fondu" bölməsindən yeni dərsliklər və kitablar daxil edin. Bundan sonra sizə dərhal rəf ünvanları və tövsiyələr təqdim edə biləcəyəm.`,
      recommendedBooks: [],
    };
  }

  // Sorğuya uyğun kitabların axtarışı
  const matchedBooks = books.filter((b) => {
    const titleMatch = b.title.toLowerCase().includes(q);
    const authorMatch = b.author.toLowerCase().includes(q);
    const categoryMatch = b.category.toLowerCase().includes(q);
    const descMatch = b.description ? b.description.toLowerCase().includes(q) : false;

    // Açar sözlər üzrə assosiativ axtarış
    const isTech = (q.includes("proqram") || q.includes("it") || q.includes("kod") || q.includes("kompüter") || q.includes("alqoritm")) &&
      (b.category.includes("İnformasiya") || b.title.toLowerCase().includes("şəbəkə") || b.title.toLowerCase().includes("proqram"));

    const isAuto = (q.includes("avto") || q.includes("maşın") || q.includes("mühərrik") || q.includes("mühəndis")) &&
      (b.category.includes("Avtomobil") || b.category.includes("Elektro"));

    const isLiterature = (q.includes("bədii") || q.includes("roman") || q.includes("hekayə") || q.includes("ədəbiyyat")) &&
      b.category.includes("Bədii");

    return titleMatch || authorMatch || categoryMatch || descMatch || isTech || isAuto || isLiterature;
  });

  if (matchedBooks.length > 0) {
    const availableCount = matchedBooks.reduce((acc, b) => acc + b.availableCount, 0);

    let answer = `Sorğunuz üzrə kitabxana fondunu təhlil etdim. Axtarışınıza uyğun **${matchedBooks.length} adda nəşr** (cəmi ${availableCount} mövcud nüsxə) müəyyən olundu.`;

    if (q.includes("rəf") || q.includes("harada") || q.includes("ünvan")) {
      answer += ` Kitabların rəf ünvanları kartların üzərində qeyd olunub. Birbaşa qeyd olunan zala yaxınlaşaraq nüsxəni əldə edə bilərsiniz.`;
    } else {
      answer += ` Aşağıdakı tövsiyə kartlarından kitabın fiziki rəf ünvanını yoxlaya və ya birbaşa dövriyyə/istiqraz əməliyyatına yönləndirə bilərsiniz:`;
    }

    return {
      answer,
      recommendedBooks: matchedBooks.slice(0, 4),
    };
  }

  // Heç bir kitab tapılmadıqda:
  return {
    answer: `"${query}" mövzusu üzrə hazırda fondumuzda birbaşa uyğunluq təşkil edən aktiv nəşr tapılmadı. Kitabxana fondunda digər sahələr (məsələn: ${books.slice(0, 3).map((b) => b.category).join(", ")}) üzrə kitablar mövcuddur. İstəsəniz fərqli açar sözlərlə axtara və ya metodiki vəsait sifarişi üçün "Rezervasiyalar" bölməsindən qeydiyyat apara bilərsiniz.`,
    recommendedBooks: [],
  };
}

