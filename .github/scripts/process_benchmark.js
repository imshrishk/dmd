const fs = require('fs');
const benchmarkFile = process.argv[2];
const prNumber = process.argv[3];
const prTitle = process.argv[4];
const prUrl = process.argv[5];
const commitSha = process.argv[6];
const path = require('path');
const outputPath = path.resolve(process.argv[7]);

if (!fs.existsSync(benchmarkFile)) {
  console.error(`Error: Benchmark file ${benchmarkFile} not found`);
  process.exit(1);
}

let benchmarkResults;
let result;
try {
  const content = fs.readFileSync(benchmarkFile, 'utf8');
  benchmarkResults = JSON.parse(content);

  const prResults = benchmarkResults.results[0];
  const masterResults = benchmarkResults.results[1];

  const prTimeAvg = prResults.mean.toFixed(3);
  const masterTimeAvg = masterResults.mean.toFixed(3);

  const prMemAvg = prResults.max_rss && prResults.max_rss.length > 0
    ? (prResults.max_rss.reduce((a, b) => a + b, 0) / prResults.max_rss.length / 1024).toFixed(1)
    : null;
  const masterMemAvg = masterResults.max_rss && masterResults.max_rss.length > 0
    ? (masterResults.max_rss.reduce((a, b) => a + b, 0) / masterResults.max_rss.length / 1024).toFixed(1)
    : null;

  const timeDiff = (prResults.mean - masterResults.mean).toFixed(3);
  const timePct = ((prResults.mean / masterResults.mean - 1) * 100).toFixed(2) + '%';

  const memDiff = (prMemAvg && masterMemAvg)
    ? (parseFloat(prMemAvg) - parseFloat(masterMemAvg)).toFixed(1)
    : null;
  const memPct = (prMemAvg && masterMemAvg && parseFloat(masterMemAvg) !== 0)
    ? ((parseFloat(prMemAvg) / parseFloat(masterMemAvg) - 1) * 100).toFixed(2) + '%'
    : null;

  result = {
    timestamp: new Date().toISOString(),
    pr: {
      number: parseInt(prNumber),
      title: prTitle,
      url: prUrl,
      commit: commitSha
    },
    metrics: {
      pr_time: parseFloat(prTimeAvg),
      master_time: parseFloat(masterTimeAvg),
      pr_memory: prMemAvg === null ? null : parseFloat(prMemAvg),
      master_memory: masterMemAvg === null ? null : parseFloat(masterMemAvg),
      time_diff: parseFloat(timeDiff),
      time_pct: timePct,
      mem_diff: memDiff === null ? null : parseFloat(memDiff),
      mem_pct: memPct
    }
  };
} catch (error) {
  console.error('Error processing benchmark results:', error);
  process.exit(1);
}

if (outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
}
