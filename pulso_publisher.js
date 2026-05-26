#!/usr/bin/env node
/**
 * PULSO a la IA — Publisher
 * EMPRENDEDORES.LTD
 * Uso: node pulso_publisher.js <borrador.docx> <salida.docx> <edicion>
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, LevelFormat, Header, Footer, TabStopType
} = require('docx');
const fs = require('fs');

const [,, draftPath, outputPath, edicionArg] = process.argv;
if (!draftPath || !outputPath) {
  console.error("Uso: node pulso_publisher.js <borrador.docx> <salida.docx> <edicion>");
  process.exit(1);
}

// Colores
const BLUE       = "1B3A6B";
const ACCENT     = "2E75B6";
const LIGHT_BLUE = "D6E4F0";
const LIGHT_GRAY = "F2F5F8";
const WHITE      = "FFFFFF";
const GRAY       = "555555";
const DARK_TEXT  = "333333";
const CW         = 10080;

// Bordes
const noBorder   = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders  = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinB      = { style: BorderStyle.SINGLE, size: 4, color: ACCENT };
const thinBorders  = { top: thinB, bottom: thinB, left: thinB, right: thinB };
const thickB     = { style: BorderStyle.SINGLE, size: 12, color: ACCENT };
const thickBorders = { top: thickB, bottom: thickB, left: thickB, right: thickB };

// Helpers
function sp(pts) {
  return new Paragraph({ spacing: { before: 0, after: pts * 20 } });
}

function sectionTitle(text) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 140, after: 70 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 3 } },
    children: [ new TextRun({ text: text, font: "Arial", size: 28, bold: true, color: BLUE }) ]
  });
}

function sub(text) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 90, after: 40 },
    children: [ new TextRun({ text: text, font: "Arial", size: 24, bold: true, color: ACCENT }) ]
  });
}

function bl(label, text) {
  return new Paragraph({
    spacing: { before: 20, after: 40 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: label + " ", font: "Arial", size: 22, bold: true, color: BLUE }),
      new TextRun({ text: text, font: "Arial", size: 22, color: DARK_TEXT })
    ]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 20, after: 40 },
    alignment: AlignmentType.JUSTIFIED,
    children: [ new TextRun({ text: text, font: "Arial", size: 22, color: DARK_TEXT }) ]
  });
}

function centered(text, size, color, bold, italic) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 40 },
    children: [ new TextRun({ text: text, font: "Arial", size: size || 19, color: color || GRAY, bold: !!bold, italic: !!italic }) ]
  });
}

function tocEntry(num, title, isMain) {
  var label = num ? (num + "  " + title) : title;
  return new Paragraph({
    spacing: { before: isMain ? 60 : 20, after: 20 },
    tabStops: [{ type: TabStopType.RIGHT, position: CW, leader: "dot" }],
    children: [ new TextRun({ text: label, font: "Arial", size: isMain ? 21 : 19, bold: isMain, color: isMain ? BLUE : GRAY }) ]
  });
}

function infoBox(children) {
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [CW],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CW, type: WidthType.DXA },
            borders: thinBorders,
            shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
            margins: { top: 90, bottom: 90, left: 160, right: 160 },
            children: children
          })
        ]
      })
    ]
  });
}

function accionableBox(children) {
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [CW],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CW, type: WidthType.DXA },
            borders: thickBorders,
            shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 200, right: 200 },
            children: children
          })
        ]
      })
    ]
  });
}

function actionItem(num, text) {
  var sep = text.indexOf(" — ");
  var bold = sep > 0 ? text.substring(0, sep + 3) : text;
  var rest = sep > 0 ? text.substring(sep + 3) : "";
  return new Paragraph({
    spacing: { before: 35, after: 35 },
    alignment: AlignmentType.JUSTIFIED,
    numbering: { reference: "numbers", level: 0 },
    children: [
      new TextRun({ text: bold, font: "Arial", size: 22, bold: true, color: BLUE }),
      new TextRun({ text: rest, font: "Arial", size: 22, color: DARK_TEXT })
    ]
  });
}

function headerBanner(edicion, fecha) {
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [CW],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: BLUE, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 360, right: 360 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60 },
                children: [ new TextRun({ text: "PULSO a la IA", font: "Arial", size: 52, bold: true, color: WHITE }) ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60 },
                children: [ new TextRun({ text: "TENDENCIAS DE LA SEMANA  |  Edicion " + edicion + "  |  " + fecha, font: "Arial", size: 18, color: "BDD7EE" }) ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [ new TextRun({ text: "Por Ricardo Wagner  |  EMPRENDEDORES.LTD", font: "Arial", size: 18, color: "BDD7EE", italic: true }) ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function buildHeader(edicion, fecha) {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 4 } },
        spacing: { before: 0, after: 80 },
        children: [ new TextRun({ text: "PULSO a la IA  |  EMPRENDEDORES.LTD  |  Edicion " + edicion + "  -  " + fecha, font: "Arial", size: 15, color: GRAY }) ]
      })
    ]
  });
}

function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 4 } },
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 0 },
        children: [
          new TextRun({ text: "emprendedores.ec  |  #PULSOalaIA  |  Pagina ", font: "Arial", size: 15, color: GRAY }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 15, color: GRAY }),
          new TextRun({ text: " de ", font: "Arial", size: 15, color: GRAY }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 15, color: GRAY })
        ]
      })
    ]
  });
}

function readDraftData(draftPath) {
  var jsonPath = draftPath.replace('.docx', '_data.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
  return { resumen_ejecutivo: "Ver borrador.", noticias: [], modelos: [], tendencias: [], veredicto: [] };
}

async function main() {
  var edicion = edicionArg || "XX";
  var fecha = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  var data = readDraftData(draftPath);
  var children = [];

  children.push(headerBanner(edicion, fecha));
  children.push(sp(8));

  // Resumen Ejecutivo
  children.push(sectionTitle("Resumen Ejecutivo"));
  children.push(sp(3));
  var resParas = (data.resumen_ejecutivo || "").split("\n").filter(function(l) { return l.trim(); }).map(function(l) { return body(l.trim()); });
  children.push(infoBox(resParas.length ? resParas : [body(data.resumen_ejecutivo || "")]));
  children.push(sp(6));

  // Indice
  children.push(sectionTitle("Contenido"));
  children.push(tocEntry("1.", "Noticias Destacadas", true));
  (data.noticias || []).forEach(function(n, i) {
    children.push(tocEntry("  1." + (i+1), n.titulo || "", false));
  });
  if ((data.modelos || []).length) children.push(tocEntry("2.", "Modelos Destacados", true));
  if ((data.tendencias || []).length) children.push(tocEntry("3.", "Tendencias del Mercado", true));
  children.push(tocEntry("*", "Veredicto Accionable", true));
  children.push(sp(6));

  // Noticias
  children.push(sectionTitle("1. Noticias Destacadas"));
  (data.noticias || []).forEach(function(n, i) {
    children.push(sub("1." + (i+1) + "  " + (n.titulo || "")));
    if (n.que_paso)        children.push(bl("Que paso:", n.que_paso));
    if (n.por_que_importa) children.push(bl("Por que importa:", n.por_que_importa));
    if (n.te_afecta)       children.push(bl("Te afecta:", n.te_afecta));
    if (n.recomendacion)   children.push(bl("Recomendacion:", n.recomendacion));
    children.push(sp(4));
  });

  // Modelos
  if ((data.modelos || []).length) {
    children.push(sectionTitle("2. Modelos Destacados"));
    data.modelos.forEach(function(m, i) {
      children.push(sub("2." + (i+1) + "  " + (m.titulo || "")));
      if (m.descripcion)   children.push(body(m.descripcion));
      if (m.recomendacion) children.push(bl("Recomendacion:", m.recomendacion));
      children.push(sp(4));
    });
  }

  // Tendencias
  if ((data.tendencias || []).length) {
    children.push(sectionTitle("3. Tendencias del Mercado"));
    data.tendencias.forEach(function(t, i) {
      children.push(sub("3." + (i+1) + "  " + (t.titulo || "")));
      if (t.analisis) children.push(body(t.analisis));
      children.push(sp(4));
    });
  }

  // Veredicto
  children.push(sectionTitle("Veredicto Accionable"));
  children.push(sp(4));
  var verItems = (data.veredicto || []).map(function(v, i) { return actionItem(i+1, v); });
  children.push(accionableBox(verItems));
  children.push(sp(6));

  // Cierre
  children.push(centered("#PULSOalaIA  #InteligenciaArtificial  #EmprendedoresLtda  #Ecuador  #LiderazgoTecnico", 17, ACCENT, false, true));
  children.push(centered("Ricardo Wagner-Areco  |  Master en Inteligencia Artificial  |  emprendedores.ec", 17, GRAY, false, true));
  children.push(sp(4));
  children.push(centered("Suscribete: https://emprendedores.ec/suscripcion", 19, ACCENT, true, false));

  var doc = new Document({
    numbering: {
      config: [{
        reference: "numbers",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } }
        }]
      }]
    },
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 650, right: 1080, bottom: 800, left: 1080 }
        }
      },
      headers: { default: buildHeader(edicion, fecha) },
      footers: { default: buildFooter() },
      children: children
    }]
  });

  var buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log("OK: " + outputPath);
}

main().catch(function(e) { console.error(e); process.exit(1); });
