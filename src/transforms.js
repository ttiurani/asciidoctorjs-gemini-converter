'use strict';

module.exports = {
    // TODO: Does not yet do anything

    preamble: ({ node }) => {
        return node.getContent();
    },

    embedded: ({ node }) => {
        return `<embedded>
${node.getContent()}
</embedded>`;
    },

    document: ({ node }) => {
        return `<document>
${node.getContent()}
</document>`;
    },

    section: ({ node }) => {
        return `${node.getTitle()}`;
    },
};
