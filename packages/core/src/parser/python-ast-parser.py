#!/usr/bin/env python3
"""
Proper AST-based Python parser using Python's built-in ast module.
Called from TypeScript via subprocess for accurate symbol extraction.
"""
import ast
import json
import sys
from typing import List, Dict, Any, Optional


def extract_imports(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract import statements with proper alias resolution."""
    imports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append({
                    'source': alias.name.replace('.', '/'),
                    'specifiers': [alias.asname if alias.asname else alias.name.split('.')[-1]],
                    'isTypeOnly': False
                })
        
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                # Handle relative imports
                source = ('.' * node.level) + (node.module or '')
                source = source.replace('.', '/')
                
                specifiers = []
                for alias in node.names:
                    if alias.name == '*':
                        specifiers.append('*import*')
                    else:
                        specifiers.append(alias.asname if alias.asname else alias.name)
                
                imports.append({
                    'source': source,
                    'specifiers': specifiers,
                    'isTypeOnly': False
                })
    
    return imports


def extract_symbols(tree: ast.Module, source_lines: List[str]) -> List[Dict[str, Any]]:
    """Extract functions, classes, and async functions with proper scoping."""
    symbols = []
    seen = set()
    
    def is_top_level(node: ast.AST) -> bool:
        """Check if node is at module level (not nested)."""
        for parent in ast.walk(tree):
            if isinstance(parent, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                for child in ast.walk(parent):
                    if child is node and parent is not tree:
                        return False
        return True
    
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            # Only capture top-level functions and class methods
            is_exported = is_top_level(node)
            key = f"function:{node.name}:{node.lineno}"
            
            if key not in seen:
                seen.add(key)
                symbols.append({
                    'name': node.name,
                    'kind': 'function',
                    'startLine': node.lineno,
                    'endLine': getattr(node, 'end_lineno', node.lineno),
                    'isExported': is_exported,
                    'isDefaultExport': False
                })
        
        elif isinstance(node, ast.ClassDef):
            # Classes are typically top-level
            is_exported = is_top_level(node)
            key = f"class:{node.name}:{node.lineno}"
            
            if key not in seen:
                seen.add(key)
                symbols.append({
                    'name': node.name,
                    'kind': 'class',
                    'startLine': node.lineno,
                    'endLine': getattr(node, 'end_lineno', node.lineno),
                    'isExported': is_exported,
                    'isDefaultExport': False
                })
    
    return symbols


def extract_calls(tree: ast.Module) -> List[Dict[str, Any]]:
    """Extract function/method calls with proper attribute chain resolution."""
    calls = []
    call_skip = {
        'if', 'for', 'while', 'elif', 'else', 'with', 'try', 'except', 
        'finally', 'return', 'yield', 'raise', 'assert', 'pass', 'break', 
        'continue', 'lambda', 'print', 'super', 'self', 'cls', 'len', 
        'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple'
    }
    
    def get_call_name(node: ast.AST) -> Optional[str]:
        """Resolve call name including attribute chains like obj.method()."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            value_name = get_call_name(node.value)
            if value_name:
                return f"{value_name}.{node.attr}"
            return node.attr
        return None
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            callee = get_call_name(node.func)
            if callee:
                base = callee.split('.')[0]
                if base not in call_skip and len(calls) < 400:
                    calls.append({
                        'callee': callee,
                        'line': node.lineno
                    })
    
    return calls


def extract_exports(tree: ast.Module, source_code: str) -> List[str]:
    """Extract __all__ exports if defined."""
    exports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == '__all__':
                    # Try to extract list elements
                    if isinstance(node.value, ast.List):
                        for elt in node.value.elts:
                            if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                                exports.append(elt.value)
    
    return exports


def parse_python_ast(source_code: str) -> Dict[str, Any]:
    """Main entry point - parse Python source and return structured data."""
    try:
        tree = ast.parse(source_code)
        source_lines = source_code.split('\n')
        
        return {
            'success': True,
            'imports': extract_imports(tree),
            'symbols': extract_symbols(tree, source_lines),
            'calls': extract_calls(tree),
            'exports': extract_exports(tree, source_code)
        }
    except SyntaxError as e:
        return {
            'success': False,
            'error': f'SyntaxError at line {e.lineno}: {e.msg}'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


if __name__ == '__main__':
    # Read source code from stdin
    source_code = sys.stdin.read()
    
    # Parse and output JSON
    result = parse_python_ast(source_code)
    print(json.dumps(result))
    sys.exit(0 if result['success'] else 1)
