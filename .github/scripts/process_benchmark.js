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

try {
  const content = fs.readFileSync(benchmarkFile, 'utf8');
  const benchmarkResults = JSON.parse(content);

  const prResults = benchmarkResults.results[0];
  const masterResults = benchmarkResults.results[1];

  // Time calculations
  const prTimeAvg = parseFloat(prResults.mean.toFixed(3));
  const masterTimeAvg = parseFloat(masterResults.mean.toFixed(3));
  const timeDiff = parseFloat((prResults.mean - masterResults.mean).toFixed(3));
  const timePct = ((prTimeAvg / masterTimeAvg - 1) * 100).toFixed(2) + '%';

  // Memory calculations
  const prMemAvg = prResults.max_rss?.length > 0 ?
    parseFloat(
      (prResults.max_rss.reduce((a, b) => a + b, 0) /
       prResults.max_rss.length / 1024
      ).toFixed(1)
    ) : null;

  const masterMemAvg = masterResults.max_rss?.length > 0 ?
    parseFloat(
      (masterResults.max_rss.reduce((a, b) => a + b, 0) /
       masterResults.max_rss.length / 1024
      ).toFixed(1)
    ) : null;

  const memDiff = (prMemAvg !== null && masterMemAvg !== null) ?
    parseFloat((prMemAvg - masterMemAvg).toFixed(1)) : null;

  const memPct = (prMemAvg !== null && masterMemAvg !== null && masterMemAvg !== 0) ?
    ((prMemAvg / masterMemAvg - 1) * 100).toFixed(2) + '%' : 'N/A';

  // Create output array
  const outputData = [{
    timestamp: new Date().toISOString(),
    pr: {
      number: parseInt(prNumber),
      title: prTitle,
      url: prUrl,
      commit: commitSha
    },
    metrics: {
      pr_time: prTimeAvg,
      master_time: masterTimeAvg,
      pr_memory: prMemAvg,
      master_memory: masterMemAvg,
      time_diff: timeDiff,
      time_pct: timePct,
      mem_diff: memDiff,
      mem_pct: memPct
    }
  }];

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

} catch (error) {
  console.error('Error processing benchmark results:', error);
  process.exit(1);
}
