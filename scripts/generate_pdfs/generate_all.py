#!/usr/bin/env python3
"""Generates 7 sample PDFs for the Smrčak demo using ReportLab + DejaVu Sans.

Run from scripts/generate_pdfs/:
  ./venv/bin/python generate_all.py
"""

from __future__ import annotations

import os
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"
OUT = HERE / "output"
OUT.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("DejaVu", str(FONTS / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", str(FONTS / "DejaVuSans-Bold.ttf")))


# Styles
def make_styles():
    styles = getSampleStyleSheet()
    styles["Normal"].fontName = "DejaVu"
    styles["Normal"].fontSize = 9
    styles["Normal"].leading = 13

    styles.add(
        ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="DejaVu-Bold",
            fontSize=18,
            leading=22,
            spaceAfter=10,
            textColor=colors.HexColor("#2C5F2D"),
        )
    )
    styles.add(
        ParagraphStyle(
            "Section",
            parent=styles["Normal"],
            fontName="DejaVu-Bold",
            fontSize=11,
            leading=14,
            spaceBefore=8,
            spaceAfter=4,
            textColor=colors.HexColor("#2C5F2D"),
        )
    )
    styles.add(
        ParagraphStyle(
            "Small",
            parent=styles["Normal"],
            fontSize=8,
            leading=11,
            textColor=colors.grey,
        )
    )
    return styles


STYLES = make_styles()

SMRCAK_HEADER = (
    "<font name='DejaVu-Bold' size='14' color='#2C5F2D'>SMRČAK d.o.o.</font><br/>"
    "Karakaj 54a, 75400 Zvornik, Bosna i Hercegovina<br/>"
    "JIB: 4400233560009  ·  www.smrcak.com  ·  prodaja@smrcak.com"
)

FOOTER = (
    "Smrčak d.o.o. · Karakaj 54a, 75400 Zvornik · BiH · "
    "Organic Cert., BioSuisse, IFS Food, GLOBAL G.A.P."
)


def header_block():
    return [Paragraph(SMRCAK_HEADER, STYLES["Normal"]), Spacer(1, 4 * mm)]


def footer_canvas(canvas, doc):
    canvas.saveState()
    canvas.setFont("DejaVu", 7)
    canvas.setFillColor(colors.grey)
    canvas.drawString(20 * mm, 12 * mm, FOOTER)
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"Strana {doc.page}")
    canvas.restoreState()


def build_table(rows, col_widths=None, head=True):
    style_cmds = [
        ("FONT", (0, 0), (-1, -1), "DejaVu", 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E0D5")),
    ]
    if head:
        style_cmds += [
            ("FONT", (0, 0), (-1, 0), "DejaVu-Bold", 9),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F5F1E8")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#2C5F2D")),
        ]
    return Table(rows, colWidths=col_widths, style=TableStyle(style_cmds))


def build_pdf(filename: str, title: str, body):
    path = OUT / filename
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=22 * mm,
        title=title,
    )
    story = header_block() + [Paragraph(title, STYLES["DocTitle"])] + body
    doc.build(story, onFirstPage=footer_canvas, onLaterPages=footer_canvas)
    print(f"  ✓ {filename}")


