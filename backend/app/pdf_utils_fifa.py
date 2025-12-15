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

# ================== STYLES ==================
styles = getSampleStyleSheet()
TITLE = styles["Title"]
H2 = styles["Heading2"]
H3 = styles["Heading3"]
BODY = styles["BodyText"]

# ================== HELPERS ==================
def match_str(m):
    sa = m.get("scoreA", "")
    sb = m.get("scoreB", "")
    txt = f"{m['teamA']} {sa}–{sb} {m['teamB']}"
    if m.get("penaltyWinner"):
        txt += f" (Pens: {m['penaltyWinner']})"
    if m.get("winner"):
        txt += f" — {m['winner']}"
    return txt

def compact_group_block(group, matches):
    rows = [[f"Group {group}"]]
    for m in matches:
        if m.get("played"):
            rows.append([match_str(m)])

    t = Table(rows, colWidths=[170])
    t.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )
    return t

def group_table(group, table):
    rows = [["Team", "P", "Pts", "GD", "GF"]]

    sorted_teams = sorted(
        table.items(),
        key=lambda x: (-x[1]["points"], -x[1]["gd"], -x[1]["gf"], x[0]),
    )

    for team, s in sorted_teams:
        rows.append([
            team,
            s["played"],
            s["points"],
            s["gd"],
            s["gf"],
        ])

    t = Table(rows, colWidths=[110, 30, 35, 35, 35])
    t.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.black),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ]
        )
    )
    return [
        Paragraph(f"Group {group}", H3),
        Spacer(0, 4),
        t,
    ]

def knockout_table(title, matches):
    rows = [["Match", "Score", "Winner"]]
    for m in matches.values():
        score = f"{m.get('scoreA','')}–{m.get('scoreB','')}"
        if m.get("penaltyWinner"):
            score += " (pens)"
        rows.append([
            f"{m['teamA']} vs {m['teamB']}",
            score,
            m.get("winner", ""),
        ])

    t = Table(rows, colWidths=[220, 90, 150])
    t.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkred),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )
    return [Paragraph(title, H3), Spacer(0, 6), t, Spacer(0, 12)]


# ================== MAIN EXPORT ==================
def export_fifa_worldcup_pdf(state, filename, username=None):
    doc = SimpleDocTemplate(filename, pagesize=A4)
    story = []

    # ================= COVER =================
    story.append(Paragraph("FIFA World Cup Tournament Record", TITLE))
    story.append(Spacer(0, 10))

    if username:
        story.append(Paragraph(f"Predictions by: <b>{username}</b>", BODY))
        story.append(Spacer(0, 10))

    playoffs = state.get("playoffs")
    if playoffs:
        story.append(Paragraph("Playoff Qualification Results", H2))
        for rnd, matches in playoffs.items():
            story.append(Paragraph(rnd.upper(), H3))
            for m in matches:
                story.append(Paragraph(match_str(m), BODY))
            story.append(Spacer(0, 6))

    story.append(PageBreak())

    # ================= GROUP STAGE MATCHES =================
    story.append(Paragraph("Group Stage Matches", H2))
    story.append(Spacer(0, 8))

    group_blocks = []
    for g, matches in state.get("matches", {}).items():
        group_blocks.append(compact_group_block(g, matches))

    rows = []
    for i in range(0, len(group_blocks), 3):
        rows.append(group_blocks[i:i + 3])

    grid = Table(rows, colWidths=[180, 180, 180])
    grid.setStyle([("VALIGN", (0, 0), (-1, -1), "TOP")])
    story.append(grid)

    story.append(PageBreak())

    # ================= GROUP STAGE TABLES =================
    story.append(Paragraph("Group Stage Standings", H2))
    story.append(Spacer(0, 8))

    tables = []
    for g, table in state.get("group_tables", {}).items():
        tables.append(group_table(g, table))

    for i in range(0, len(tables), 6):
        chunk = tables[i:i + 6]
        grid_rows = []
        for r in range(0, len(chunk), 2):
            grid_rows.append(chunk[r:r + 2])

        grid = Table(grid_rows, colWidths=[270, 270])
        grid.setStyle([("VALIGN", (0, 0), (-1, -1), "TOP")])
        story.append(grid)

        if i + 6 < len(tables):
            story.append(PageBreak())

    story.append(PageBreak())

    # ================= THIRD-PLACED TEAMS =================
    third_ranked = []

    for g, table in state.get("group_tables", {}).items():
        sorted_teams = sorted(
            table.items(),
            key=lambda x: (-x[1]["points"], -x[1]["gd"], -x[1]["gf"], x[0]),
        )
        team, stats = sorted_teams[2]
        third_ranked.append({"team": team, "group": g, **stats})

    ranked = sorted(
        third_ranked,
        key=lambda x: (-x["points"], -x["gd"], -x["gf"], x["team"]),
    )

    rows = [["Rank", "Team", "Group", "Pts", "GD", "GF"]]
    for i, t in enumerate(ranked, start=1):
        rows.append([
            i,
            t["team"],
            t["group"],
            t["points"],
            t["gd"],
            t["gf"],
        ])

    table = Table(rows)
    style_cmds = [
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.darkgreen),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ]

    # Highlight top 8 rows (selected teams)
    for r in range(1, 9):
        style_cmds.append(("BACKGROUND", (0, r), (-1, r), colors.lightgreen))

    table.setStyle(TableStyle(style_cmds))

    story.append(Paragraph("Third-Placed Teams Ranking", H2))
    story.append(Spacer(0, 8))
    story.append(table)
    story.append(
        Paragraph(
            "<b>Highlighted teams qualify for the Round of 32.</b>",
            BODY,
        )
    )

    story.append(PageBreak())

    # ================= KNOCKOUT STAGE =================
    story.append(Paragraph("Knockout Stage", H2))
    story.append(Spacer(0, 10))

    # R32 + R16 on same page
    if "r32" in state:
        story.extend(knockout_table("Round of 32", state["r32"]))
    if "r16" in state:
        story.extend(knockout_table("Round of 16", state["r16"]))

    story.append(PageBreak())

    # Remaining rounds
    for stage, title in [
        ("qf", "Quarterfinals"),
        ("sf", "Semifinals"),
    ]:
        if stage in state:
            story.extend(knockout_table(title, state[stage]))

    # THIRD PLACE
    third = state.get("third_place")
    if third and third.get("winner"):
        story.append(Paragraph("Third Place Match", H3))
        story.append(Paragraph(match_str(third), BODY))
        story.append(Spacer(0, 10))

    # FINAL
    final = state.get("final")
    if final and final.get("winner"):
        story.append(Paragraph("Final", H3))
        story.append(Paragraph(match_str(final), BODY))
        runner = final["teamA"] if final["winner"] == final["teamB"] else final["teamB"]
        story.append(Paragraph(f"Champion: <b>{final['winner']}</b>", BODY))
        story.append(Paragraph(f"Runner-up: <b>{runner}</b>", BODY))

    doc.build(story)
