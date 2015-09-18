'use strict';

import postcss from 'postcss';
import convert from './lib/convert';
import valueParser, {unit} from 'postcss-value-parser';

function processValueNode (opts, node) {
    if (node.type === 'word') {
        let pair = unit(node.value);
        if (pair) {
            let num = Number(pair.number);
            let u = pair.unit.toLowerCase();
            if (num === 0) {
                node.value = (u === 'ms' || u === 's') ? 0 + u : 0;
            } else {
                node.value = convert(num, u, opts);
            }
        }
    }
    if (node.type === 'function' && node.value !== 'calc') {
        return false;
    }
}

function walk (node, cb) {
    var i, max, n;
    if (node.nodes) {
        for (i = 0, max = node.nodes.length; i < max; i += 1) {
            n = node.nodes[i];
            if (false !== cb(node.nodes[i])) {
                walk(n, cb);
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