def make_komercijalna_faktura():
    title = "Handelsrechnung / Komercijalna faktura"
    body = [
        Paragraph(
            "<b>Rechnungsnummer:</b> 2026/0143  &nbsp;&nbsp;  <b>Datum:</b> 25.04.2026",
            STYLES["Normal"],
        ),
        Spacer(1, 3 * mm),
        Paragraph(
            "<b>Käufer / Kupac:</b><br/>"
            "Bio Naturkost GmbH<br/>"
            "Münchner Str. 42, 80331 München, Deutschland<br/>"
            "USt-IdNr.: DE123456789",
            STYLES["Normal"],
        ),
        Spacer(1, 4 * mm),
        Paragraph("Artikel / Sadržaj pošiljke", STYLES["Section"]),
        build_table(
            [
                ["Pos.", "Bezeichnung", "Menge", "Preis/kg", "Betrag"],
                ["1", "Getrocknete Steinpilze – Klasse A", "500 kg", "37,00 €", "18.500,00 €"],
            ],
            col_widths=[12 * mm, 90 * mm, 22 * mm, 22 * mm, 24 * mm],
        ),
        Spacer(1, 4 * mm),
        build_table(
            [
                ["Zwischensumme", "18.500,00 €"],
                ["MwSt. (Befreit – innergemeinschaftliche Lieferung)", "0,00 €"],
                ["Gesamtbetrag", "18.500,00 €"],
            ],
            col_widths=[140 * mm, 30 * mm],
            head=False,
        ),
        Spacer(1, 6 * mm),
        Paragraph("Zahlungsbedingungen", STYLES["Section"]),
        Paragraph(
            "Anzahlung 30% – fällig sofort. Restbetrag bei Lieferung.<br/>"
            "Bank: UniCredit Bank Sarajevo · IBAN: BA39 1610 2000 0000 0000 · SWIFT: UNCRBA22",
            STYLES["Normal"],
        ),
        Spacer(1, 4 * mm),
        Paragraph(
            "Lieferbedingungen: DAP München (Incoterms 2020). Lieferzeit: 7 Werktage.",
            STYLES["Normal"],
        ),
        Spacer(1, 4 * mm),
        Paragraph(
            "Beigefügte Dokumente: Packliste, CMR, EUR.1, BioSuisse-Begleitschein, "
            "Phytosanitäres Zertifikat.",
            STYLES["Small"],
        ),
    ]
    build_pdf("komercijalna_faktura_de.pdf", title, body)


def make_packing_list():
    title = "Packing list / Packliste"
    body = [
        Paragraph(
            "<b>Sendungsnummer / Pošiljka:</b> 2026/0143  &nbsp;&nbsp; "
            "<b>Datum:</b> 25.04.2026",
            STYLES["Normal"],
        ),
        Spacer(1, 3 * mm),
        Paragraph("Verpackungsdetails / Detalji pakovanja", STYLES["Section"]),
        build_table(
            [
                ["Karton", "Inhalt", "Lot", "Brutto", "Netto"],
                ["1–50", "Getrocknete Steinpilze, 5 kg/Sack", "SV-2026-014", "300 kg", "250 kg"],
                ["51–100", "Getrocknete Steinpilze, 5 kg/Sack", "SV-2026-018", "300 kg", "250 kg"],
            ],
            col_widths=[20 * mm, 80 * mm, 30 * mm, 22 * mm, 22 * mm],
        ),
        Spacer(1, 4 * mm),
        build_table(
            [
                ["Total cartons / Ukupno paketa", "100"],
                ["Total gross weight / Bruto težina", "600 kg"],
                ["Total net weight / Neto težina", "500 kg"],
                ["Volume", "1.40 m³"],
            ],
            col_widths=[120 * mm, 50 * mm],
            head=False,
        ),
        Spacer(1, 5 * mm),
        Paragraph(
            "Hinweise: Trocken lagern. Vor Sonnenlicht schützen. Maximaler Stapeldruck 4.",
            STYLES["Small"],
        ),
    ]
    build_pdf("packing_list.pdf", title, body)


def make_cmr():
    title = "CMR – Internationaler Frachtbrief"
    body = [
        build_table(
            [
                ["1. Versender / Pošiljalac", "2. Empfänger / Kupac"],
                [
                    "Smrčak d.o.o.\nKarakaj 54a, 75400 Zvornik\nBiH",
                    "Bio Naturkost GmbH\nMünchner Str. 42, 80331 München\nDeutschland",
                ],
            ],
            col_widths=[85 * mm, 85 * mm],
        ),
        Spacer(1, 3 * mm),
        build_table(
            [
                ["3. Übernahmeort", "4. Ablieferungsort"],
                ["Zvornik, BiH", "München, DE"],
                ["5. Datum der Übernahme", "6. ETA"],
                ["02.05.2026", "06.05.2026"],
            ],
            col_widths=[85 * mm, 85 * mm],
        ),
        Spacer(1, 3 * mm),
        Paragraph("8. Versendete Sendungen", STYLES["Section"]),
        build_table(
            [
                ["Markings", "Anz.", "Verpackung", "Inhalt", "Gewicht"],
                ["BN-2026/0143", "100", "Karton", "Getr. Steinpilze", "600 kg"],
            ],
            col_widths=[35 * mm, 15 * mm, 30 * mm, 60 * mm, 25 * mm],
        ),
        Spacer(1, 4 * mm),
        Paragraph(
            "<b>Frachtführer:</b> Cargo Express Logistics, BG-127-AT<br/>"
            "<b>Fahrer:</b> Marko Jovanović",
            STYLES["Normal"],
        ),
    ]
    build_pdf("cmr.pdf", title, body)


