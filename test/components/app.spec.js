import { mockRoute } from '../http';

describe('App', () => {
  it('clicking an a.disabled element prevents default', () =>
    mockRoute('/login')
      .restoreSession(false)
      .then(app => {
        const $footer = $(app.vm.$el).find('.panel-footer');
        $footer.length.should.equal(1);
        const $a = $('<a></a>')
          .addClass('disabled')
          .attr('href', '/')
          .text('Root');
        $footer.append($a);
        const click = $.Event('click');
        $a.trigger(click);
        click.isDefaultPrevented().should.be.true();
      }));
});
