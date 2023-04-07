'use strict';

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUPERSCRIPT_LETTERS = 'ᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐⁿᵒᵖ';

const getDocAttr = (node, key) => {
    return node.getDocument().getAttributes()[key];
};

const removeEscapes = (text) => {
    return text.replaceAll(/&#8217;/g, '’');
}

const getDigitAnchor = (number) => {
    if (number >= 10) {
        const numberAsString = '' + number;
        const firstNumber = Number(numberAsString.charAt(0));
        const secondNumber = Number(numberAsString.charAt(1));
        return SUPERSCRIPT_DIGITS.charAt(firstNumber) + SUPERSCRIPT_DIGITS.charAt(secondNumber);
    }
    return SUPERSCRIPT_DIGITS.charAt(number);
}

module.exports = {
    paragraph: ({ node }) => {
        // In gemtext a single line is one paragraph so remove all line breaks.
        // Add an extra line break to the end of each paragraph as that's apparently what most clients expect.
        return node.getContent().replaceAll(/\n/g,' ') + '\n';
    },

    preamble: ({ node }) => {
        return node.getContent();
    },

    embedded: ({ node }) => {
        return node.getContent();
    },

    document: ({ node }) => {
        const titleSeparator = (node.getAttributes()['title-separator'] || ':') + ' ';
        const unformattedDoctitle = node.getTitle();
        const subtitleIndex = unformattedDoctitle.lastIndexOf(titleSeparator);
        let doctitle = unformattedDoctitle;
        if (subtitleIndex > 0) {
            doctitle = unformattedDoctitle.substring(0, subtitleIndex) + ' (' + unformattedDoctitle.substring(subtitleIndex + titleSeparator.length) + ')';
        }
        const title = `# ${removeEscapes(doctitle)}\n`;
        const date = node.getRevdate();
        let byline = '';
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
            if (authorPrefix && authorPrefix.length) {
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
            if (keywordsPrefix && keywordsPrefix.length) {
                meta += keywordsPrefix + ' ';
            }
            meta += keywords;
        }
        if (meta.length) {
            meta += '\n';
        }

        node.setAttribute('_links', []);
        node.setAttribute('_footnotes', []);

        // Calling getContent triggers all the other callbacks

        const content = removeEscapes(node.getContent());

        // This is executed last

        const links = node.getAttributes()['_links'];
        let linksAppendix = '';
        if (links.length) {
            linksAppendix += '\n';
            const linksHeading = getDocAttr(node, 'links-heading');
            if (linksHeading && linksHeading.length) {
                linksAppendix += '## ' + linksHeading + '\n';
            }
            links.forEach((link) => {
                linksAppendix += removeEscapes(link) + '\n';
            });
        }

        const footnotes = node.getAttributes()['_footnotes'];
        let footnotesAppendix = '';
        if (footnotes.length) {
            footnotesAppendix += '\n';
            const footnotesHeading = getDocAttr(node, 'footnotes-heading');
            if (footnotesHeading && footnotesHeading.length) {
                footnotesAppendix += '## ' + footnotesHeading + '\n';
            }
            footnotes.forEach((footnote) => {
                footnotesAppendix += removeEscapes(footnote) + '\n';
            });
        }
        const appendix = linksAppendix.length || footnotesAppendix.length ? '\n' + linksAppendix + footnotesAppendix : '';

        return title + byline + meta + '\n' + content + appendix;
    },

    section: ({ node }) => {
        return `${'#'.repeat(node.getLevel() + 1)} ${node.getTitle()}\n${node.getContent()}`;
    },

    inline_quoted: ({ node }) => {
        if (node.getType() === 'strong') {
            return `*${node.getText()}*`;
        } else if (node.getType() === 'emphasis') {
            return `_${node.getText()}_`;
        }

        return node.getText();
    },

    inline_anchor: ({ node }) => {
        if (node.getTarget().startsWith("#")) {
            // Skip anchor links
            return node.getText();
        }
        if (node.getRole() === 'bare') {
            // For links that are standalone in the text, just print them on their own line in between the text
            return '\n=> ' + node.getTarget() + '\n';
        }
        const storedLinks = getDocAttr(node, '_links');
        const anchorChar = getDigitAnchor(storedLinks.length + 1);
        const title = node.getAttributes()['title'];
        const text = node.getText();
        const linkDescription = title && title.length ? title : text;
        const link = `=> ${node.getTarget()} ${anchorChar} ${linkDescription}`;
        storedLinks.push(link);
        return text + anchorChar;
    },

    inline_footnote: ({ node }) => {
        const storedFootnotes = getDocAttr(node, '_footnotes');
        const anchorChar = SUPERSCRIPT_LETTERS.charAt(storedFootnotes.length);
        const text = node.getText();
        storedFootnotes.push(anchorChar + ' ' + text);
        return anchorChar;
    },
    ulist: ({ node }) => {
        let list = '';
        node.getBlocks().forEach((value, index, arr) => {
            list += `* ${value.getText()}`;
            if (index < arr.length-1) {
                list += '\n';
            }
        });
        return list += '\n';
    },

    image: ({ node }) => {
        const title = node.getTitle();
        const alt = node.getAttributes()['alt'];

        let target = node.getAttributes()['target'];
        if (target.startsWith('/')) {
            // Relative url, might need a base url
            let imageBaseUrl = getDocAttr(node, 'image-base-url');
            if (!imageBaseUrl) {
                imageBaseUrl = '';
            }
            target = imageBaseUrl + target;
        }
        return `=> ${target} ${title || alt}\n`;
    },

    quote: ({ node }) => {
        // Support only flat quotes, remove line breaks
        let content = node.getContent().replace(/(\r\n|\n|\r)/gm, '');

        let byline = '';
        const attribution = node.getAttributes()['attribution'];
        if (attribution && attribution.length) {
            byline += ' -- ' + attribution;
        }

        const citetitle = node.getAttributes()['citetitle'];
        if (citetitle && citetitle.length) {
            if (byline.length) {
                byline += ', ';
            } else {
              byline += ' -- ';
            }
            byline += citetitle;
        }

        return '> ' + content + byline + '\n';
    },

    literal: ({ node }) => {
        let content = '';
        for (const line of node.lines) {
            content += line + '\n';
        }
        return  '```\n' + content + '```\n';
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