def make_eur1():
    title = "EUR.1 – Warenverkehrsbescheinigung"
    body = [
        Paragraph(
            "Movement certificate Nr. <b>BG/2026/04/0143</b><br/>"
            "Issued at <b>Carinska uprava BiH, Zvornik</b> on 25.04.2026.",
            STYLES["Normal"],
        ),
        Spacer(1, 4 * mm),
        build_table(
            [
                ["Exporter", "Smrčak d.o.o., Karakaj 54a, 75400 Zvornik, BiH"],
                ["Consignee", "Bio Naturkost GmbH, Münchner Str. 42, 80331 München"],
                ["Country of origin", "Bosna i Hercegovina"],
                ["Country of destination", "Deutschland (EU)"],
                ["Means of transport", "Truck (Cargo Express)"],
            ],
            col_widths=[55 * mm, 115 * mm],
            head=False,
        ),
        Spacer(1, 4 * mm),
        Paragraph("Beschreibung der Waren", STYLES["Section"]),
        build_table(
            [
                ["HS Code", "Beschreibung", "Menge", "Wert"],
                ["0712.39", "Getrocknete Steinpilze (Boletus edulis), Klasse A", "500 kg", "18.500,00 €"],
            ],
            col_widths=[25 * mm, 95 * mm, 25 * mm, 25 * mm],
        ),
        Spacer(1, 6 * mm),
        Paragraph(
            "Wir bestätigen die ursprüngliche Herkunft der oben aufgeführten Waren in "
            "Bosna i Hercegovina gemäß den Bestimmungen des CEFTA-Abkommens.",
            STYLES["Normal"],
        ),
    ]
    build_pdf("eur1.pdf", title, body)


def make_biosuisse():
    title = "BioSuisse – Begleitdokument"
    body = [
        Paragraph(
            "Begleitschein für organische Produkte<br/>"
            "<b>Sendungsnummer:</b> 2026/0143 &nbsp;&nbsp; <b>Datum:</b> 25.04.2026",
            STYLES["Normal"],
        ),
        Spacer(1, 4 * mm),
        Paragraph("Rückverfolgbarkeit / Sledljivost", STYLES["Section"]),
        build_table(
            [
                ["Lot", "Produzent / Kooperant", "Lokation", "Erntedatum", "Menge"],
                ["SV-2026-014", "Mehmedović Sefer", "Karakaj 7", "12.04.2026", "300 kg"],
                ["SV-2026-018", "Petrović Milan", "Bratunac 3", "14.04.2026", "200 kg"],
            ],
            col_widths=[28 * mm, 50 * mm, 30 * mm, 30 * mm, 22 * mm],
        ),
        Spacer(1, 4 * mm),
        build_table(
            [
                ["Zertifikat-Nr.", "BS-2026-SMRCAK-12"],
                ["Zertifizierungsstelle", "BioSuisse, Bio Inspecta AG, Frick"],
                ["Gültig bis", "31.08.2027"],
                ["Anzahl Pilzarten", "Boletus edulis (Steinpilz) 100%"],
                ["Sammelmethode", "Wildgesammelt – mediterrane Bergregion"],
            ],
            col_widths=[55 * mm, 115 * mm],
            head=False,
        ),
        Spacer(1, 4 * mm),
        Paragraph(
            "Die in diesem Dokument aufgeführten Waren entsprechen den BioSuisse-Richtlinien "
            "und sind zur Verwendung im BioSuisse-Knospe-Programm zugelassen.",
            STYLES["Small"],
        ),
    ]
    build_pdf("biosuisse_organic.pdf", title, body)


