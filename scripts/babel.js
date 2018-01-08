'use strict';

const promisify = require('util').promisify;
const readDir = promisify(require('fs').readdir);
const readFile = promisify(require('fs').readFile);
const path = require('path');
const assert = require('assert');
const stringify = require('./ordered-stringify');


const testDir = path.join(__dirname, '..', 'test262-parser-tests');

// first: `cd projects/babel/packages/babylon; npm i; ./node_modules/.bin/rollup -c`
// jk; instead `make bootstrap; make build`
const babylon = require('../projects/babel/packages/babylon');
const generator = require('../projects/babel/packages/babel-generator').default;


const R = {
  'SUCCESS': 'success!',
  'PARSE_FAILED': 'failed to parse',
  'PARSE_EXPLICIT_FAILED': 'explicit version failed to parse',
  'EXPLICIT_TREES_NOT_EQUAL': 'explicit tree not equal to regular tree',
  'GENERATE_FAILED': 'failed to generate',
  'GENERATED_NOT_PARSED': 'generated source failed to parse',
  'GENERATED_TREES_NOT_EQUAL': 'generated tree differs from parsed tree',
};

const XFAILS = { // TODO: this should live in its own file
  pass: {
    // bug: complex destructuring
    '00c79d09c52df3ec.js': R.PARSE_FAILED,

    // strict function with non-strict name
    // https://github.com/tc39/test262-parser-tests/issues/13
    '050a006ae573e260.js': R.PARSE_FAILED,
    '2c0f785914da9d0b.js': R.PARSE_FAILED,
    '574ea84fc61bdc31.js': R.PARSE_FAILED,
    '6c4fe38464c16309.js': R.PARSE_FAILED,
    '8643da76fe7e95c7.js': R.PARSE_FAILED,
    'e0c3d30b6fe96812.js': R.PARSE_FAILED,

    // bug: no __proto__ redef
    '09c1c4b95bf0df77.js': R.PARSE_FAILED,
    '424fb5db0f6734b6.js': R.PARSE_FAILED,

    // bug: 'yield' as identifier
    '0cf1df0ef867a7f4.js': R.PARSE_FAILED,
    'a5aaa3992025795a.js': R.PARSE_FAILED,
    'e6643a557fe93de0.js': R.PARSE_FAILED,

    // bug: 'let' as identifier
    '14199f22a45c7e30.js': R.PARSE_FAILED,
    '2ef5ba0343d739dc.js': R.PARSE_FAILED,
    '4f731d62a74ab666.js': R.PARSE_FAILED,
    '5654d4106d7025c2.js': R.PARSE_FAILED,
    '56e2ba90e05f5659.js': R.PARSE_FAILED,
    '5ecbbdc097bee212.js': R.PARSE_FAILED,
    '63c92209eb77315a.js': R.PARSE_FAILED,
    '65401ed8dc152370.js': R.PARSE_FAILED,
    '660f5a175a2d46ac.js': R.PARSE_FAILED,
    '6815ab22de966de8.js': R.PARSE_FAILED,
    '6b36b5ad4f3ad84d.js': R.PARSE_FAILED,
    '818ea8eaeef8b3da.js': R.PARSE_FAILED,
    '8462f068b299bca2.js': R.PARSE_FAILED,
    '9aa93e1e417ce8e3.js': R.PARSE_FAILED,
    '9fe1d41db318afba.js': R.PARSE_FAILED,
    'a1594a4d0c0ee99a.js': R.PARSE_FAILED,
    'b8c98b5cd38f2bd9.js': R.PARSE_FAILED,
    'c442dc81201e2b55.js': R.PARSE_FAILED,
    'c8565124aee75c69.js': R.PARSE_FAILED,
    'df696c501125c86f.js': R.PARSE_FAILED,
    'e5393f15b0e8585d.js': R.PARSE_FAILED,
    'ee4e8fa6257d810a.js': R.PARSE_FAILED,
    'f0d9a7a2f5d42210.js': R.PARSE_FAILED,
    'f0fbbdabdaca2146.js': R.PARSE_FAILED,
    'f2e41488e95243a8.js': R.PARSE_FAILED,
    'fa59ac4c41d26c14.js': R.PARSE_FAILED,
    'ffaf5b9d3140465b.js': R.PARSE_FAILED,

    // bug: annex B function declarations in if statements
    '1c1e2a43fe5515b6.js': R.PARSE_FAILED,
    '3dabeca76119d501.js': R.PARSE_FAILED,
    '52aeec7b8da212a2.js': R.PARSE_FAILED,
    '59ae0289778b80cd.js': R.PARSE_FAILED,
    'a4d62a651f69d815.js': R.PARSE_FAILED,
    'c06df922631aeabc.js': R.PARSE_FAILED,

    // bug: HTML comments
    '4f5419fe648c691b.js': R.PARSE_FAILED,
    '5a2a8e992fa4fe37.js': R.PARSE_FAILED,
    '5d5b9de6d9b95f3e.js': R.PARSE_FAILED,
    '946bee37652a31fa.js': R.PARSE_FAILED,
    'e03ae54743348d7d.js': R.PARSE_FAILED,
    'ba00173ff473e7da.js': R.PARSE_FAILED,

    // bug: noctals with decimal parts
    '4f60d8fbb4be1120.js': R.PARSE_FAILED,
    'b0fdc038ee292aba.js': R.PARSE_FAILED,

    // bug: yield classExpression
    'b06e2c3814e46579.js': R.PARSE_FAILED,

    // bug: generating destructuring
    '6ffb1fb47c2dd12f.js': R.GENERATED_NOT_PARSED,

    // bug: generator outputs directives as strings
    '0a068bc70fe14c94.js': R.GENERATED_TREES_NOT_EQUAL,
    '20aca21e32bf7772.js': R.GENERATED_TREES_NOT_EQUAL,
    '2e371094f1b1ac51.js': R.GENERATED_TREES_NOT_EQUAL,
    '3315c524a740fe55.js': R.GENERATED_TREES_NOT_EQUAL,
    '3990bb94b19b1071.js': R.GENERATED_TREES_NOT_EQUAL,
    '3ae4f46daa688c58.js': R.GENERATED_TREES_NOT_EQUAL,
    '3d2ab39608730a47.js': R.GENERATED_TREES_NOT_EQUAL,
    '3e48826018d23c85.js': R.GENERATED_TREES_NOT_EQUAL,
    '4a0d9236bc523b77.js': R.GENERATED_TREES_NOT_EQUAL,
    '': R.GENERATED_TREES_NOT_EQUAL,
    '': R.GENERATED_TREES_NOT_EQUAL,

  },
};



