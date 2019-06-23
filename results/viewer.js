var data = [30, 86, 168, 281, 303, 365];
const chartBlock = '<div class="chart"></div>';
const ELM_CONTENT = document.querySelector('body > div.content');
const URL_RESULTS = 'data/latest.json';

fetch(URL_RESULTS)
    .then(function (response) {
      if(response.ok) {
        response.json().then(json => {
          
          const ENGINES_LIST = json;
          ENGINES_LIST.forEach(engine => {
            if(engine) {
              engine.testsPassed.forEach( (result, idx) => {
                const memoryChartSelector = AddChartBlock(result.stdout.score, engine.name, result.script, true, idx, 'memory', `min: ${Math.min.apply(null, result.stats.mems)} Mb, max: ${result.stats.maxMem} Mb`)
                CreateMemoryChart(memoryChartSelector, result.stats.mems);
              })
            }
          });
  
        });
      } else {
        alert('Cannot fetch data from ' + URL_RESULTS);
      }
    })
    .catch(function (err) {
      console.log("Something went wrong!", err);
      alert("Something went wrong! See console for details.");
    });

function AddChartBlock(score, engineName, testName, isTestPassed, testIdx, chartName, description) {
  const className = `chart ${engineName}-${isTestPassed ? 'passed' : 'failed'}-${testIdx} ${chartName}`;
  const selector =  `.${ELM_CONTENT.className} .chart.${engineName}-${isTestPassed ? 'passed' : 'failed'}-${testIdx}.${chartName}`;

  const chartBlock = document.createElement('div');

  chartBlock.className = className;

  const chartTitle = document.createElement('h2');
  chartTitle.textContent = `${testName} (${score})`;
  ELM_CONTENT.append(chartTitle);
  ELM_CONTENT.append(chartBlock);
  const chartDescription = document.createElement('p');
  chartDescription.className = 'text-center';
  chartDescription.textContent = `${className}(${description})`
  ELM_CONTENT.append(chartDescription);

  return selector;
}

function CreateMemoryChart(selector, data) {
  const max = Math.max.apply(null, data);
  d3.select(selector)
  .selectAll("div")
  .data(data)
    .enter()
    .append("div")
    .attr("class", "col-wrapper")
    .append("div")
    .style("height", function(d) { return (100 * d / max) + "%"; })
    .text(function(d) { return d; });
}