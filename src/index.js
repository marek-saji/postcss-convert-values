'use strict';

import postcss from 'postcss';
import convert from './lib/convert';
import valueParser, {unit} from 'postcss-value-parser';

function processValueNode (opts, node, insideCalc) {
    if (node.type === 'word') {
        let pair = unit(node.value);
        if (pair) {
            let num = Number(pair.number);
            let u = pair.unit.toLowerCase();
            if (num !== 0) {
                node.value = convert(num, u, opts);
            } else if (u === 'ms' || u === 's' || insideCalc) {
                node.value = 0 + u;
            } else {
                node.value = 0;
            }
        }
    }
    if (node.type === 'function' && node.value !== 'calc') {
        return false;
    }
}

function walk (node, cb, insideCalc) {
    var i, max, n;
    if (node.nodes) {
        for (i = 0, max = node.nodes.length; i < max; i += 1) {
            n = node.nodes[i];
            insideCalc = insideCalc || ( n.type === 'function' && n.value === 'calc' );
            if (false !== cb(node.nodes[i], insideCalc)) {
                walk(n, cb, insideCalc);
            }
        }
    }
    return node;
}

function transform (opts) {
    return decl => {
        if (~decl.prop.indexOf('flex')) {
            return;
        }

        decl.value = walk(
            valueParser(decl.value),
            processValueNode.bind(null, opts)
        ).toString();
    };
}


export default postcss.plugin('postcss-convert-values', (opts) => {
    opts = opts || {};
    if (opts.length === undefined && opts.convertLength !== undefined) {
        console.warn('postcss-convert-values: `convertLength` option is deprecated. Use `length`');
        opts.length = opts.convertLength;
    }
    if (opts.length === undefined && opts.convertTime !== undefined) {
        console.warn('postcss-convert-values: `convertTime` option is deprecated. Use `time`');
        opts.time = opts.convertTime;
    }
    return css => {
        css.walkDecls(transform(opts));
    };
});
