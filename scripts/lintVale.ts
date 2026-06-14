import { execSync, spawnSync } from "node:child_process";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";

type Alert = {
  Line: number;
  Span: [number, number];
  Severity: string;
  Check: string;
  Message: string;
};
type ValeOptions = {
  configFile?: string;
  minErrorLevel: string;
  accept?: string[];
};

const LEVELS = ["suggestion", "warning", "error"];

export function lintVale(vale: ValeOptions, contentDir: string): never {
  try {
    execSync("vale --version", { stdio: "pipe" });
  } catch {
    console.error(
      "\nVale is not installed:\n\n" +
        "  brew install vale          (macOS / Linux via Homebrew)\n" +
        "  choco install vale         (Windows)\n" +
        "  snap install vale          (Linux)\n" +
        "  https://vale.sh/docs/vale-cli/installation/\n",
    );
    process.exit(1);
  }

  if (vale.configFile) {
    const absConfig = resolve(vale.configFile);
    let exitCode = 0;
    try {
      execSync(`vale --config "${absConfig}" "${contentDir}"`, {
        stdio: "inherit",
      });
    } catch {
      exitCode = 1;
    }
    process.exit(exitCode);
  }

  const packageCache = join(homedir(), ".folio-md", "vale-styles");
  mkdirSync(packageCache, { recursive: true });

  const hasVocab = vale.accept && vale.accept.length > 0;
  if (hasVocab) {
    const vocabDir = join(packageCache, "config", "vocabularies", "folio");
    mkdirSync(vocabDir, { recursive: true });
    writeFileSync(join(vocabDir, "accept.txt"), `${vale.accept?.join("\n")}\n`);
  }

  const ini = `${[
    `StylesPath = ${packageCache}`,
    "Packages = Google",
    "",
    "MinAlertLevel = suggestion",
    ...(hasVocab ? ["Vocab = folio", ""] : [""]),
    "[*.{md,mdx,txt}]",
    "BasedOnStyles = Vale, Google",
  ].join("\n")}\n`;

  const tmpConfig = join(tmpdir(), `folio-vale-${Date.now()}.ini`);
  writeFileSync(tmpConfig, ini);

  try {
    execSync(`vale sync --config "${tmpConfig}"`, { stdio: "inherit" });
  } catch {
    console.warn(
      "folio: vale sync failed — linting with available styles only",
    );
  }

  const { stdout } = spawnSync(
    "vale",
    ["--no-exit", "--config", tmpConfig, "--output=JSON", contentDir],
    { encoding: "utf8" },
  );
  unlinkSync(tmpConfig);

  let results: Record<string, Alert[]>;
  try {
    results = JSON.parse(stdout || "{}") as Record<string, Alert[]>;
  } catch {
    console.error("folio: vale returned unexpected output:\n", stdout);
    process.exit(1);
  }
  const allAlerts: Alert[] = [];

  for (const [file, alerts] of Object.entries(results)) {
    if (!alerts.length) continue;
    console.log(`\n${file}`);
    for (const a of alerts) {
      const loc = `${a.Line}:${a.Span[0]}`.padEnd(8);
      const sev = a.Severity.padEnd(12);
      console.log(`  ${loc}  ${sev}  ${a.Message}  (${a.Check})`);
      allAlerts.push(a);
    }
  }

  if (allAlerts.length) console.log();

  const minIndex = LEVELS.indexOf(vale.minErrorLevel);
  process.exit(
    allAlerts.some((a) => LEVELS.indexOf(a.Severity) >= minIndex) ? 1 : 0,
  );
}
