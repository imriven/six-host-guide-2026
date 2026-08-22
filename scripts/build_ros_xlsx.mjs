import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = new URL("../", import.meta.url).pathname;
const schedule = JSON.parse(await fs.readFile(`${root}tmp/approved_run_of_show.json`, "utf8"));
const wb = Workbook.create();
const sheet = wb.worksheets.add("Run of Show");
sheet.showGridLines = false;
sheet.getRange("A1:G1").merge();
sheet.getRange("A1").values = [["Seattle Indies Expo - SIX 2026 | Run of Show"]];
sheet.getRange("A1:G1").format = { fill: "#1B1B25", font: { bold: true, color: "#B8F29A", size: 18 }, rowHeight: 30 };
sheet.getRange("A2:G2").merge();
sheet.getRange("A2").values = [["Run of Show - Rough Draft"]];
sheet.getRange("A2:G2").format = { fill: "#30203F", font: { color: "#FF5C35", bold: true }, rowHeight: 24 };
sheet.getRange("A3:G3").merge();
sheet.getRange("A3").values = [["Host A = TBD | Host B = TBD | Host C = TBD | Host D = TBD | Host E = TBD | Host F = TBD"]];
sheet.getRange("A3:G3").format = { fill: "#FFFFFF", font: { color: "#202028" }, rowHeight: 22 };
const headers = ["SEG","GAME / BREAK","DEVELOPER / PUBLISHER","START","END","HOSTS","PRODUCTION NOTES"];
sheet.getRange("A4:G4").values = [headers];
sheet.getRange("A4:G4").format = { fill: "#7445C7", font: { bold: true, color: "#FFFFFF" }, rowHeight: 24, wrapText: true };
const rows = schedule.map(x => [x.segment || "-",x.title,x.developer,x.start,x.end,x.hosts,""]);
sheet.getRange(`A5:G${4+rows.length}`).values = rows;
sheet.getRange(`A5:G${4+rows.length}`).format = { font: { color: "#202028", size: 10 }, wrapText: true, verticalAlignment: "top", borders: { insideHorizontal: { style: "thin", color: "#D9D7DF" } } };
schedule.forEach((x,i)=>{
  const row = i + 5;
  if (x.kind === "Ad") sheet.getRange(`A${row}:G${row}`).format.fill = "#EADCF4";
  if (x.kind === "Transition") {
    sheet.getRange(`A${row}:G${row}`).format.fill = "#F2F1F5";
    sheet.getRange(`B${row}`).format.font = { italic:true, color:"#66616E" };
  }
  if (x.kind === "Intro" || x.kind === "Closing") sheet.getRange(`A${row}:G${row}`).format.fill = "#E4F6D9";
  if (x.kind === "Game") sheet.getRange(`B${row}`).format.font = { bold:true, color:"#7445C7" };
});
const widths = [8,31,28,12,12,11,62];
widths.forEach((w,i)=> sheet.getRangeByIndexes(0,i,4+rows.length,1).format.columnWidth = w);
sheet.getRange(`A5:G${4+rows.length}`).format.rowHeight = 25;
sheet.freezePanes.freezeRows(4);
const check = await wb.inspect({kind:"table", range:`'Run of Show'!A1:G14`, include:"values,formulas", tableMaxRows:14, tableMaxCols:7});
console.log(check.ndjson);
const errors = await wb.inspect({kind:"match", searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options:{useRegex:true,maxResults:50}, summary:"formula error scan"});
console.log(errors.ndjson);
const preview = await wb.render({sheetName:"Run of Show", range:"A1:G18", scale:1});
await fs.writeFile(`${root}tmp/run-of-show-xlsx-preview.png`, new Uint8Array(await preview.arrayBuffer()));
const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(`${root}public/SIX-2026-Run-of-Show.xlsx`);
