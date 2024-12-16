import { nextTick } from 'vue';

import HoverCard from '../../src/components/hover-card.vue';
import Popover from '../../src/components/popover.vue';

import { truncatesText } from '../../src/util/dom';

import { mount } from '../util/lifecycle';

describe('HoverCard', () => {
  it('uses the icon prop', () => {
    const component = mount(HoverCard, {
      props: { icon: 'file' }
    });
    const icon = component.get('.hover-card-heading span');
    icon.classes('icon-file').should.be.true;
  });

  describe('truncateDt prop', () => {
    const Parent = {
      template: `<popover>
        <hover-card icon="file" :truncate-dt="truncateDt">
          <template #title>{{ title }}</template>
          <template #subtitle>foo</template>
          <template #body>
            <dl class="dl-horizontal"><dt>{{ dt }}</dt><dd>{{ dd }}</dd></dl>
          </template>
        </hover-card>
      </popover>`,
      components: { HoverCard, Popover },
      props: {
        title: {
          type: String,
          default: 'x'
        },
        dt: {
          type: String,
          required: true
        },
        dd: {
          type: String,
          default: 'x'
        },
        truncateDt: {
          type: Boolean,
          // This is the opposite of the default in HoverCard.
          default: false
        }
      }
    };
    const setupResize = async (props) => {
      const component = mount(Parent, { props, attachTo: document.body });
      // Wait a tick for the resize to happen.
      await nextTick();

      const { width: hoverCardWidth } = component.get('.hover-card').element
        .getBoundingClientRect();
      const { width: dtWidth } = component.get('dt').element
        .getBoundingClientRect();
      const { width: ddWidth } = component.get('dd').element
        .getBoundingClientRect();
      // 2 for the border.
      hoverCardWidth.should.equal(dtWidth + ddWidth + 2);

      return { component, dtWidth, ddWidth };
    };

    const xs = (count) => 'x'.repeat(count);

    it('truncates the <dt> if truncateDt is true', async () => {
      const { component, dtWidth, ddWidth } = await setupResize({
        dt: xs(50),
        truncateDt: true
      });
      dtWidth.should.equal(144);
      // There aren't any tooltips, so we'll assert text truncation this way.
      truncatesText(component.get('dt').element).should.be.true;
      ddWidth.should.equal(144);
    });

    it('allows the <dt> to grow if truncateDt is false', async () => {
      const { component, dtWidth, ddWidth } = await setupResize({
        dt: xs(50)
      });
      dtWidth.should.be.above(300);
      truncatesText(component.get('dt').element).should.be.false;
      ddWidth.should.be.below(50);
    });

    it('allows the <dd> to grow up to the width of the <dt>', async () => {
      const { component, dtWidth, ddWidth } = await setupResize({
        dt: xs(50),
        dd: xs(100)
      });
      dtWidth.should.be.above(300);
      ddWidth.should.equal(dtWidth);
      truncatesText(component.get('dd').element).should.be.true;
    });

    it('does not allow the title to grow arbitrarily wide', async () => {
      const { component, ddWidth } = await setupResize({
        dt: xs(50),
        title: xs(100)
      });
      truncatesText(component.get('.hover-card-title').element).should.be.true;
      // The long title should not cause the <dd> to grow.
      ddWidth.should.be.below(50);
    });
  });
});