def make_fitosanitarni():
    title = "Phytosanitäres Zertifikat"
    body = [
        Paragraph(
            "Plant health certificate Nr. <b>FS-2026-0156</b><br/>"
            "Issuing authority: <b>Uprava BiH za zaštitu zdravlja bilja</b><br/>"
            "Date of issue: 20.04.2026",
            STYLES["Normal"],
        ),
        Spacer(1, 4 * mm),
        build_table(
            [
                ["Exporter", "Smrčak d.o.o., Karakaj 54a, 75400 Zvornik, BiH"],
                ["Consignee", "München Bio, Sendlinger Str. 24, 80331 München, DE"],
                ["Means of transport", "Truck (Cargo Express)"],
                ["Place of origin", "Bosna i Hercegovina"],
                ["Sendungsnummer", "2026/0156"],
            ],
            col_widths=[55 * mm, 115 * mm],
            head=False,
        ),
        Spacer(1, 4 * mm),
        Paragraph("Verpackung und Inhalt", STYLES["Section"]),
        build_table(
            [
                ["Botanischer Name", "Menge", "Verpackung"],
                ["Cantharellus cibarius (getrocknete Pfifferlinge)", "100 kg", "20 × 5 kg Sack"],
            ],
            col_widths=[100 * mm, 35 * mm, 35 * mm],
        ),
        Spacer(1, 4 * mm),
        Paragraph(
            "Die oben beschriebenen Pflanzen oder Pflanzenerzeugnisse wurden gemäß den geltenden "
            "amtlichen Verfahren untersucht und sind frei von Quarantäneschadorganismen.",
            STYLES["Normal"],
        ),
        Spacer(1, 6 * mm),
        Paragraph("Inspektor: Dr. Aleksandar Marković, Sektor za fitosanitarnu inspekciju", STYLES["Small"]),
    ]
    build_pdf("fitosanitarni.pdf", title, body)


def make_izvozna_deklaracija():
    title = "Izvozna carinska deklaracija"
    body = [
        Paragraph(
            "<b>Carinski referentni broj:</b> 2026/IZ/0143<br/>"
            "<b>Datum:</b> 25.04.2026 &nbsp;&nbsp; <b>Carinarnica:</b> Zvornik",
            STYLES["Normal"],
        ),
        Spacer(1, 4 * mm),
        build_table(
            [
                ["Izvoznik", "Smrčak d.o.o., Karakaj 54a, 75400 Zvornik"],
                ["Primalac", "Bio Naturkost GmbH, München, DE"],
                ["Zemlja porijekla", "Bosna i Hercegovina"],
                ["Zemlja odredišta", "Njemačka (EU)"],
                ["Vrsta transporta", "Drumski – Cargo Express"],
                ["Granični prijelaz", "Šepak / Bezdan"],
            ],
            col_widths=[50 * mm, 120 * mm],
            head=False,
        ),
        Spacer(1, 4 * mm),
        Paragraph("Roba", STYLES["Section"]),
        build_table(
            [
                ["Tarifna oznaka", "Opis robe", "Količina", "Vrijednost"],
                ["0712.39", "Sušeni vrganji klasa A", "500 kg", "18.500,00 €"],
            ],
            col_widths=[30 * mm, 90 * mm, 25 * mm, 25 * mm],
        ),
        Spacer(1, 6 * mm),
        Paragraph(
            "Carinski službenik: Senad Hodžić &nbsp;&nbsp; Pečat: __________",
            STYLES["Small"],
        ),
    ]
    build_pdf("izvozna_deklaracija.pdf", title, body)


def main():
    print("Generating PDFs into output/...")
    make_komercijalna_faktura()
    make_packing_list()
    make_cmr()
    make_eur1()
    make_biosuisse()
    make_fitosanitarni()
    make_izvozna_deklaracija()
    print(f"\nAll done. Files in {OUT}")


if __name__ == "__main__":
    main()
