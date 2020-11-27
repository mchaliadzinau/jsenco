var data = [30, 86, 168, 281, 303, 365];
const chartBlock = '<div class="chart"></div>';
const ELM_CONTENT = document.querySelector('body > div.content');
const URL_RESULTS_LIST = 'results';
const URL_RESULTS_FOLDER = 'data/';
const URL_RESULTS_LATEST = URL_RESULTS_FOLDER+'latest.json';
const URL_STOP = '/stop';

const fetchResultsList = () => {
  const optionsList = document.querySelector('#results-list');
  fetch(URL_RESULTS_LIST)
    .then(response => {
      if(response.ok) {
        response.json().then(json => {
          json.forEach(fileName => {
            const option = document.createElement('option');
            option.value = fileName;

            const fileNameSegments = fileName.split('.');
            if(fileNameSegments.length === 3) {
              const timestamp = parseInt(fileNameSegments[1]);
              option.innerHTML = isNaN(timestamp) == false 
                ? new Date(timestamp).toUTCString()
                : fileName;
            } else if(fileNameSegments.length === 2) {
              option.innerHTML = fileNameSegments[0];
            } else {
              option.innerHTML = fileName;
            }
            
            optionsList.append(option);
          });
        })
      };
    }).then(() => {
      optionsList.addEventListener('change', (e) => {
        fetchResult(URL_RESULTS_FOLDER + e.target.value);
      });
    });
};

const fetchResult = url => {
  fetch(url)
      .then(function (response) {
        if(response.ok) {
          response.json().then(json => {
            ClearBaseLayout();

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
          alert('Cannot fetch data from ' + url);
        }
      })
      .catch(function (err) {
        console.log("Something went wrong!", err);
        alert("Something went wrong! See console for details.");
      });
};

function CreateBaseLayout(engine) {
  const rowsCount =  engine.testsPassed.length / 2 + engine.testsFailed.length / 2; // total count of tests (raw test and benchmark counts as one)
              
  const engineColumn = AddEngineColumn(ELM_CONTENT, engine);
  for(let i = 1; i <= rowsCount; i++) { // prepopulate column with rows
    const resultBlock = document.createElement('div');
          resultBlock.className = 'test test-' + i;
    engineColumn.append(resultBlock);
  }
}

function ClearBaseLayout() {
  ELM_CONTENT.innerHTML = '';
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

const sendStopCommand = () => {
  if(confirm('Confirm server stop (this tab will be closed):')) {
    fetch(URL_STOP, {
      method: 'POST'
    }).then(response => {
      if(response.ok) {
        window.close();
      }
    });
  }
}

fetchResultsList();
fetchResult(URL_RESULTS_LATEST);