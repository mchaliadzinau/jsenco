# **JS** **EN**gines **CO**mparator
  Run code on different JS engines and compare.
  Following data is available for comparison:
  * benchmark score
  * execution time *
  * CPU usage *
  * Memory usage *

  > \* for single and bencmark passes
_______________________________________________________________________________________________________________________
## Usage with Docker
  1) Build image manually or pull it `docker pull rv4flyver/jsenco`   
  2) Place test files in `test` folder (for test examples see https://github.com/rv4Flyver/jsenco/tree/master/tests)   
  3) Run it with following command with optional params (see `Parameters` section):    
    
    docker run -it -p 3333:3333 \
      -v "$(pwd)"/tests:/jsenco/tests \
      -v "$(pwd)"/results:/jsenco/results/data \
      rv4flyver/jsenco
  
  3) Open `http://localhost:3333` to view results after all tests completed.   

## Usage w/o docker  
  1) Install [JSVU](https://github.com/GoogleChromeLabs/jsvu#installation)  
  2) Install V8, SM and JSC  
  3) Execute `npm start` with optional params (see `Parameters` section)  
  4) To see test results execute `npm start view` (you need http-server package installed globally)  
  5) All results are available in `results/data/`  

## Parameters  
  Optional params can be passed to command like:  
  > COMMAND "ENGINES PARAMS" "VIEWER PARAMS"  
  
### ENGINES PARAMS  
  can be a comma separated list of engines you want to runt tests on:  
    
    "V8,SM,JSC"  
  
  or to skip testing at all and proceed to viewer immediately  
    
    "NONE" 

### VIEWER PARAMS  
  It is possible to skip running viewer at the end of thesting by passing following param after "ENGINES PARAMS":  
    
    "SKIP_VIEWER"

### Examples  
    npm start "V8,SM,JSC" "SKIP_VIEWER". 

    npm start "NONE"  

    docker run -it -p 3333:3333 \
      -v "$(pwd)"/tests:/jsenco/tests \
      -v "$(pwd)"/results:/jsenco/results/data \
      rv4-js-eng-opt-comparator_jsenco "NONE"


_______________________________________________________________________________________________________________________
## LINKS
### V8 Benchmark Suite
  http://www.netchain.com/Tools/v8/

### Dromaeo
  * http://dromaeo.com/
  * http://wiki.mozilla.org/Dromaeo
  * https://github.com/jeresig/dromaeo/tree/master/tests

## JSDoc and TSDoc
  * https://medium.com/@trukrs/type-safe-javascript-with-jsdoc-7a2a63209b76
  * [JSDoc: Tag Types](https://jsdoc.app/tags-type.html)
