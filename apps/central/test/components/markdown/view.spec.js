import MarkdownView from '../../../src/components/markdown/view.vue';

import { mount } from '../../util/lifecycle';

const mountComponent = (raw) => mount(MarkdownView, {
  props: {
    rawMarkdown: raw
  }
});

describe('MarkdownView', () => {
  it('renders basic text', () => {
    const component = mountComponent('some text');
    const { outerHTML } = component.get('div').element;
    outerHTML.should.equal('<div class="markdown-view"><p>some text</p>\n</div>');
  });

  it('shows rendered markdown', () => {
    const component = mountComponent('Some **bold** comment');
    const { outerHTML } = component.get('div').element;
    outerHTML.should.equal('<div class="markdown-view"><p>Some <strong>bold</strong> comment</p>\n</div>');
  });

  it('shows a multi-line input rendered on multiple lines', () => {
    const component = mountComponent('Line 1\nLine 2');
    const { outerHTML } = component.get('div').element;
    outerHTML.should.equal('<div class="markdown-view"><p>Line 1<br>Line 2</p>\n</div>');
  });

  it('augments links to add target=_blank and open in new tab', () => {
    const component = mountComponent('[link](https://getodk.org)');
    const { outerHTML } = component.get('div').element;
    outerHTML.should.equal('<div class="markdown-view"><p><a href="https://getodk.org" target="_blank" rel="noreferrer noopener">link</a></p>\n</div>');
  });

  it('does allow raw html in markdown', () => {
    const component = mountComponent('<b>bold</b>');
    const { outerHTML } = component.get('div').element;
    outerHTML.should.equal('<div class="markdown-view"><p><b>bold</b></p>\n</div>');
  });

  it('removes script and svg tags and sanitizes html', () => {
    const component = mountComponent('<script>foo</script><svg>bar</svg>');
    const { outerHTML } = component.get('div').element;
    outerHTML.should.equal('<div class="markdown-view"></div>');
  });

  it('removes unwanted attributes', () => {
    const component = mountComponent('<b style="color: red;" class="c" data-foo="bar">foo</b>');
    const { outerHTML } = component.get('div').element;
    outerHTML.should.equal('<div class="markdown-view"><p><b>foo</b></p>\n</div>');
  });
});