async function testPassCore(fileName, tmp = false) {
  const isModule = /\.module\.js$/.test(fileName);
  const options = { sourceType: isModule ? 'module' : 'script' };
  const actualSource = await readFile(path.join(testDir, 'pass', fileName), 'utf8');
  const expectedSource = await readFile(path.join(testDir, 'pass-explicit', fileName), 'utf8');

  let actualTree, expectedTree;
  try {
    actualTree = babylon.parse(actualSource, options);
  } catch(e) {
    if (tmp) console.log(actualSource + '\n\n' + e);
    return R.PARSE_FAILED;
  }

  try {
    expectedTree = babylon.parse(expectedSource, options);
  } catch(e) {
    return R.PARSE_EXPLICIT_FAILED;
  }

  const sA = serializeTree(actualTree);
  console.log('#####');
  const sE = serializeTree(expectedTree)
  if (sA !== sE) {
    // todo helper method?
    console.log(sA + '\n\n' + sE);
    return R.EXPLICIT_TREES_NOT_EQUAL;
  }

  let generated; 
  try {
    generated = generator(actualTree, {
      retainLines: false,
      retainFunctionParens: false,
      comments: false,
      compact: true,
    }).code;
  } catch(e) {
    return R.GENERATE_FAILED;
  }

  let generatedAndParsed;
  try {
    generatedAndParsed = babylon.parse(generated, options);
  } catch(e) {
    if (tmp) console.log(actualSource + '\n\n--\n\n' + generated + '\n\n' + e);
    return R.GENERATED_NOT_PARSED;
  }

  if (serializeTree(actualTree) !== serializeTree(generatedAndParsed)) {
    // todo helper method?
    if (tmp) {
      console.log(actualSource + '\n\n--\n\n' + generated + '\n\n--\n\n' + serializeTree(actualTree) + '\n\n\n' + serializeTree(generatedAndParsed));
    }
    return R.GENERATED_TREES_NOT_EQUAL;
  }

  return R.SUCCESS;
}


function wrapXfail(fn, xfails) {
  return async function(fileName, ...rest) {
    const result = await fn(fileName, ...rest);
    if (result !== R.SUCCESS) {
      if (!(fileName in xfails)) {
        throw new Error(`${fileName}: unexpectedly failed with cause "${result}".'`);
      } else if (xfails[fileName] !== result) {
        throw new Error(`${fileName}: failed as expected, but with unexpected cause "${result}" (should have been "${xfails[fileName]}").`);
      }
      // else pass
    } else if (fileName in xfails) {
      throw new Error(`${fileName}: unexpectedly passed.`);
    }
    // else pass
  };
}

const testPass = wrapXfail(testPassCore, XFAILS.pass);




function fix(node) { // TODO contemplate not mutating input
  if (node == null) return node;

  node.type && console.log(node.type);
  if (node.type === 'SequenceExpression') {
    console.log(node.expressions);
  }
  if (node.type === 'SequenceExpression' && node.expressions.length > 2) {
    console.log('reached');
    const n = node.expressions.reduce((acc, v) => ({
      type: 'SequenceExpression',
      expressions: [acc, v],
    }));
    node.expressions = n.expressions; // lol
  }

  if (node.type === 'ObjectProperty' || node.type === 'ObjectMethod' || node.type === 'ClassMethod') {
    if (node.key.type === 'NumericLiteral') {
      node.key = {
        type: 'StringLiteral',
        value: '' + node.key.value,
      };
    } else if (node.key.type === 'Identifier' && !node.shorthand) {
      node.key = {
        type: 'StringLiteral',
        value: node.key.name,
      };
    }
  }

  if (typeof node === 'object') {
    Object.values(node).forEach(fix);
  }

  return node;
}

function serializeTree(tree) {
  tree = fix(tree);
  return stringify(tree, (k, v) => ['start', 'end', 'extra', 'loc', 'leadingComments', 'comments', 'trailingComments', 'innerComments'].includes(k) ? void 0 : v); // TODO I guess we don't need actually ordered stringify?
}



(async () => {
  const passTests = await readDir(path.join(testDir, 'pass'));
  for (let f of ['589dc8ad3b9aa28f.js']){//passTests) {
    try {
      await testPass(f);      
    } catch(e) {
      console.log(e);
      await testPassCore(f, true);
      console.log(f);
      console.log('-------------------------------------')
      break;
    }
    // try {}
    // const r = 
    // if (r !== R.SUCCESS) {
    //   console.log(await readFile(path.join(testDir, 'pass', f), 'utf8'));
    //   console.log(f);
    //   console.log(r);
    //   break;
    // }
  }



})();

