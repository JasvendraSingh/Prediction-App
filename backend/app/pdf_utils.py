# backend/app/pdf_utils.py
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet

def export_to_pdf(table_data: dict, filename: str, predictions: dict = None):
    """
    table_data: dict of teams with stats
    predictions: dict of matchday -> match -> score
    """

    # Sort by Points, then Goal Difference, then Team Name
    standings = sorted(
        table_data.items(),
        key=lambda x: (x[1]["points"], x[1]["goal_difference"], x[0]),
        reverse=True,
    )

    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # Title
    elements.append(Paragraph("Full Predictions Summary", styles["Title"]))
    elements.append(Spacer(1, 20))

    # Include all predictions first
    if predictions:
        for md, games in predictions.items():
            elements.append(Paragraph(f"Matchday {md}", styles["Heading2"]))
            match_list = []
            for match, score in games.items():
                # score can be dict or string depending on frontend format
                if isinstance(score, dict):
                    formatted = f"{score.get('homeScore', '')}-{score.get('awayScore', '')}"
                else:
                    formatted = str(score)
                match_list.append([match, formatted])
            t = Table(match_list, colWidths=[320, 80])
            t.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
                ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 12))
        elements.append(Spacer(1, 20))

    # Add final table
    elements.append(Paragraph("Final League Table", styles["Heading1"]))
    elements.append(Spacer(1, 10))

    data = [["Pos", "Team", "P", "W", "D", "L", "GD", "Pts"]]
    for idx, (team, stats) in enumerate(standings, start=1):
        data.append([
            idx,
            team,
            stats["played"],
            stats["won"],
            stats["draw"],
            stats["lost"],
            stats["goal_difference"],
            stats["points"],
        ])

    t = Table(data, colWidths=[40, 120, 30, 30, 30, 30, 40, 40])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
    ]))

    elements.append(t)
    doc.build(elements)
