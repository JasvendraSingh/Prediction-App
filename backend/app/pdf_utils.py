from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

styles = getSampleStyleSheet()
title_style = styles["Title"]
subtitle_style = styles["Heading2"]
normal_style = styles["BodyText"]

# NORMALIZE MIXED-KEY ROWS
def normalize_keys(row):
    return {
        "team": row["team"],
        "played": row["played"],
        "wins": row.get("wins", row.get("won", 0)),
        "draws": row.get("draws", row.get("draw", 0)),
        "loss": row.get("loss", row.get("lost", 0)),
        "goals_for": row.get("goals_for", 0),
        "goals_against": row.get("goals_against", 0),
        "goal_diff": row.get("goal_diff", row.get("gd", 0)),
        "points": row["points"],
    }


def export_to_pdf(table_data, filename, predictions=None, username=None, league=None):
    doc = SimpleDocTemplate(filename, pagesize=A4)
    story = []

    # HEADER
    def add_header():
        parts = []
        if username:
            parts.append(f"Predictions by: <b>{username}</b>")
        if league:
            parts.append(f"League: <b>{league}</b>")
        if parts:
            story.append(Paragraph(" | ".join(parts), normal_style))
            story.append(Spacer(0, 6))

    # MATCHDAY PREDICTION PAGES
    if predictions:
        for matchday in sorted(predictions.keys(), key=lambda x: int(x)):
            add_header()
            story.append(Paragraph(f"Matchday {matchday} Predictions", title_style))
            story.append(Spacer(0, 12))

            rows = [["Match", "Prediction"]]
            day_preds = predictions[matchday]

            for match, score in day_preds.items():
                home, away = match.split("_vs_")
                rows.append([f"{home} vs {away}", score])

            t = Table(rows, colWidths=[250, 100])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("BOX", (0, 0), (-1, -1), 1, colors.black),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
            ]))

            story.append(t)
            story.append(PageBreak())

    # FINAL TABLE PAGES
    add_header()

    story.append(Paragraph("Final League Table", title_style))
    story.append(Spacer(0, 12))

    headers = ["Pos", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"]
    rows = [headers]

    for i, row in enumerate(table_data, start=1):
        r = normalize_keys(row)
        rows.append([
            i,
            r["team"],
            r["played"],
            r["wins"],
            r["draws"],
            r["loss"],
            r["goals_for"],
            r["goals_against"],
            r["goal_diff"],
            r["points"],
        ])

    chunk_size = 30
    for start in range(0, len(rows), chunk_size):
        chunk = rows[start:start + chunk_size]

        t = Table(chunk, colWidths=[20, 130, 20, 20, 20, 20, 25, 25, 25, 25])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("BOX", (0, 0), (-1, -1), 1, colors.black),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))

        story.append(t)
        story.append(PageBreak())

    doc.build(story)
