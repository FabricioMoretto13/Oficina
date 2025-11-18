// Busca uma imagem do backend e converte para DataURL
export async function fetchImageAsDataURL(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
// Utilitário para gerar PDF do checklist usando jsPDF
import jsPDF from 'jspdf';

export function gerarChecklistPDF({ cliente, veiculo, checklist }) {
  const doc = new jsPDF();
  let y = 16;
  doc.setFontSize(18);
  doc.text('Checklist de Vistoria', 16, y);
  y += 12;
  doc.setFontSize(12);
  doc.text(`Cliente: ${cliente?.nome || ''}`, 16, y);
  y += 8;
  doc.text(`Telefone: ${cliente?.telefone || ''}`, 16, y);
  y += 8;
  doc.text(`Veículo: ${veiculo?.placa || ''} - ${veiculo?.modelo || ''} (${veiculo?.montadora || veiculo?.marca || ''})`, 16, y);
  y += 12;
  doc.setFontSize(14);
  doc.text('Itens do Checklist:', 16, y);
  y += 8;
  doc.setFontSize(11);
  checklist.forEach((item, idx) => {
    doc.text(`${idx + 1}. ${item.nome}${item.ok ? ' - OK' : ''}`, 18, y);
    y += 6;
    if (item.observacao) {
      doc.text(`Obs: ${item.observacao}`, 22, y);
      y += 6;
    }
    // Adiciona imagens anexadas (fotos)
    if (item.fotos && item.fotos.length) {
      item.fotos.forEach((foto, fidx) => {
        // Detecta tipo da imagem
        let imgType = 'JPEG';
        if (typeof foto === 'string' && foto.startsWith('data:image/png')) imgType = 'PNG';
        if (typeof foto === 'string' && foto.startsWith('data:image/jpeg')) imgType = 'JPEG';
        try {
          doc.addImage(foto, imgType, 22, y, 38, 28);
          y += 30;
        } catch (e) {
          // Se não conseguir renderizar, ignora
        }
      });
      y += 4;
    }
  });
  doc.save('checklist.pdf');
}
