'use strict';

const getDocAttr = (node, key) => {
   return node.getDocument().getAttributes()[key];
}


module.exports = {
    paragraph: ({ node }) => {
        return `${node.getContent()}`;
    },

    preamble: ({ node }) => {
        return node.getContent();
    },

    embedded: ({ node }) => {
        return node.getContent();
    },

    document: ({ node }) => {
        let title = `# ${node.getTitle()}\n`;
        const date = node.getRevdate();
        let byline = ''
        if (date && date.length) {
            byline += date;
        }

        const revremark = node.getAttributes()['revremark'];
        if (revremark && revremark.length) {
            byline += ' ' + revremark;
        }

        const author = node.getAuthor();
        if (author && author.length) {
            const authorPrefix = getDocAttr(node, 'author-prefix');
            if (authorPrefix) {
                if (byline.length) {
                    byline += ' ';
                }
                byline += authorPrefix + ' ';
            }
            byline += author;
        }
        if (byline.length) {
            byline += '\n';
        }

        let meta = '';
        const keywords = node.getAttributes()['keywords'];
        if (keywords && keywords.length) {
            const keywordsPrefix = getDocAttr(node, 'keywords-prefix');
            if (keywordsPrefix) {
                meta += keywordsPrefix + ' ';
            }
            meta += keywords;

        }
        if (meta.length) {
            meta += '\n';
        }

        return title + byline + meta + '\n' + node.getContent();
    },

    section: ({ node }) => {
        return `${"#".repeat(node.getLevel()+1)} ${node.getTitle()}\n${node.getContent()}`;
    },

    inline_quoted: ({ node }) => {
        if (node.getType() === "strong") {
            return `*${node.getText()}*`
        } else if (node.getType() === "emphasis") {
            return `_${node.getText()}_`
        }

        return node.getText();
    },

    ulist: ({ node }) => {
        let list = "";
        node.getBlocks().forEach((value) => {
           list += `* ${value.getText()}\n`
        })
        return list;
    },

    image:  ({ node }) => {
        const title = node.getTitle();
        const alt = node.getAttributes()['alt'];

        let target = node.getAttributes()['target'];
        if (target.startsWith('/')) {
            // Relative url, expect a base url
            const imageBaseUrl = getDocAttr(node, 'image-base-url');
            if (!imageBaseUrl) {
                throw new Error(
                    `Image has relative url ${target} but no 'image-base-url' attribute provided`
                );
            }
            target = imageBaseUrl + target;
        }
        return `=> ${target} ${title || alt}`;
    }


    /*
    document

    embedded

    outline

    section

    admonition

    audio

    colist

    dlist

    example

    floating-title

    image

    listing

    literal

    stem

    olist

    open

    page_break

    paragraph

    preamble

    quote

    thematic_break

    sidebar

    table

    toc

    ulist

    verse

    video

    inline_anchor

    inline_break

    inline_button

    inline_callout

    inline_footnote

    inline_image

    inline_indexterm

    inline_kbd

    inline_menu

    inline_quoted
    */

};
