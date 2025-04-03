const fs = require('fs');
const path = require('path');

const benchmarkFile = process.argv[2];
const prNumber = process.argv[3];
const prTitle = process.argv[4];
const prUrl = process.argv[5];
const commitSha = process.argv[6];
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

  // Time calculations
  const prTimeAvg = prResults.mean.toFixed(3);
  const masterTimeAvg = masterResults.mean.toFixed(3);
  const timeDiff = (prResults.mean - masterResults.mean).toFixed(3);
  const timePct = ((prResults.mean / masterResults.mean - 1) * 100).toFixed(2) + '%';

  // Memory calculations
  const prMemAvg = prResults.max_rss?.length > 0
    ? prResults.max_rss.reduce((a, b) => a + b, 0) / prResults.max_rss.length / 1024
    : null;
  const masterMemAvg = masterResults.max_rss?.length > 0
    ? masterResults.max_rss.reduce((a, b) => a + b, 0) / masterResults.max_rss.length / 1024
    : null;

  const memDiff = (prMemAvg !== null && masterMemAvg !== null)
    ? (prMemAvg - masterMemAvg).toFixed(1)
    : null;
  const memPct = (prMemAvg !== null && masterMemAvg !== null && masterMemAvg !== 0)
    ? ((prMemAvg / masterMemAvg - 1) * 100).toFixed(2) + '%'
    : null;

  // Create output array with one entry
  const outputData = [{
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
      pr_memory: prMemAvg !== null ? parseFloat(prMemAvg.toFixed(1)) : null,
      master_memory: masterMemAvg !== null ? parseFloat(masterMemAvg.toFixed(1)) : null,
      time_diff: parseFloat(timeDiff),
      time_pct: timePct,
      mem_diff: memDiff !== null ? parseFloat(memDiff) : null,
      mem_pct: memPct || "N/A"
    }
  }];

  // Write as array format
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

} catch (error) {
  console.error('Error processing benchmark results:', error);
  process.exit(1);
}
