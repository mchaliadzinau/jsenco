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
              CreateBaseLayout(engine);

              engine.testsPassed.forEach( (result) => {
                AddChartBlock(result.script, true, engine.name, 'memory', result);
              })

              engine.testsFailed.forEach( (result) => {
                AddChartBlock(result.script, false, engine.name, 'memory', result);
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

function CreateBaseLayout(engine) {
  const rowsCount =  engine.testsPassed.length / 2 + engine.testsFailed.length / 2; // total count of tests (raw test and benchmark counts as one)
              
  const engineColumn = AddEngineColumn(ELM_CONTENT, engine);
  for(let i = 1; i <= rowsCount; i++) { // prepopulate column with rows
    const resultBlock = document.createElement('div');
          resultBlock.className = 'test test-' + i;
    engineColumn.append(resultBlock);
  }
}

function AddEngineColumn(target, engine) {
  const engineColumn = document.createElement('div');
  engineColumn.className = `engine ${engine.name}`;
  engineColumn.innerHTML = `<h2>${engine.name}</h2>`
  target.append(engineColumn);
  return engineColumn;
}

/**
 * Adds chart to the predefined target by result.id
 * @param {*} testName 
 * @param {*} isTestPassed 
 * @param {*} engineName - required to form corect className/selector and to correctly convert execution time to seconds (JSC's preciseTime returns time in seconds)
 * @param {*} chartName 
 * @param {*} result 
 */
function AddChartBlock(testName, isTestPassed, engineName, chartName, result) {
  const target = document.querySelector(`.${engineName} .test-${result.id}`);
        target.className += ` test-${isTestPassed ? 'passed' : 'failed' }`;

  const chartBlock = document.createElement('div');
        chartBlock.className = `chart chart-${chartName} chart-${result.id}${testName.endsWith('becnhmark.js') ? '-benchmark' : ''}`;
        
  const score = result.stdout ? result.stdout.score : 'N/A';

  const chartTitle = document.createElement('h3');
        chartTitle.textContent = `${testName.split('/').reverse()[0]} (${score})`;
  
  target.append(chartTitle);
  CreateMemoryChart(chartBlock, result.stats.mems);
  target.append(chartBlock);

  const table = document.createElement('table');
        table.className = 'table-stats'
        table.innerHTML = `
          <thead>
            <tr><td colspan=2>Stats</td></tr>
          </thead>
          <tbody>
            <tr>
              <td>Memory Min</td><td>${result.stats.minMem} Mb</td>
            </tr>
            <tr><td>Memory Max</td><td>${result.stats.maxMem} Mb</td></tr>
            <tr><td>Total Time</td><td>${engineName != 'JSC' ? result.extime / 1000 : result.extime} sec</td></tr>
          </tbody>
        `;
  
  target.append(table);
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