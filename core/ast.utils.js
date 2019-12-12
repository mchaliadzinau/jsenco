const getArrayExpression = (...elements) => ({
    "type": "ArrayExpression",
    "elements": elements
});

const getBinaryExpression = (left, operator, right) => ({
    "type": "BinaryExpression",
    "left": left,
    "operator": operator,
    "right": right
});

const getCallExpression = (callee, arguments = []) => ({
    "type": "CallExpression",
    "callee": callee,
    "arguments": arguments
});

const getExpressionStatement = (expression) => ({
    "type": "ExpressionStatement",
    "expression": expression
});

/**
 * @param {string} name
 * @return {AST.Identifier}
 */
const getIdentifier = (name) => ({
    "type": "Identifier",
    "name": name
});

/**
 * @param {string} value
 * @return {AST.Literal}
 */
const getLiteral = (value) => ({
    "type": "Literal",
    "value": `${value}`,
    "raw": `'${value}'`
});

const getMemberExpression = (object, property, computed = false) => ({
    "type": "MemberExpression",
    "object": object,
    "property": property,
    "computed": computed
});

const getObjectExpression = (properties) => ({
    "type": "ObjectExpression",
    "properties": properties
});

/**
 * @return {AST.Property}
 */
const getProperty = (key, name, kind = 'init', method = false, shorthand = false, computed = false) => ({
    "type": "Property",
    "method": method,
    "shorthand": shorthand,
    "computed": computed,
    "key": key,
    "value": name,
    "kind": kind
  })

const getUnaryExpression = (operator, argument, prefix = true) => ({
    "type": "UnaryExpression",
    "operator": operator,
    "prefix": prefix,
    "argument": argument
});

module.exports = {
    getArrayExpression,
    getBinaryExpression, 
    getCallExpression, 
    getExpressionStatement,
    getIdentifier, 
    getLiteral, 
    getMemberExpression,
    getObjectExpression,
    getProperty,
    getUnaryExpression
};