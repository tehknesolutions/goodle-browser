import { readFileSync } from "node:fs";
import {
  certifyBuildReport,
  type BuildReportV1,
} from "../nucleo/manifestacao";

export function runCertifyCommand(reportPath: string) {
  if (!reportPath) throw new Error("CERTIFY_REPORT_REQUIRED");

  const report = JSON.parse(
    readFileSync(reportPath, "utf8"),
  ) as BuildReportV1;

  if (report.schema !== "goodle.build-report.v1") {
    throw new Error("INVALID_BUILD_REPORT_SCHEMA");
  }

  return certifyBuildReport(report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const certification = runCertifyCommand(process.argv[2] ?? "");
    console.log(JSON.stringify(certification, null, 2));

    process.exit(
      certification.status === "CERTIFIED"
        ? 0
        : certification.status === "PARTIAL"
          ? 3
          : 2,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
