export interface Node {
    type: string,
    start: number,
    end: number,
    body?: any[],
}

export interface ASTNewExpression extends Node {
    name: string,
    callee: ASTIdentifier,
    arguments: any[]
}

export interface ASTIdentifier extends Node {
    name: string,
}

export interface ASTCallExpression extends Node {
    callee: Node,
    property: ASTIdentifier,
    arguments: any[]
}

export interface ExpressionStatement extends Node {
    type: "ExpressionStatement"
    expression: ASTCallExpression,
    arguments: any[]
}

export interface VariableDeclarator extends Node {
    type: "VariableDeclarator"
    id: ASTIdentifier,
    init: ASTNewExpression
} 

export interface VariableDeclaration extends Node {
    type: "VariableDeclaration"
    declarations: VariableDeclarator[],
    init: ASTNewExpression
} 

export interface BenchmarkSuite extends Node {
    expression?: ASTCallExpression,
    declarations?: VariableDeclarator[],
    arguments?: any[]
}


export interface BenchmarkSuiteInstantiation {
    name: string,
    reference: number,
    benchmarks: any,
    ast: any
}

export as namespace AST;