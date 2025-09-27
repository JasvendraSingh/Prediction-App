# pdf_utils.py
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet

def export_to_pdf(table_data: dict, filename: str):
    """
    table_data: dict of teams with stats
    Example:
    {
        "TeamA": {"played": 2, "won": 1, "draw": 0, "lost": 1, "points": 3, "goal_difference": 1},
        ...
    }
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
    elements.append(Paragraph("Final League Table", styles["Title"]))
    elements.append(Spacer(1, 20))

    # Table header
    data = [["Pos", "Team", "P", "W", "D", "L", "GD", "Pts"]]

    # Fill rows
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

    # Build ReportLab table
    t = Table(data, colWidths=[40, 120, 30, 30, 30, 30, 40, 40])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
    ]))

    elements.append(t)
    doc.build(elements)
