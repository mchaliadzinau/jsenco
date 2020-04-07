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
              const rowsCount =  engine.testsPassed.length + engine.testsFailed.length;
              
              const engineColumn = AddEngineColumn(ELM_CONTENT, engine);
              engine.testsPassed.forEach( (result, idx) => {
                const memoryChartSelector = AddChartBlock(engineColumn,result.stdout ? result.stdout.score : 'N/A', engine.name, result.script, true, idx, 'memory', `min: ${Math.min.apply(null, result.stats.mems)} Mb, max: ${result.stats.maxMem} Mb, time: ${result.extime}`)
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

function AddEngineColumn(target, engine) {
  const engineColumn = document.createElement('div');
  engineColumn.className = engine.name;
  engineColumn.style.cssText = "position:relative; float: left; width: 600px; padding: 10px; border-right: 1px solid red";
  engineColumn.innerHTML = `<h2>${engine.name}</h2>`
  target.append(engineColumn);
  return engineColumn;
}

function AddChartBlock(target, score, engineName, testName, isTestPassed, testIdx, chartName, description) {
  const className = `chart ${engineName}-${isTestPassed ? 'passed' : 'failed'}-${testIdx} ${chartName}`;
  const selector =  `.${target.className} .chart.${engineName}-${isTestPassed ? 'passed' : 'failed'}-${testIdx}.${chartName}`;

  const chartBlock = document.createElement('div');

  chartBlock.className = className;

  const chartTitle = document.createElement('h3');
  chartTitle.textContent = `${testName.split('/').reverse()[0]} (${score})`;
  target.append(chartTitle);
  target.append(chartBlock);
  const chartDescription = document.createElement('p');
  chartDescription.className = 'text-center';
  chartDescription.textContent = `${className}(${description})`
  target.append(chartDescription);

  return selector;
}

function CreateMemoryChart(selector, data) {
  const max = Math.max.apply(null, data);
  window['d3'].select(selector)
  .selectAll("div")
  .data(data)
    .enter()
    .append("div")
    .attr("class", "col-wrapper")
    .append("div")
    .style("height", function(d) { return (100 * d / max) + "%"; })
    .text(function(d) { return d; });
}