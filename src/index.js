'use strict';

const transforms = require('./transforms.js');

function GeminiConverter(Asciidoctor) {
    class GeminiConverter {
        constructor(_backend, _opts) {
            this.outfilesuffix = '.gmi';
            this.filetype = 'gmi';
        }

        $convert(node, transform = null, _opts = {}) {
            const operation = transforms[transform || node.node_name];

            if (!operation) {
                throw new Error(
                    `${operation} operation does not exist. (${transform}, ${node.node_name}, ${node.context})`
                );
            }

            return operation({ node });
        }
    }

    Asciidoctor.ConverterFactory.register(new GeminiConverter('gemini'), ['gemini']);
}

module.exports = GeminiConverter;
module.exports.register = function GeminiConverterFactory() {
    const asciidoctor = require('@asciidoctor/core')();
    return GeminiConverter(asciidoctor);
};
